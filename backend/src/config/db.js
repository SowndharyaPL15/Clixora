const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

// Initialize tables on startup
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        original_url TEXT NOT NULL,
        short_code VARCHAR(50) UNIQUE NOT NULL,
        custom_alias VARCHAR(50) UNIQUE,
        click_count INTEGER DEFAULT 0,
        qr_code TEXT,
        expiry_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
      CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);

      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
        visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        device VARCHAR(50),
        browser VARCHAR(50)
      );

      CREATE INDEX IF NOT EXISTS idx_visits_url_id ON visits(url_id);
    `);
    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
  } finally {
    client.release();
  }
};

pool.on('connect', () => {
  console.log('Database connected successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
