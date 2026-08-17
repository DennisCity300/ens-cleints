const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();
router.use(requireAuth);

function platformCountFor(clientId) {
  return db
    .prepare("SELECT COUNT(*) AS n FROM platforms WHERE client_id = ?")
    .get(clientId).n;
}

router.get("/", (req, res) => {
  const clients = db
    .prepare("SELECT * FROM clients ORDER BY name COLLATE NOCASE ASC")
    .all()
    .map((c) => ({ ...c, platformCount: platformCountFor(c.id) }));
  res.json(clients);
});

router.get("/:id", (req, res) => {
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json(client);
});

router.post("/", (req, res) => {
  const { name, website, notes } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Client name is required" });
  }
  const result = db
    .prepare(
      "INSERT INTO clients (name, website, notes, updated_at) VALUES (?, ?, ?, datetime('now'))"
    )
    .run(String(name).trim(), website || null, notes || null);
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(client);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Client not found" });

  const { name, website, notes } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Client name is required" });
  }
  db.prepare(
    "UPDATE clients SET name = ?, website = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(String(name).trim(), website || null, notes || null, req.params.id);
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  res.json(client);
});

router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Client not found" });
  db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
