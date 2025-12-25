// Главный серверный файл — подключает роуты, статические файлы, конфигурацию
const express = require('express')
const path = require('path')
const config = require('./config')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Статика (frontend)
app.use(express.static(path.join(__dirname, '..', 'public')))

// API routes
app.use('/api', require('./routes/auth'))
app.use('/api', require('./routes/user'))
app.use('/api', require('./routes/rental'))
app.use('/api', require('./routes/sms'))

// Provider webhook
app.use('/', require('./routes/providerWebhook'))

// Basic health
app.get('/health', (req, res) => res.json({ ok: true }))

app.listen(config.port, () => {
	console.log(`Server running on http://localhost:${config.port}`)
})
