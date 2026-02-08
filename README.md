# Factory Inventory & Production Management System (MVP)

A production-ready MVP web application for a single-factory food manufacturing business (Ice packets, Watalappan, etc.) with RBAC, audit trail, FEFO dispatch, and Delivery Note PDF.

## Requirements

- **Node.js** >= 18
- **npm** >= 9
- **Firebase** project (Auth + optional Hosting)
- **MongoDB** (Atlas or local)

## Project structure

```
/
  client/           # React + Vite + TypeScript + Ant Design
    src/
      api/
      app/          # layout, routes, AuthContext
      components/
      pages/
      styles/       # theme.css
      utils/
  server/           # Node + Express + TypeScript + Mongoose
    src/
      config/
      db/           # models
      middleware/
      modules/      # health, me, users, products, suppliers, wholesalers, grn, bom, batches, orders, dispatch, reports, audit
      utils/
    tests/
  docs/
    DEPLOYMENT.md
    USER_GUIDE.md
    ARCHITECTURE.md
  README.md
  package.json      # workspaces: client, server
```

---

## Setup: Clone and install dependencies

**Windows PowerShell:**

```powershell
cd C:\path\to\project
npm install
npm run install --workspace=client
npm run install --workspace=server
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/project
npm install
npm run install --workspace=client
npm run install --workspace=server
```

Or from root: `npm run install:all` (if you add that script: `npm install && npm run install --workspaces`).

---

## Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** → **Sign-in method** → **Email/Password** (enable).
3. **Web app**:
   - Add app → Web → register app → copy config.
   - Put values in `client/.env`:
     - `VITE_FIREBASE_API_KEY=...`
     - `VITE_FIREBASE_AUTH_DOMAIN=...`
     - `VITE_FIREBASE_PROJECT_ID=...`
     - `VITE_FIREBASE_STORAGE_BUCKET=...`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID=...`
     - `VITE_FIREBASE_APP_ID=...`
4. **Service account** (for server):
   - Project settings → Service accounts → Generate new private key.
   - Download JSON. In `server/.env` set:
     - `FIREBASE_PROJECT_ID=...`
     - `FIREBASE_CLIENT_EMAIL=...`
     - `FIREBASE_PRIVATE_KEY=...`
   - **FIREBASE_PRIVATE_KEY**: Paste the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Use real newlines if your editor allows. On **Windows**, if you must use a single line, use `\n` for newlines, e.g. `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"` (one string with backslash-n). Some hosts (e.g. Render) accept multiline paste.

---

## MongoDB setup

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a DB user (username + password).
3. Network access: add IP (e.g. `0.0.0.0/0` for dev, or your IP).
4. Connect → Drivers → copy connection string. Replace `<password>` with the DB user password.
5. In `server/.env`: `MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/factory_inventory?retryWrites=true&w=majority`

Local MongoDB: `MONGODB_URI=mongodb://localhost:27017/factory_inventory`

---

## Environment variables

**server/.env** (create from `server/.env.example`):

- `NODE_ENV=development`
- `PORT=5000`
- `MONGODB_URI=...` (see above)
- `FIREBASE_PROJECT_ID=...`
- `FIREBASE_CLIENT_EMAIL=...`
- `FIREBASE_PRIVATE_KEY=...`
- `OWNER_EMAIL=owner@factory.com` (used by seed)
- `CORS_ORIGINS=http://localhost:5173`
- `API_BASE_URL=http://localhost:5000` (optional)

**client/.env** (create from `client/.env.example`):

- `VITE_API_BASE_URL=/api` (dev with proxy) or `http://localhost:5000/api` (if no proxy)
- `VITE_FIREBASE_*` (all six from Firebase web config)

---

## Run locally (two terminals)

**Terminal 1 — Server**

**Windows PowerShell:**

```powershell
cd C:\path\to\project
npm run dev:server
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/project
npm run dev:server
```

**Terminal 2 — Client**

**Windows PowerShell:**

```powershell
cd C:\path\to\project
npm run dev:client
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/project
npm run dev:client
```

- Backend: http://localhost:5000  
- Frontend: http://localhost:5173  
- Health: http://localhost:5000/api/health → `{ "success": true, "data": { "status": "ok" } }`

---

## Seed data

1. **Create Firebase Auth user for owner**
   - Firebase Console → Authentication → Users → Add user.
   - Email: same as `OWNER_EMAIL` (e.g. `owner@factory.com`).
   - Set a password. Copy the **User UID** (e.g. from the table or user detail).
2. **Set OWNER_FIREBASE_UID in server/.env**
   - `OWNER_FIREBASE_UID=the-uid-you-copied`
3. **Run seed**

**Windows PowerShell:**

```powershell
cd C:\path\to\project
$env:OWNER_EMAIL="owner@factory.com"
$env:OWNER_FIREBASE_UID="paste-uid-here"
npm run seed
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/project
export OWNER_EMAIL=owner@factory.com
export OWNER_FIREBASE_UID=paste-uid-here
npm run seed
```

Seed creates: OWNER user (if not exists), sample supplier, wholesaler, raw materials, finished goods, BOM, one confirmed GRN (with raw stock + movements), one completed batch (finished stock + movements), one order + dispatch. Stock snapshots and movements are aligned.

---

## Testing

**Server (FEFO + BOM consumption)**

**Windows PowerShell:**

```powershell
cd C:\path\to\project
npm run test:server
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/project
npm run test:server
```

**Client (smoke/utility)**

**Windows PowerShell:**

```powershell
cd C:\path\to\project
npm run test:client
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/project
npm run test:client
```

**Manual test checklist**

1. Sign in as owner (email used in seed + Firebase password).
2. **GRN**: Create GRN → Confirm → check raw stock and movements.
3. **Batch**: Create batch → Start → Complete (with consumption + wastage) → check finished stock and movements.
4. **Order**: Create order (or use seed order) → Confirm.
5. **Dispatch**: Create dispatch for confirmed order → check FEFO allocation → download Delivery Note PDF.
6. **Reports**: Stock on hand, movements, expiry, production, wastage.
7. **Audit**: View audit log (owner only).

---

## Troubleshooting

1. **CORS**: Ensure `CORS_ORIGINS` includes the exact origin (e.g. `http://localhost:5173`). No trailing slash.
2. **Firebase token verification failure**: Check `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. On Windows, ensure `FIREBASE_PRIVATE_KEY` uses `\n` for newlines if stored on one line.
3. **Private key formatting**: Key must include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Newlines: real newlines or `\n` in a single string.
4. **403 / User not found**: User must exist in MongoDB (Users collection) with correct `firebaseUid`. Run seed with `OWNER_FIREBASE_UID` or add user via Owner → Users.
5. **Mongo connection failures**: Check `MONGODB_URI`, password encoding, IP allowlist (Atlas), network.
6. **Client 401**: Ensure Firebase Auth user exists and client sends token (check Network tab: `Authorization: Bearer ...`).
7. **GRN confirm fails**: GRN must be DRAFT; items must have valid `rawMaterialId`.
8. **Batch complete fails**: Sufficient raw stock for each consumption line; batch must be IN_PROGRESS.
9. **Dispatch fails**: Order must be CONFIRMED; sufficient finished stock (FEFO) for each order line.
10. **PDF download fails**: User must have access to that dispatch (owner/employee or wholesaler for own order). Check API base URL and CORS.

---

## Hosting

### Backend on Render

1. New Web Service → connect repo.
2. Root directory: `server`.
3. Build: `npm install && npm run build`
4. Start: `npm run start`
5. Env: set all server variables (see docs/DEPLOYMENT.md). Health check URL: `/api/health`.

### Frontend on Firebase Hosting

1. `firebase init hosting` → public directory: `client/dist` (or `dist` if you build client into root dist).
2. Build with production API URL:
   - **Windows PowerShell:** `$env:VITE_API_BASE_URL="https://your-api.onrender.com/api"; npm run build --workspace=client`
   - **Git Bash / WSL / macOS / Linux:** `VITE_API_BASE_URL=https://your-api.onrender.com/api npm run build --workspace=client`
3. If build output is `client/dist`: `firebase deploy --only hosting` (ensure `firebase.json` `public` is `client/dist`).
4. Set production env: client `VITE_API_BASE_URL` → Render URL + `/api`; server `CORS_ORIGINS` → Firebase hosting domain.

See **docs/DEPLOYMENT.md** for full env list and screenshots placeholders.

---

## Quality checklist for submission

- [ ] Demo script: sign in → GRN confirm → batch complete → order confirm → dispatch → PDF → reports → audit.
- [ ] Screenshots: login, dashboard, GRN list, batch list, order list, dispatch PDF, reports, audit.
- [ ] Docs: README (this file), docs/DEPLOYMENT.md, docs/USER_GUIDE.md, docs/ARCHITECTURE.md.
- [ ] Tests: server FEFO + BOM tests; client smoke test; manual checklist above.
- [ ] ESLint + Prettier: run `npm run lint` (and fix) in client and server.
