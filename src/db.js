// Утилита для инициализации и доступа к SQLite (better-sqlite3)
const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const config = require('./config')

const dir = path.dirname(config.dbFile)
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir, { recursive: true })
}

const db = new Database(config.dbFile)

// Выполнить миграции (schema.sql) при старте, если нужно
const schemaPath = path.join(__dirname, '..', 'migrations', 'schema.sql')
const schema = fs.readFileSync(schemaPath, 'utf8')
db.exec(schema)

module.exports = db

// Если запускать npm run migrate, выполнится просто этот файл (скрипт в package.json)
if (require.main === module) {
	console.log('Database initialized at', config.dbFile)
}
