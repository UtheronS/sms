-- SQLite schema for temporary SMS MVP

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  balance REAL DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rentals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_id TEXT,
  provider_rental_id TEXT,
  phone_number TEXT,
  status TEXT NOT NULL, -- NEW | WAIT_SMS | RECEIVED | TIMEOUT | CANCELLED
  start_at TEXT,
  end_at TEXT,
  rent_minutes INTEGER,
  max_sms INTEGER DEFAULT 3,
  price REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY,
  rental_id TEXT NOT NULL,
  from_number TEXT,
  text TEXT,
  received_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(rental_id) REFERENCES rentals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL,
  type TEXT, -- debit | credit
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);