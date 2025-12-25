// Сервис управления арендой номеров — логика выдачи, завершения, приёма SMS
const models = require('../models')
const config = require('../config')
const mockProvider = require('./provider/mockProvider')
// Если нужно подключить реального провайдера, замените mockProvider на реализацию adapter.js

const provider = mockProvider // change here if you implement another provider

// В памяти храним таймеры для автоматического завершения аренды
const rentalTimers = new Map() // rentalId -> timeoutId

module.exports = {
	// Создать аренду: списать баланс, запросить номер у провайдера, запустить таймер
	createRental: async ({ user, minutes }) => {
		if (minutes < config.minRentMinutes || minutes > config.maxRentMinutes) {
			throw new Error(
				`Rent minutes must be between ${config.minRentMinutes} and ${config.maxRentMinutes}`
			)
		}

		// Limit active rentals
		const activeCount = models.getActiveRentalsCountForUser(user.id)
		if (activeCount >= config.maxConcurrentRents) {
			const e = new Error('Max concurrent rentals reached')
			e.code = 'MAX_CONCURRENT'
			throw e
		}

		// Price calculation (simple flat price * minutes / minRentMinutes)
		const unitPrice = config.defaultRentPrice
		const price = parseFloat(
			(unitPrice * (minutes / config.minRentMinutes)).toFixed(2)
		)

		if ((user.balance || 0) < price) {
			const e = new Error('Insufficient balance')
			e.code = 'NO_BALANCE'
			throw e
		}

		// Deduct balance & record transaction
		const newBalance = parseFloat((user.balance - price).toFixed(2))
		models.updateUserBalance(user.id, newBalance)
		models.addTransaction(user.id, -price, 'debit')

		// Allocate number via provider
		const alloc = await provider.allocateNumber({ ttlMinutes: minutes })
		const now = new Date().toISOString()
		const endAt = new Date(Date.now() + minutes * 60 * 1000).toISOString()

		const rentalId = models.createRental({
			user_id: user.id,
			provider_id: alloc.provider_id,
			provider_rental_id: alloc.provider_rental_id,
			phone_number: alloc.phone_number,
			status: 'WAIT_SMS',
			start_at: now,
			end_at: endAt,
			rent_minutes: minutes,
			max_sms: config.maxSmsPerRent,
			price,
		})

		// Start timer to finalize rental
		const timeoutId = setTimeout(async () => {
			try {
				await module.exports.finishRentalTimeout(rentalId)
			} catch (err) {
				console.error('Error finishing rental', err)
			}
		}, minutes * 60 * 1000)

		rentalTimers.set(rentalId, timeoutId)

		return {
			id: rentalId,
			phone_number: alloc.phone_number,
			provider_rental_id: alloc.provider_rental_id,
			price,
			end_at: endAt,
		}
	},

	cancelRental: async (rentalId, userId) => {
		const rental = models.getRentalById(rentalId)
		if (!rental) throw new Error('Rental not found')
		if (rental.user_id !== userId) throw new Error('Not allowed')

		// Cancel provider allocation
		if (rental.provider_rental_id) {
			try {
				await provider.cancelNumber(rental.provider_rental_id)
			} catch (err) {
				console.warn('Provider cancel failed', err.message)
			}
		}

		// Update status
		models.updateRentalStatus(rentalId, {
			status: 'CANCELLED',
			end_at: new Date().toISOString(),
		})

		// Clear timer
		const t = rentalTimers.get(rentalId)
		if (t) {
			clearTimeout(t)
			rentalTimers.delete(rentalId)
		}

		return true
	},

	// Called when TTL expired
	finishRentalTimeout: async rentalId => {
		const rental = models.getRentalById(rentalId)
		if (!rental) return
		// If already in RECEIVED or CANCELLED, skip
		if (['RECEIVED', 'CANCELLED', 'TIMEOUT'].includes(rental.status)) return

		// Check if any messages exist
		const smsCount = models.getSmsCountForRental(rentalId)
		if (smsCount > 0) {
			models.updateRentalStatus(rentalId, {
				status: 'RECEIVED',
				end_at: new Date().toISOString(),
			})
		} else {
			models.updateRentalStatus(rentalId, {
				status: 'TIMEOUT',
				end_at: new Date().toISOString(),
			})
		}

		// Cancel provider allocation
		if (rental.provider_rental_id) {
			try {
				await provider.cancelNumber(rental.provider_rental_id)
			} catch (err) {
				console.warn('Provider cancel failed', err.message)
			}
		}

		// Clear timer
		const t = rentalTimers.get(rentalId)
		if (t) {
			clearTimeout(t)
			rentalTimers.delete(rentalId)
		}

		return true
	},

	// Внешний webhook-приёмник должен вызывать этот метод при получении SMS от провайдера
	handleIncomingSms: async ({ provider_rental_id, from, text }) => {
		// Найти rental по provider_rental_id
		const db = require('../db')
		const rental = db
			.prepare('SELECT * FROM rentals WHERE provider_rental_id = ?')
			.get(provider_rental_id)
		if (!rental) {
			// Возможно, уже освобождён или провайдер другой — ignore
			console.warn(
				'Rental not found for provider_rental_id',
				provider_rental_id
			)
			return false
		}

		// Check max sms per rental
		const smsCount = models.getSmsCountForRental(rental.id)
		if (smsCount >= (rental.max_sms || config.maxSmsPerRent)) {
			console.warn('SMS limit reached for rental', rental.id)
			return false
		}

		// Save message
		models.addSmsMessage(rental.id, from, text)

		// Update rental status to RECEIVED
		models.updateRentalStatus(rental.id, { status: 'RECEIVED' })

		// Optionally, we can finish rental early (cancel provider and clear timer)
		// For MVP — we keep the number until TTL expires; we could also end early:
		const t = rentalTimers.get(rental.id)
		if (t) {
			clearTimeout(t)
			rentalTimers.delete(rental.id)
			// set a short timeout to finalize quickly (e.g., 30s) or finalize immediately:
			setTimeout(async () => {
				await module.exports.finishRentalTimeout(rental.id)
			}, 1000 * 5)
		}

		return true
	},
}
