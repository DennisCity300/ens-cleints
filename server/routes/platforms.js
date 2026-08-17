const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");
const { encrypt, decrypt } = require("../crypto");

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

function assertClientExists(clientId, res) {
  const client = db.prepare("SELECT id FROM clients WHERE id = ?").get(clientId);
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return false;
  }
  return true;
}

// List platforms for a client (passwords masked)
router.get("/", (req, res) => {
  const { clientId } = req.params;
  if (!assertClientExists(clientId, res)) return;
  const rows = db
    .prepare(
      "SELECT * FROM platforms WHERE client_id = ? ORDER BY sort_order ASC, created_at ASC"
    )
    .all(clientId);
  res.json(rows.map((r) => toSafe(r)));
});

// Get a single platform with password revealed
router.get("/:platformId/reveal", (req, res) => {
  const { clientId, platformId } = req.params;
  const row = db
    .prepare("SELECT * FROM platforms WHERE id = ? AND client_id = ?")
    .get(platformId, clientId);
  if (!row) return res.status(404).json({ error: "Platform not found" });
  res.json(toSafe(row, { reveal: true }));
});

router.post("/", (req, res) => {
  const { clientId } = req.params;
  if (!assertClientExists(clientId, res)) return;

  const { platformType, label, url, username, password, notes } = req.body || {};
  if (!label || !String(label).trim()) {
    return res.status(400).json({ error: "Platform label is required" });
  }

  const maxOrder = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM platforms WHERE client_id = ?")
    .get(clientId).m;

  const result = db
    .prepare(
      `INSERT INTO platforms
        (client_id, platform_type, label, url, username, password_enc, notes, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      clientId,
      platformType || "other",
      String(label).trim(),
      url || null,
      username || null,
      encrypt(password),
      notes || null,
      maxOrder + 1
    );

  const row = db.prepare("SELECT * FROM platforms WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(toSafe(row, { reveal: true }));
});

router.put("/reorder", (req, res) => {
  const { clientId } = req.params;
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: "order must be an array of platform ids" });

  const update = db.prepare(
    "UPDATE platforms SET sort_order = ? WHERE id = ? AND client_id = ?"
  );
  const tx = db.transaction((ids) => {
    ids.forEach((id, idx) => update.run(idx, id, clientId));
  });
  tx(order);
  res.json({ ok: true });
});

router.put("/:platformId", (req, res) => {
  const { clientId, platformId } = req.params;
  const existing = db
    .prepare("SELECT * FROM platforms WHERE id = ? AND client_id = ?")
    .get(platformId, clientId);
  if (!existing) return res.status(404).json({ error: "Platform not found" });

  const { platformType, label, url, username, password, notes } = req.body || {};
  if (!label || !String(label).trim()) {
    return res.status(400).json({ error: "Platform label is required" });
  }

  // Keep existing password if the client didn't send a new one (sentinel: undefined vs "")
  const nextPasswordEnc =
    password === undefined ? existing.password_enc : encrypt(password);

  db.prepare(
    `UPDATE platforms
       SET platform_type = ?, label = ?, url = ?, username = ?, password_enc = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    platformType || "other",
    String(label).trim(),
    url || null,
    username || null,
    nextPasswordEnc,
    notes || null,
    platformId
  );

  const row = db.prepare("SELECT * FROM platforms WHERE id = ?").get(platformId);
  res.json(toSafe(row, { reveal: true }));
});

router.delete("/:platformId", (req, res) => {
  const { clientId, platformId } = req.params;
  const existing = db
    .prepare("SELECT * FROM platforms WHERE id = ? AND client_id = ?")
    .get(platformId, clientId);
  if (!existing) return res.status(404).json({ error: "Platform not found" });
  db.prepare("DELETE FROM platforms WHERE id = ?").run(platformId);
  res.json({ ok: true });
});

module.exports = router;
