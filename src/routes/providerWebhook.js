// Webhook endpoint для mock-провайдера (и пример интеграции реального провайдера).
// Провайдеры обычно POST'ят сюда данные о входящих SMS.

const express = require('express')
const router = express.Router()
const rentalService = require('../services/rentalService')

// POST /provider/webhook
// body: { provider_rental_id, from, text }
router.post('/provider/webhook', async (req, res) => {
	try {
		const { provider_rental_id, from, text } = req.body
		if (!provider_rental_id || !text)
			return res
				.status(400)
				.json({ error: 'provider_rental_id and text required' })

		await rentalService.handleIncomingSms({ provider_rental_id, from, text })
		return res.json({ ok: true })
	} catch (err) {
		console.error('Webhook error', err)
		return res.status(500).json({ error: 'Server error' })
	}
})

module.exports = router
