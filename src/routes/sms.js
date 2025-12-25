// Роут для получения SMS для аренды
const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const models = require('../models')

// GET /api/rent/:id/sms
router.get('/rent/:id/sms', auth.requireAuth, (req, res) => {
	try {
		const rental = models.getRentalById(req.params.id)
		if (!rental) return res.status(404).json({ error: 'Not found' })
		if (rental.user_id !== req.user.id)
			return res.status(403).json({ error: 'Not allowed' })

		const sms = models.getSmsForRental(rental.id)
		return res.json({ sms, status: rental.status, end_at: rental.end_at })
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

module.exports = router
