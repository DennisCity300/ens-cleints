const path = require("path");
const fs = require("fs");
const { createClient } = require("@libsql/client");

function resolveUrl() {
  // TURSO_DATABASE_URL points at a hosted libsql://... database (Render/prod).
  // Unset locally: falls back to a plain file on disk, no account needed.
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  const dataDir = path.join(__dirname, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const abs = path.join(dataDir, "enspirefx.db").split(path.sep).join("/");
  return `file:${abs}`;
}

const client = createClient({
  url: resolveUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    website TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS platforms (
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
  )`,
  `CREATE INDEX IF NOT EXISTS idx_platforms_client_id ON platforms(client_id)`,
];

async function init() {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }
}

function toNumber(value) {
  return typeof value === "bigint" ? Number(value) : value;
}

async function get(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return rs.rows[0];
}

async function all(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return rs.rows;
}

async function run(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return { changes: toNumber(rs.rowsAffected), lastInsertRowid: toNumber(rs.lastInsertRowid) };
}

// Runs multiple statements atomically. Used instead of relying on
// PRAGMA foreign_keys / ON DELETE CASCADE, since pragma state isn't
// guaranteed to persist per-statement against a remote libsql connection.
async function batch(statements) {
  await client.batch(
    statements.map((s) => ({ sql: s.sql, args: s.args || [] })),
    "write"
  );
}

module.exports = { init, get, all, run, batch };
