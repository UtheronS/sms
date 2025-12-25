// JWT middleware для защиты приватных роутов
const jwt = require('jsonwebtoken')
const config = require('../config')
const models = require('../models')

module.exports = {
	requireAuth: (req, res, next) => {
		const authHeader = req.headers.authorization
		if (!authHeader)
			return res.status(401).json({ error: 'No authorization header' })
		const parts = authHeader.split(' ')
		if (parts.length !== 2 || parts[0] !== 'Bearer')
			return res.status(401).json({ error: 'Invalid authorization header' })
		const token = parts[1]

		try {
			const payload = jwt.verify(token, config.jwtSecret)
			const user = models.getUserById(payload.sub)
			if (!user) return res.status(401).json({ error: 'User not found' })
			req.user = user
			next()
		} catch (err) {
			return res.status(401).json({ error: 'Invalid token' })
		}
	},
}
