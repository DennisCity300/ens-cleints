const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "enspirefx.db");
const conn = new DatabaseSync(dbPath);

conn.exec("PRAGMA journal_mode = WAL");
conn.exec("PRAGMA foreign_keys = ON");

conn.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    website TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform_type TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT,
    username TEXT,
    password_enc TEXT,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_platforms_client_id ON platforms(client_id);
`);

const db = {
  prepare: (sql) => conn.prepare(sql),
  exec: (sql) => conn.exec(sql),
  transaction: (fn) => {
    return (...args) => {
      conn.exec("BEGIN");
      try {
        const result = fn(...args);
        conn.exec("COMMIT");
        return result;
      } catch (err) {
        conn.exec("ROLLBACK");
        throw err;
      }
    };
  },
};

module.exports = db;
