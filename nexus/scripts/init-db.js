// Simple DB initializer for development using better-sqlite3
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'db.sqlite');
const db = new Database(dbFile);

db.exec(`
CREATE TABLE IF NOT EXISTS inventory_pins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  pin TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS inventory_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  user_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  expires_at INTEGER
);
`);

// Insert demo PIN if not present
const row = db.prepare('SELECT * FROM inventory_pins WHERE pin = ?').get('24680');
if (!row) {
  db.prepare('INSERT INTO inventory_pins (user_id, pin) VALUES (?, ?)').run('user_demo', '24680');
  console.log('Inserted demo PIN 24680 for user_demo');
} else {
  console.log('Demo PIN already present');
}

console.log('Database initialized at', dbFile);
