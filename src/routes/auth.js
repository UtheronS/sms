// Роуты регистрации и логина
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../config')
const models = require('../models')
const { v4: uuidv4 } = require('uuid')

// POST /api/register
router.post('/register', async (req, res) => {
	try {
		const { email, password } = req.body
		if (!email || !password)
			return res.status(400).json({ error: 'Email and password required' })
		const existing = models.getUserByEmail(email)
		if (existing) return res.status(409).json({ error: 'Email already used' })

		const passwordHash = await bcrypt.hash(password, 10)
		const user = models.createUser(email, passwordHash, 5.0) // give initial balance 5 for testing
		const token = jwt.sign({ sub: user.id }, config.jwtSecret, {
			expiresIn: config.jwtExpiresIn,
		})
		return res.json({ token })
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

// POST /api/login
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body
		const user = models.getUserByEmail(email)
		if (!user) return res.status(401).json({ error: 'Invalid credentials' })
		const ok = await bcrypt.compare(password, user.password_hash)
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
		const token = jwt.sign({ sub: user.id }, config.jwtSecret, {
			expiresIn: config.jwtExpiresIn,
		})
		return res.json({ token })
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

module.exports = router
