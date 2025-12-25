// Конфигурация из .env с базовыми значениями
const dotenv = require('dotenv')
dotenv.config()

module.exports = {
	port: process.env.PORT || 3000,
	jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
	dbFile: process.env.DATABASE_FILE || './data/db.sqlite',
	defaultRentPrice: parseFloat(process.env.DEFAULT_RENT_PRICE || '1.0'),
	minRentMinutes: parseInt(process.env.MIN_RENT_MINUTES || '5', 10),
	maxRentMinutes: parseInt(process.env.MAX_RENT_MINUTES || '30', 10),
	cooldownSeconds: parseInt(process.env.COOLDOWN_SECONDS || '30', 10),
	maxConcurrentRents: parseInt(process.env.MAX_CONCURRENT_RENTS || '2', 10),
	maxSmsPerRent: parseInt(process.env.MAX_SMS_PER_RENT || '3', 10),
}
