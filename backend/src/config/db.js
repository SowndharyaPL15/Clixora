const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

let sqlite;
let pool;

if (isPostgres) {
  const isLocalhost = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalhost ? false : { rejectUnauthorized: false }
  });
  console.log('Database connected: PostgreSQL');
} else {
  // Ensure data directory exists
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'clixora.db');
  sqlite = new Database(dbPath);

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  console.log(`Database connected: SQLite (${dbPath})`);
}

/**
 * Translate PostgreSQL-flavored SQL to SQLite-compatible SQL.
 * This lets all existing controllers work without modification.
 */
const translateSQL = (sql) => {
  let translated = sql;

  // $1, $2, $3 → ?
  translated = translated.replace(/\$\d+/g, '?');

  // SERIAL PRIMARY KEY → INTEGER PRIMARY KEY AUTOINCREMENT
  translated = translated.replace(
    /SERIAL\s+PRIMARY\s+KEY/gi,
    'INTEGER PRIMARY KEY AUTOINCREMENT'
  );

  // TIMESTAMP WITH TIME ZONE → TEXT
  translated = translated.replace(/TIMESTAMP\s+WITH\s+TIME\s+ZONE/gi, 'TEXT');

  // VARCHAR(n) → TEXT (SQLite is typeless for text)
  translated = translated.replace(/VARCHAR\s*\(\d+\)/gi, 'TEXT');

  // DEFAULT CURRENT_TIMESTAMP → DEFAULT (datetime('now'))
  translated = translated.replace(
    /DEFAULT\s+CURRENT_TIMESTAMP/gi,
    "DEFAULT (datetime('now'))"
  );

  // NOW() → datetime('now')
  translated = translated.replace(/NOW\(\)/gi, "datetime('now')");

  // INTERVAL '14 days' → '-14 days' (used with datetime)
  // Pattern: datetime('now') - INTERVAL '14 days' → datetime('now', '-14 days')
  translated = translated.replace(
    /datetime\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s+days'/gi,
    "datetime('now', '-$1 days')"
  );

  return translated;
};

/**
 * PostgreSQL-compatible query interface.
 * Returns { rows: [...] } just like pg's pool.query().
 */
const query = async (text, params = []) => {
  if (isPostgres) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err) {
      console.error('PostgreSQL query error:', err.message);
      console.error('SQL:', text);
      console.error('Params:', params);
      throw err;
    }
  }

  // SQLite Path
  const sql = translateSQL(text);
  const trimmed = sql.trim().toUpperCase();

  try {
    if (
      trimmed.startsWith('SELECT') ||
      trimmed.startsWith('WITH')
    ) {
      // Read query
      const stmt = sqlite.prepare(sql);
      const rows = stmt.all(...params);
      return { rows };
    } else if (sql.toUpperCase().includes('RETURNING')) {
      // Write query with RETURNING clause — SQLite doesn't support RETURNING natively
      const withoutReturning = sql.replace(/\s+RETURNING\s+.*/i, '');
      const stmt = sqlite.prepare(withoutReturning);
      const info = stmt.run(...params);

      if (trimmed.startsWith('INSERT')) {
        // Fetch the inserted row
        const tableName = extractTableName(sql, 'INSERT');
        if (tableName) {
          const row = sqlite
            .prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`)
            .get(info.lastInsertRowid);
          return { rows: row ? [row] : [] };
        }
      } else if (trimmed.startsWith('UPDATE')) {
        // For UPDATE...RETURNING, re-fetch updated rows
        const tableName = extractTableName(sql, 'UPDATE');
        const whereMatch = withoutReturning.match(/WHERE\s+(.+)/i);
        if (tableName && whereMatch) {
          const whereClause = whereMatch[1];
          const setClause = withoutReturning.match(/SET\s+(.+?)\s+WHERE/i);
          const setParamCount = setClause
            ? (setClause[1].match(/\?/g) || []).length
            : 0;
          const whereParams = params.slice(setParamCount);
          const row = sqlite
            .prepare(`SELECT * FROM ${tableName} WHERE ${whereClause}`)
            .get(...whereParams);
          return { rows: row ? [row] : [] };
        }
      }

      return { rows: [] };
    } else {
      // Plain write query
      const stmt = sqlite.prepare(sql);
      const info = stmt.run(...params);
      return { rows: [], changes: info.changes };
    }
  } catch (err) {
    console.error('SQLite query error:', err.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw err;
  }
};

/**
 * Extract table name from SQL statement.
 */
const extractTableName = (sql, type) => {
  if (type === 'INSERT') {
    const match = sql.match(/INSERT\s+INTO\s+(\w+)/i);
    return match ? match[1] : null;
  }
  if (type === 'UPDATE') {
    const match = sql.match(/UPDATE\s+(\w+)/i);
    return match ? match[1] : null;
  }
  return null;
};

/**
 * Initialize database tables.
 */
const initDb = async () => {
  if (isPostgres) {
    try {
      await pool.query(`
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
          password_hash VARCHAR(255),
          max_clicks INTEGER,
          is_active BOOLEAN DEFAULT TRUE,
          ai_summary TEXT,
          category VARCHAR(50) DEFAULT 'General',
          notes TEXT,
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

      // Run migrations for existing databases
      await pool.query(`
        ALTER TABLE urls ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ALTER TABLE urls ADD COLUMN IF NOT EXISTS max_clicks INTEGER;
        ALTER TABLE urls ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        ALTER TABLE urls ADD COLUMN IF NOT EXISTS ai_summary TEXT;
        ALTER TABLE urls ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General';
        ALTER TABLE urls ADD COLUMN IF NOT EXISTS notes TEXT;
      `);

      console.log('PostgreSQL tables initialized and migrated successfully.');
    } catch (err) {
      console.error('Failed to initialize PostgreSQL database tables:', err);
    }
  } else {
    try {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS urls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          original_url TEXT NOT NULL,
          short_code TEXT UNIQUE NOT NULL,
          custom_alias TEXT UNIQUE,
          click_count INTEGER DEFAULT 0,
          qr_code TEXT,
          expiry_date TEXT,
          password_hash TEXT,
          max_clicks INTEGER,
          is_active INTEGER DEFAULT 1,
          ai_summary TEXT,
          category TEXT DEFAULT 'General',
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
        CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);

        CREATE TABLE IF NOT EXISTS visits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
          visited_at TEXT DEFAULT (datetime('now')),
          ip_address TEXT,
          device TEXT,
          browser TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_visits_url_id ON visits(url_id);
      `);

      // Run SQLite migration to add missing columns
      try {
        const columns = sqlite.prepare("PRAGMA table_info(urls)").all();
        const columnNames = columns.map(c => c.name);
        if (!columnNames.includes('password_hash')) {
          sqlite.exec("ALTER TABLE urls ADD COLUMN password_hash TEXT");
        }
        if (!columnNames.includes('max_clicks')) {
          sqlite.exec("ALTER TABLE urls ADD COLUMN max_clicks INTEGER");
        }
        if (!columnNames.includes('is_active')) {
          sqlite.exec("ALTER TABLE urls ADD COLUMN is_active INTEGER DEFAULT 1");
        }
        if (!columnNames.includes('ai_summary')) {
          sqlite.exec("ALTER TABLE urls ADD COLUMN ai_summary TEXT");
        }
        if (!columnNames.includes('category')) {
          sqlite.exec("ALTER TABLE urls ADD COLUMN category TEXT DEFAULT 'General'");
        }
        if (!columnNames.includes('notes')) {
          sqlite.exec("ALTER TABLE urls ADD COLUMN notes TEXT");
        }
      } catch (err) {
        console.error('Failed to migrate SQLite columns:', err);
      }

      console.log('SQLite database tables initialized and migrated successfully.');
    } catch (err) {
      console.error('Failed to initialize SQLite database tables:', err);
    }
  }
};

initDb();

module.exports = {
  query,
  pool: isPostgres ? pool : sqlite,
};
