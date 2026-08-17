# EnspireFX Client Access Credentials

A private, local web app for managing your clients' website credentials — cPanel, WordPress,
webmail, hosting, domains, social, and more — organized per client with a per-platform side menu,
encrypted-at-rest storage, and one-click PDF export.

## Stack

- **Backend**: Node.js + Express, `node:sqlite` (built into Node, no native build step), session
  cookie auth, AES-256-GCM encryption of every stored password, PDF generation with `pdfkit`.
- **Frontend**: Vite + React + TypeScript, styled to match the Google Search Console look, set in
  IBM Plex Sans throughout — including the PDF export, which embeds the actual font files.

## First-time setup

Requires Node.js 22.5+ (for `node:sqlite`). You're on a recent enough version already.

1. **Configure the backend.** `server/.env` has already been created for local use with a random
   encryption key and session secret. **Change `ADMIN_USERNAME` / `ADMIN_PASSWORD` in
   `server/.env`** to your own login before you start entering real client data.

2. **Install dependencies** (first time only):

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. **Run it** — two terminals:

   ```bash
   cd server && npm run dev
   ```

   ```bash
   cd client && npm run dev
   ```

   Open http://localhost:5173 and sign in with the username/password from `server/.env`.

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

## Deploying to production

This app is a single Node process once built — no database server, no separate frontend host. That
keeps deployment simple, but given what it stores, **where** you put that one process matters more
than usual.

### 1. Build

```bash
cd client && npm run build
```

This compiles the React app into `server/public`. From here on, the `server/` folder is the whole
deployable app — `server/data/enspirefx.db`, `server/fonts/`, `server/public/`, and `server/.env`
all travel together.

### 2. Pick where it runs

Because everything (encrypted credentials, sessions, PDF generation) lives in one process with a
local SQLite file, you need a host with a **persistent filesystem** you control — not a stateless
/ serverless platform that wipes disk on redeploy. In order of what I'd recommend for this data:

- **A VPS or dedicated box you already control** (you run StellerHost accounts, so you likely have
  something suitable already) — full control over firewall, TLS, and who can even reach the
  server. This is the right choice for something holding live production passwords for 77 clients.
- **A private/internal server, or the app only reachable over a VPN or SSH tunnel** — if nobody
  outside your team needs to open this from a random network, don't put it on the public internet
  at all. That's the strongest option and worth seriously considering.
- Avoid free-tier shared/PaaS hosting for this one — plaintext-adjacent encrypted secrets deserve a
  box you know the access list for.

### 3. Run it as a service

```bash
cd server
npm install --omit=dev   # on the server, not your machine
NODE_ENV=production node index.js
```

Use a process manager so it survives reboots and crashes — `pm2` is the simplest:

```bash
npm install -g pm2
pm2 start index.js --name enspirefx-credentials --cwd /path/to/server
pm2 save
pm2 startup   # prints the command to enable pm2 on boot
```

(A `systemd` unit works just as well if you prefer that on a Linux VPS.)

### 4. Put TLS in front of it — non-negotiable here

Never expose port 4310 directly. Put nginx (or Caddy, which does Let's Encrypt automatically) in
front, terminating HTTPS, and proxy to `localhost:4310`:

```nginx
server {
    listen 443 ssl;
    server_name credentials.yourdomain.com;
    ssl_certificate     /etc/letsencrypt/live/credentials.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/credentials.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4310;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`server/index.js` already sets `trust proxy` and only marks the session cookie `secure` when
`NODE_ENV=production`, so this works out of the box once TLS is in place — but the cookie *will*
refuse to be sent over plain HTTP in production, so don't skip this step.

Consider also restricting access at the network layer beyond the app's own login — an IP allowlist
in nginx/your firewall, or putting the whole thing behind a VPN — since this is a single shared
login guarding every client's live credentials, not a multi-tenant system with audit trails.

### 5. Before you flip it on

- Change `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `server/.env` to something real — it's still the
  placeholder from local testing.
- Back up `server/data/enspirefx.db` **and** `server/.env`'s `ENCRYPTION_KEY` together, somewhere
  safe (e.g. your password manager) and separate from the server itself. Lose the key and the
  encrypted passwords in the database become permanently unrecoverable.
- Set up a recurring backup of `server/data/enspirefx.db` (a nightly `cp` to encrypted storage is
  enough at this scale) — it's now the single source of truth for every client's credentials.
