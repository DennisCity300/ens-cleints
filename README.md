# EnspireFX Client Access Credentials

A private, local web app for managing your clients' website credentials — cPanel, WordPress,
webmail, hosting, domains, social, and more — organized per client with a per-platform side menu,
encrypted-at-rest storage, and one-click PDF export.

## Stack

- **Backend**: Node.js + Express, `@libsql/client` for storage (a plain local SQLite file with no
  account needed for local use; the same code points at a hosted Turso database in production, for
  hosts without a persistent local disk), session cookie auth, AES-256-GCM encryption of every
  stored password, PDF generation with `pdfkit`.
- **Frontend**: Vite + React + TypeScript, styled to match the Google Search Console look, set in
  IBM Plex Sans throughout — including the PDF export, which embeds the actual font files.

## First-time setup

1. **Configure the backend.** `server/.env` has already been created for local use with a random
   encryption key and session secret. **Change `ADMIN_USERNAME` / `ADMIN_PASSWORD` in
   `server/.env`** to your own login before you start entering real client data.

2. **Install dependencies** (first time only, from the repo root — it's an npm workspace):

   ```bash
   npm install
   ```

3. **Run it for local development** — two terminals, with hot reload on the frontend:

   ```bash
   cd server && npm run dev
   ```

   ```bash
   cd client && npm run dev
   ```

   Open http://localhost:5173 and sign in with the username/password from `server/.env`.

   Or run it as one process, closer to how it behaves in production:

   ```bash
   npm run build
   npm start
   ```

   Open http://localhost:4310. On Windows, double-click **`Start EnspireFX Credentials.bat`** to
   do the same thing without touching a terminal.

## How it's organized

- Top-left switcher lets you search and jump between clients.
- Selecting a client shows a side menu of every platform you've added for them (cPanel,
  WordPress, webmail, etc.) — click one to view its URL, username, and password.
- Passwords are masked by default; click the eye icon to reveal, or the copy icon to copy
  without ever displaying it.
- **Download PDF** on a client's page exports all of that client's credentials as a clean PDF.

## Security notes

- Every password is encrypted at rest with AES-256-GCM using `ENCRYPTION_KEY` from `.env` — the
  SQLite file on disk never contains plaintext passwords.
- Losing `ENCRYPTION_KEY` means the stored passwords cannot be decrypted, so back it up somewhere
  safe (a password manager, not this repo).
- This project folder lives inside OneDrive, so the database file (`server/data/enspirefx.db`)
  will sync to the cloud like any other file here. The encryption means a synced copy isn't
  readable without the key, but if you'd rather it not sync at all, move `server/data/` outside
  OneDrive or exclude that folder from sync.
- `server/.env` (which holds the encryption key, session secret, and login password) is
  git-ignored — never commit it.
- There's a single shared login for the whole app (not per-client), matching what was asked for.
  If you need per-user accounts or audit logs later, that's a bigger change worth planning
  separately.

## Deploying to production (Render + Turso, both free tier)

This is the supported path for a $0, reachable-from-anywhere deployment. It splits the app into
two free pieces: **Turso** for the database (a hosted, SQLite-compatible store — the app's local
file DB and Turso are the same driver, `@libsql/client`, so no query changes are needed to move
between them) and **Render** for running the server.

### 1. Create the Turso database

1. Sign up at [turso.tech](https://turso.tech) (free, no credit card for the free tier).
2. Create a database (any name, e.g. `enspirefx-credentials`).
3. From its dashboard, grab the **Database URL** (`libsql://...`) and generate an **auth token**.
   You'll paste both into Render's environment variables in step 3.

### 2. Push the code to a private GitHub repo

Render deploys from GitHub. The repo is already initialized and committed locally
(`git log` in this folder to confirm) — create a **private** repo on GitHub and push:

```bash
git remote add origin https://github.com/<you>/enspirefx-credentials.git
git push -u origin master
```

`.env`, the local database file, and `node_modules` are all git-ignored already — nothing
sensitive goes up with this push.

### 3. Create the Render web service

1. Sign up at [render.com](https://render.com) and connect your GitHub account.
2. **New → Web Service**, pick the repo you just pushed.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Instance type: **Free**.
6. Environment variables (Render's dashboard, not a file):

   | Key | Value |
   |---|---|
   | `ADMIN_USERNAME` | your real login username |
   | `ADMIN_PASSWORD` | your real login password (not the local placeholder) |
   | `ENCRYPTION_KEY` | generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — **save this somewhere safe outside Render too** |
   | `SESSION_SECRET` | generate the same way, a different value |
   | `COOKIE_SECURE` | `true` (Render terminates HTTPS for you) |
   | `TURSO_DATABASE_URL` | from step 1 |
   | `TURSO_AUTH_TOKEN` | from step 1 |
   | `NODE_ENV` | `production` |

7. Deploy. Render gives you a URL like `https://enspirefx-credentials.onrender.com` — that's the
   whole app, reachable from any device.

### Know the trade-offs of the free tier

- **Cold starts**: Render's free web services sleep after ~15 minutes of no traffic. The first
  request after a gap takes 30–60 seconds to wake back up — expected, not a bug.
- **Losing `ENCRYPTION_KEY` is unrecoverable.** It only lives in Render's environment variables and
  wherever you separately saved it — back it up (a password manager, not this repo) before you
  stop thinking about it. Without it, every stored password in Turso is permanently unreadable.
- Every future code change: `git push` to the same repo, Render redeploys automatically.

### If you outgrow the free tier

Nothing about the app is Render/Turso-specific — the same code runs as a normal long-lived Node
process on any VPS (unset `TURSO_DATABASE_URL` to fall back to a local file, put nginx/Caddy in
front for TLS, run it under `pm2` or `systemd`), if you'd rather self-host on something you fully
control once this is handling real client access to production systems day to day.
