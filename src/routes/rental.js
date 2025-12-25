// Роуты для создания, получения, отмены аренды
const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const rateLimit = require('../middleware/rateLimit')
const rentalService = require('../services/rentalService')
const models = require('../models')

// POST /api/rent
router.post(
	'/rent',
	auth.requireAuth,
	rateLimit.checkCooldownAndLimits,
	async (req, res) => {
		try {
			const minutes = parseInt(req.body.minutes || 5, 10)
			const result = await rentalService.createRental({
				user: req.user,
				minutes,
			})
			return res.json(result)
		} catch (err) {
			console.error(err)
			if (err.code === 'NO_BALANCE')
				return res.status(402).json({ error: err.message })
			if (err.code === 'MAX_CONCURRENT')
				return res.status(429).json({ error: err.message })
			return res.status(400).json({ error: err.message })
		}
	}
)

// GET /api/rent/:id
router.get('/rent/:id', auth.requireAuth, async (req, res) => {
	try {
		const rental = models.getRentalById(req.params.id)
		if (!rental) return res.status(404).json({ error: 'Not found' })
		if (rental.user_id !== req.user.id)
			return res.status(403).json({ error: 'Not allowed' })
		return res.json(rental)
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

// POST /api/rent/:id/cancel
router.post('/rent/:id/cancel', auth.requireAuth, async (req, res) => {
	try {
		await rentalService.cancelRental(req.params.id, req.user.id)
		return res.json({ ok: true })
	} catch (err) {
		console.error(err)
		return res.status(400).json({ error: err.message })
	}
})

module.exports = router
