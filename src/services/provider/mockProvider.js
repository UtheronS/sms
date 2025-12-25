// Mock-провайдер (для локальной разработки).
// Он не общается с реальным API — имитирует выдачу номера и webhook.
// Для интеграции с реальным SMS-агрегатором замените реализацию.

const { v4: uuidv4 } = require('uuid')

// Простая генерация «US» номера для локальной разработки
function genUSNumber() {
	// +1 202 xxx xxxx (using Washington D.C. area code 202)
	const n = Math.floor(1000000 + Math.random() * 9000000)
	return `+1202${n}`
}

const allocations = new Map() // provider_rental_id -> { phone_number, created_at }

module.exports = {
	providerId: 'mock-provider',

	// Запрос номера у провайдера
	allocateNumber: async ({ ttlMinutes }) => {
		const provider_rental_id = 'mock_' + uuidv4()
		const phone_number = genUSNumber()
		allocations.set(provider_rental_id, {
			phone_number,
			created_at: Date.now(),
			ttlMinutes,
		})
		// вернуть минимальный набор данных
		return {
			provider_rental_id,
			phone_number,
			provider_id: module.exports.providerId,
		}
	},

	// Отмена аренды у провайдера
	cancelNumber: async providerRentalId => {
		allocations.delete(providerRentalId)
		return { success: true }
	},

	// Poll сообщений (mock — реальные сообщения добавляются через webhook /provider/webhook)
	pollMessages: async providerRentalId => {
		// Mock не хранит сообщения; messages хранятся в локальной БД sms_messages,
		// поэтому pollMessages может вернуть empty array.
		// Для интеграции реального провайдера — делайте HTTP запросы к провайдеру.
		return []
	},
}
