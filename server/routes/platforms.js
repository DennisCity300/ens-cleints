const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");
const { encrypt, decrypt } = require("../crypto");
const asyncRoute = require("../asyncRoute");

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

function toSafe(row, { reveal } = { reveal: false }) {
  return {
    id: row.id,
    clientId: row.client_id,
    platformType: row.platform_type,
    label: row.label,
    url: row.url,
    username: row.username,
    password: reveal ? decrypt(row.password_enc) : row.password_enc ? "••••••••" : "",
    hasPassword: !!row.password_enc,
    notes: row.notes,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

async function assertClientExists(clientId, res) {
  const client = await db.get("SELECT id FROM clients WHERE id = ?", [clientId]);
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return false;
  }
  return true;
}

// List platforms for a client (passwords masked)
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const { clientId } = req.params;
    if (!(await assertClientExists(clientId, res))) return;
    const rows = await db.all(
      "SELECT * FROM platforms WHERE client_id = ? ORDER BY sort_order ASC, created_at ASC",
      [clientId]
    );
    res.json(rows.map((r) => toSafe(r)));
  })
);

// Get a single platform with password revealed
router.get(
  "/:platformId/reveal",
  asyncRoute(async (req, res) => {
    const { clientId, platformId } = req.params;
    const row = await db.get("SELECT * FROM platforms WHERE id = ? AND client_id = ?", [
      platformId,
      clientId,
    ]);
    if (!row) return res.status(404).json({ error: "Platform not found" });
    res.json(toSafe(row, { reveal: true }));
  })
);

router.post(
  "/",
  asyncRoute(async (req, res) => {
    const { clientId } = req.params;
    if (!(await assertClientExists(clientId, res))) return;

    const { platformType, label, url, username, password, notes } = req.body || {};
    if (!label || !String(label).trim()) {
      return res.status(400).json({ error: "Platform label is required" });
    }

    const maxOrderRow = await db.get(
      "SELECT COALESCE(MAX(sort_order), -1) AS m FROM platforms WHERE client_id = ?",
      [clientId]
    );

    const result = await db.run(
      `INSERT INTO platforms
        (client_id, platform_type, label, url, username, password_enc, notes, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        clientId,
        platformType || "other",
        String(label).trim(),
        url || null,
        username || null,
        encrypt(password),
        notes || null,
        maxOrderRow.m + 1,
      ]
    );

    const row = await db.get("SELECT * FROM platforms WHERE id = ?", [result.lastInsertRowid]);
    res.status(201).json(toSafe(row, { reveal: true }));
  })
);

router.put(
  "/reorder",
  asyncRoute(async (req, res) => {
    const { clientId } = req.params;
    const { order } = req.body || {};
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: "order must be an array of platform ids" });
    }

    await db.batch(
      order.map((id, idx) => ({
        sql: "UPDATE platforms SET sort_order = ? WHERE id = ? AND client_id = ?",
        args: [idx, id, clientId],
      }))
    );
    res.json({ ok: true });
  })
);

router.put(
  "/:platformId",
  asyncRoute(async (req, res) => {
    const { clientId, platformId } = req.params;
    const existing = await db.get("SELECT * FROM platforms WHERE id = ? AND client_id = ?", [
      platformId,
      clientId,
    ]);
    if (!existing) return res.status(404).json({ error: "Platform not found" });

    const { platformType, label, url, username, password, notes } = req.body || {};
    if (!label || !String(label).trim()) {
      return res.status(400).json({ error: "Platform label is required" });
    }

    // Keep existing password if the client didn't send a new one (sentinel: undefined vs "")
    const nextPasswordEnc = password === undefined ? existing.password_enc : encrypt(password);

    await db.run(
      `UPDATE platforms
         SET platform_type = ?, label = ?, url = ?, username = ?, password_enc = ?, notes = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        platformType || "other",
        String(label).trim(),
        url || null,
        username || null,
        nextPasswordEnc,
        notes || null,
        platformId,
      ]
    );

    const row = await db.get("SELECT * FROM platforms WHERE id = ?", [platformId]);
    res.json(toSafe(row, { reveal: true }));
  })
);

router.delete(
  "/:platformId",
  asyncRoute(async (req, res) => {
    const { clientId, platformId } = req.params;
    const existing = await db.get("SELECT * FROM platforms WHERE id = ? AND client_id = ?", [
      platformId,
      clientId,
    ]);
    if (!existing) return res.status(404).json({ error: "Platform not found" });
    await db.run("DELETE FROM platforms WHERE id = ?", [platformId]);
    res.json({ ok: true });
  })
);

module.exports = router;
