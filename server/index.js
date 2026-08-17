require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/clients");
const platformRoutes = require("./routes/platforms");
const pdfRoutes = require("./routes/pdf");

const REQUIRED_ENV = ["ADMIN_USERNAME", "ADMIN_PASSWORD", "ENCRYPTION_KEY", "SESSION_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy server/.env.example to server/.env and fill in the values.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4310;
const isProd = process.env.NODE_ENV === "production";
// Whether this process is actually reachable over HTTPS (directly or via a
// TLS-terminating reverse proxy) — NOT the same thing as NODE_ENV=production.
// Running the production build locally over plain http://localhost is a
// normal, supported setup, and cookies marked Secure are silently dropped
// by express-session on a non-TLS connection, which would break login there.
// Only set COOKIE_SECURE=true once real TLS is in front of this server.
const cookieSecure = process.env.COOKIE_SECURE === "true";

app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));

if (!isProd) {
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
}

app.use(
  session({
    name: "efx.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure,
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/clients/:clientId/platforms", platformRoutes);
app.use("/api", pdfRoutes);

if (isProd) {
  const staticDir = path.join(__dirname, "public");
  app.use(express.static(staticDir));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`EnspireFX credentials server listening on http://localhost:${PORT}`);
});
