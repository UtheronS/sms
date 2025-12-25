// Роуты получения информации о пользователе и балансе
const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const models = require('../models')

// GET /api/me
router.get('/me', auth.requireAuth, (req, res) => {
	const user = models.getUserById(req.user.id)
	res.json(user)
})

// GET /api/balance
router.get('/balance', auth.requireAuth, (req, res) => {
	const user = models.getUserById(req.user.id)
	res.json({ balance: user.balance })
})

module.exports = router
