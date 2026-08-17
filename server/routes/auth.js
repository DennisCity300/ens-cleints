const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

let cachedHash = null;
function getAdminHash() {
  if (!cachedHash) {
    const plain = process.env.ADMIN_PASSWORD || "";
    cachedHash = bcrypt.hashSync(plain, 10);
  }
  return cachedHash;
}

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const expectedUsername = process.env.ADMIN_USERNAME || "";

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== expectedUsername ||
    !bcrypt.compareSync(password, getAdminHash())
  ) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  req.session.authenticated = true;
  req.session.username = username;
  res.json({ ok: true, username });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("efx.sid");
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.json({ authenticated: true, username: req.session.username });
  }
  res.json({ authenticated: false });
});

module.exports = router;
