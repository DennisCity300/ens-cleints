const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");
const asyncRoute = require("../asyncRoute");

const router = express.Router();
router.use(requireAuth);

async function platformCountFor(clientId) {
  const row = await db.get("SELECT COUNT(*) AS n FROM platforms WHERE client_id = ?", [clientId]);
  return row.n;
}

router.get(
  "/",
  asyncRoute(async (req, res) => {
    const clients = await db.all("SELECT * FROM clients ORDER BY name COLLATE NOCASE ASC");
    const withCounts = await Promise.all(
      clients.map(async (c) => ({ ...c, platformCount: await platformCountFor(c.id) }))
    );
    res.json(withCounts);
  })
);

router.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const client = await db.get("SELECT * FROM clients WHERE id = ?", [req.params.id]);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  })
);

router.post(
  "/",
  asyncRoute(async (req, res) => {
    const { name, website, notes } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Client name is required" });
    }
    const result = await db.run(
      "INSERT INTO clients (name, website, notes, updated_at) VALUES (?, ?, ?, datetime('now'))",
      [String(name).trim(), website || null, notes || null]
    );
    const client = await db.get("SELECT * FROM clients WHERE id = ?", [result.lastInsertRowid]);
    res.status(201).json(client);
  })
);

router.put(
  "/:id",
  asyncRoute(async (req, res) => {
    const existing = await db.get("SELECT * FROM clients WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Client not found" });

    const { name, website, notes } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Client name is required" });
    }
    await db.run(
      "UPDATE clients SET name = ?, website = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
      [String(name).trim(), website || null, notes || null, req.params.id]
    );
    const client = await db.get("SELECT * FROM clients WHERE id = ?", [req.params.id]);
    res.json(client);
  })
);

router.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    const existing = await db.get("SELECT * FROM clients WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Client not found" });
    // Explicit cascade — don't rely on ON DELETE CASCADE / PRAGMA foreign_keys
    // persisting across statements on a remote libsql connection.
    await db.batch([
      { sql: "DELETE FROM platforms WHERE client_id = ?", args: [req.params.id] },
      { sql: "DELETE FROM clients WHERE id = ?", args: [req.params.id] },
    ]);
    res.json({ ok: true });
  })
);

module.exports = router;
