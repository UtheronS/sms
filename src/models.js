// Набор простых helper-queries для работы с БД
const db = require('./db')
const { v4: uuidv4 } = require('uuid')

module.exports = {
	createUser: (email, passwordHash, balance = 0, role = 'user') => {
		const id = uuidv4()
		const stmt = db.prepare(
			'INSERT INTO users (id, email, password_hash, balance, role) VALUES (?, ?, ?, ?, ?)'
		)
		stmt.run(id, email, passwordHash, balance, role)
		return { id, email, balance, role }
	},

	getUserByEmail: email => {
		return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
	},

	getUserById: id => {
		return db
			.prepare(
				'SELECT id, email, balance, role, created_at FROM users WHERE id = ?'
			)
			.get(id)
	},

	updateUserBalance: (userId, newBalance) => {
		db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(
			newBalance,
			userId
		)
	},

	addTransaction: (userId, amount, type) => {
		const id = uuidv4()
		db.prepare(
			'INSERT INTO transactions (id, user_id, amount, type) VALUES (?, ?, ?, ?)'
		).run(id, userId, amount, type)
		return id
	},

	createRental: rental => {
		// rental: {id, user_id, provider_id, provider_rental_id, phone_number, status, start_at, end_at, rent_minutes, max_sms, price}
		const id = rental.id || uuidv4()
		db.prepare(
			`INSERT INTO rentals
      (id, user_id, provider_id, provider_rental_id, phone_number, status, start_at, end_at, rent_minutes, max_sms, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
		).run(
			id,
			rental.user_id,
			rental.provider_id || null,
			rental.provider_rental_id || null,
			rental.phone_number || null,
			rental.status || 'NEW',
			rental.start_at || null,
			rental.end_at || null,
			rental.rent_minutes || null,
			rental.max_sms || null,
			rental.price || 0
		)
		return id
	},

	updateRentalStatus: (rentalId, fields) => {
		// fields: object of columns to update
		const keys = Object.keys(fields)
		const sets = keys.map(k => `${k} = ?`).join(', ')
		const stmt = db.prepare(`UPDATE rentals SET ${sets} WHERE id = ?`)
		const values = keys.map(k => fields[k])
		values.push(rentalId)
		stmt.run(...values)
	},

	getRentalById: id => {
		return db.prepare('SELECT * FROM rentals WHERE id = ?').get(id)
	},

	getActiveRentalsCountForUser: userId => {
		return db
			.prepare(
				"SELECT COUNT(*) as cnt FROM rentals WHERE user_id = ? AND status IN ('NEW','WAIT_SMS')"
			)
			.get(userId).cnt
	},

	addSmsMessage: (rentalId, fromNumber, text) => {
		const id = uuidv4()
		db.prepare(
			'INSERT INTO sms_messages (id, rental_id, from_number, text) VALUES (?, ?, ?, ?)'
		).run(id, rentalId, fromNumber, text)
		return id
	},

	getSmsForRental: rentalId => {
		return db
			.prepare(
				'SELECT * FROM sms_messages WHERE rental_id = ? ORDER BY received_at ASC'
			)
			.all(rentalId)
	},

	getSmsCountForRental: rentalId => {
		return db
			.prepare('SELECT COUNT(*) as cnt FROM sms_messages WHERE rental_id = ?')
			.get(rentalId).cnt
	},
}
