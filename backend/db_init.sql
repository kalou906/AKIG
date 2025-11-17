-- Minimal schema for AKIG backend (run this in your Postgres database 'akig')

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  party TEXT,
  start_date DATE,
  end_date DATE,
  amount NUMERIC,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id),
  paid_at DATE,
  amount NUMERIC,
  method TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
