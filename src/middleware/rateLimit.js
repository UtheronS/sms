// Простая реализация cooldown и лимита активных аренд в памяти
const config = require('../config')

const userCooldowns = new Map() // userId => timestamp

module.exports = {
	checkCooldownAndLimits: (req, res, next) => {
		const user = req.user
		const now = Date.now()
		const last = userCooldowns.get(user.id) || 0
		if (now - last < config.cooldownSeconds * 1000) {
			const wait = Math.ceil(
				(config.cooldownSeconds * 1000 - (now - last)) / 1000
			)
			return res
				.status(429)
				.json({ error: `Cooldown active. Try again in ${wait}s` })
		}
		// Active rentals limit enforced in rental route via models.getActiveRentalsCountForUser
		userCooldowns.set(user.id, now)
		next()
	},
}
