# Factory Inventory & Production Management System (MVP) — Setup (All-in-One)

This is the **single master setup document** to run the system locally and optionally deploy. Follow steps in order.

---

## Project requirements

| Requirement | Notes |
| --- | --- |
| **Node.js** | >= 18 (recommend **Node 20 LTS**) |
| **npm** | >= 9 |
| **Firebase project** | Auth (Email/Password) + Service Account for server |
| **MongoDB** | Atlas (recommended) or local |

---

## Folder map

```text
/
  client/                 # React + Vite + TypeScript + Ant Design
    src/
      api/                # api client (baseURL from VITE_API_BASE_URL)
      app/                # App, AuthContext, MainLayout
      pages/              # Login, Dashboard, GRN, BOM, Batches, Orders, Dispatches, Reports, Audit, etc.
      utils/              # firebase.ts, format tests
    .env                  # VITE_API_BASE_URL, VITE_FIREBASE_*
    .env.example
  server/                 # Node + Express + TypeScript + Mongoose
    src/
      config/             # env.ts, firebase.ts
      db/                 # models
      middleware/         # auth, errorHandler, validate
      modules/            # health, me, users, products, grn, bom, batches, orders, dispatch, reports, audit
      seed.ts
      utils/              # fefo, pdf, audit, batchId
    tests/                # fefo.test.ts, bom-consumption.test.ts
    .env                  # MONGODB_URI, FIREBASE_*, OWNER_*, CORS_ORIGINS
    .env.example
  docs/
    SETUP_ALL_IN_ONE.md   # this file
    DEPLOYMENT.md
    USER_GUIDE.md
    ARCHITECTURE.md
  package.json            # workspaces: client, server
```

---

## Quick start (5 minutes)

Use this **only** after Firebase (Email/Password + Service Account) and MongoDB Atlas are ready and env files are filled.

**Windows PowerShell:**

```powershell
cd C:\path\to\InventoryManagementSystem
npm install
copy server\.env.example server\.env
copy client\.env.example client\.env
# Edit server\.env and client\.env with your values (see sections below)
# Create OWNER in Firebase Auth, set OWNER_EMAIL and OWNER_FIREBASE_UID in server\.env
npm run dev:server
# In a second terminal:
npm run dev:client
npm run seed
# Open http://localhost:5173 → Login with OWNER email/password
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/InventoryManagementSystem
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env and client/.env with your values (see sections below)
# Create OWNER in Firebase Auth, set OWNER_EMAIL and OWNER_FIREBASE_UID in server/.env
npm run dev:server
# In a second terminal:
npm run dev:client
npm run seed
# Open http://localhost:5173 → Login with OWNER email/password
```

---

## 1. Clone and install dependencies

From the **repository root** (monorepo uses npm workspaces; one install installs both client and server).

**Windows PowerShell:**

```powershell
cd C:\path\to\InventoryManagementSystem
npm install
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/InventoryManagementSystem
npm install
```

**Expected:** `node_modules` at root and inside `client/` and `server/`. No errors.

### Verify (Install)

- Root `package.json` has `"workspaces": ["client", "server"]`.
- From root you can run: `npm run dev:server`, `npm run dev:client`, `npm run seed`, `npm run test:server`, `npm run test:client`.

---

## 2. Firebase setup

### 2.1 Create project and enable Email/Password

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a project (or use existing).
3. **Authentication** → **Sign-in method** → **Email/Password** → Enable → Save.

### 2.2 Web app config (client)

1. Project **Settings** (gear) → **Your apps** → **Add app** → **Web** (</>).
2. Register app, copy the config object. You will need:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
3. These go into `client/.env` as `VITE_FIREBASE_*` (see Section 6).

### 2.3 Service account (server)

1. Firebase Console → **Project settings** → **Service accounts**.
2. **Generate new private key** → Download JSON.
3. From the JSON you need:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 2.4 Setting FIREBASE_PRIVATE_KEY on Windows

The private key must include newlines. Two options:

**Option A — Multiline in file (preferred if your editor allows):**

Paste the key in `server/.env` with real line breaks:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
...
-----END PRIVATE KEY-----"
```

**Option B — Single line with `\n`:**

Use one string and replace each newline with the two characters backslash + n:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n...\n-----END PRIVATE KEY-----"
```

The server code (in `server/src/config/env.ts`) replaces `\n` with real newlines before passing to Firebase Admin.

### Verify (Firebase)

- Firebase Auth shows Email/Password enabled.
- Service account JSON downloaded; you have `project_id`, `client_email`, `private_key`.

---

## 3. MongoDB Atlas setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a cluster (free tier is fine).
3. **Database Access** → Add user → set username and password → grant **Atlas admin** or **Read and write to any database**.
4. **Network Access** → Add IP → for dev you can use `0.0.0.0/0` (allow from anywhere) or add your IP.
5. **Database** → **Connect** → **Drivers** → copy connection string.
6. Replace `<password>` in the string with the DB user password. If the password contains special characters, URL-encode them.
7. Append database name if not in the string: e.g. `...mongodb.net/factory_inventory?retryWrites=true&w=majority`.
8. Put the final URI in `server/.env` as `MONGODB_URI` (see Section 6).

**Example:**

```env
MONGODB_URI=mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/factory_inventory?retryWrites=true&w=majority
```

### Verify (MongoDB)

- You can connect to the cluster from Atlas UI; IP allowlist includes your environment (or 0.0.0.0/0 for dev).

---

## 4. Environment variables (client and server)

### 4.1 Create env files from examples

**Windows PowerShell:**

```powershell
cd C:\path\to\InventoryManagementSystem
copy server\.env.example server\.env
copy client\.env.example client\.env
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/InventoryManagementSystem
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 4.2 Server (`server/.env`)

| Key | Required | Description | Example |
| --- | --- | --- | --- |
| `NODE_ENV` | No | Environment | `development` |
| `PORT` | No | Server port | `5000` |
| `MONGODB_URI` | **Yes** | MongoDB connection string | See Section 3 |
| `FIREBASE_PROJECT_ID` | **Yes** | From service account JSON | `my-project-id` |
| `FIREBASE_CLIENT_EMAIL` | **Yes** | From service account JSON | `firebase-adminsdk-xxx@my-project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | **Yes** | Full private key (see 2.4) | See Section 2.4 |
| `OWNER_EMAIL` | For seed | Email of OWNER user in Firebase | `owner@factory.com` |
| `OWNER_FIREBASE_UID` | For seed | Firebase UID of that user | From Firebase Auth user table |
| `CORS_ORIGINS` | No | Comma-separated origins, no trailing slash | [http://localhost:5173](http://localhost:5173) |
| `API_BASE_URL` | No | Public API URL (e.g. PDF links) | [http://localhost:5000](http://localhost:5000) |
| `RATE_LIMIT_ENABLED` | No | Enable API rate limiting | `true` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms | `900000` |
| `RATE_LIMIT_MAX` | No | Max requests per window per IP | `100` |

### 4.3 Client (`client/.env`)

| Key | Required | Description | Example |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | API base path or full URL | `/api` (dev with proxy) |
| `VITE_FIREBASE_API_KEY` | **Yes** | From Firebase web config | From Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | | `my-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | | `my-project` |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Yes** | | `my-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | | Numeric |
| `VITE_FIREBASE_APP_ID` | **Yes** | | `1:123:web:abc` |

**Connecting frontend to backend:**

- **Local dev:** Set `VITE_API_BASE_URL=/api`. The Vite dev server proxies `/api` to [http://localhost:5000](http://localhost:5000) (see `client/vite.config.ts`). So the client calls `/api/health`, `/api/me`, etc., and they hit the backend.
- **Production build:** Set `VITE_API_BASE_URL` to your deployed API URL, for example [https://your-backend.onrender.com/api](https://your-backend.onrender.com/api), when building the client.

### Verify (Environment)

- No `.env` files are committed (they are in `.gitignore`).
- After editing, server starts without "Invalid environment variables" (Section 7).

---

## Troubleshooting

### "User record not found" after sign-in

If Firebase sign-in succeeds but the app shows you are not registered, it means the Firebase user exists but there is no matching user in MongoDB. Fix:

1. Ensure `OWNER_EMAIL` and `OWNER_FIREBASE_UID` in `server/.env` match the Firebase Auth user.
2. Run `npm run seed` to create the OWNER user in MongoDB.
3. Sign in again.

### Windows esbuild/Vite issues (OneDrive/EPERM)

If Vite fails with dependency pre-bundle errors on Windows/OneDrive, try:

- Use **Node 20 LTS**.
- Close other dev servers and delete `client/node_modules/.vite`.
- Run `npm install` again from the repo root.

---

## 5. CORS setup

The server reads `CORS_ORIGINS` from `server/.env`, splits by comma, and allows those origins.

- **Local:** `CORS_ORIGINS` should be the frontend URL, for example [http://localhost:5173](http://localhost:5173) (no trailing slash). This is the default in `server/src/config/env.ts`.
- **Production:** After deploying the frontend, set `CORS_ORIGINS` to the deployed frontend URL(s), for example [https://your-app.web.app](https://your-app.web.app), [https://your-app.firebaseapp.com](https://your-app.firebaseapp.com).

### Verify (CORS)

- With only the client open at [http://localhost:5173](http://localhost:5173), API requests do not show CORS errors in the browser console.

---

## 6. Run backend and frontend (two terminals)

### Terminal 1 — Backend

**Windows PowerShell:**

```powershell
cd C:\path\to\InventoryManagementSystem
npm run dev:server
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/InventoryManagementSystem
npm run dev:server
```

**Expected:** `Server listening on port 5000` (or your `PORT`). Backend base URL: **[http://localhost:5000](http://localhost:5000)**.

### Terminal 2 — Frontend

**Windows PowerShell:**

```powershell
cd C:\path\to\InventoryManagementSystem
npm run dev:client
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/InventoryManagementSystem
npm run dev:client
```

**Expected:** Vite dev server at **[http://localhost:5173](http://localhost:5173)**.

### Verify health route

**Browser:** Open [http://localhost:5000/api/health](http://localhost:5000/api/health)  

**Expected:** JSON: `{ "success": true, "data": { "status": "ok", "timestamp": "..." } }`

**curl (Windows PowerShell):**

```powershell
curl http://localhost:5000/api/health
```

**curl (Git Bash / WSL / macOS / Linux):**

```bash
curl http://localhost:5000/api/health
```

**Expected:** Same JSON.

---

## 7. Login flow and RBAC mapping

1. User signs in on the client with **Firebase Email/Password** (client SDK).
2. Client gets Firebase ID token and sends it on every API request: `Authorization: Bearer <idToken>`.
3. Server verifies the token with **Firebase Admin** (`server/src/config/firebase.ts`). If invalid → **401**.
4. Server looks up the user in MongoDB **Users** by `firebaseUid`. If not found → **403** "User record not found. Contact admin to be added to the system."
5. Role (OWNER / EMPLOYEE / WHOLESALER) is read from the MongoDB User document and enforced per route (e.g. audit and users only for OWNER).

So: **Firebase Auth** = identity; **MongoDB Users** = app role and access. The OWNER must exist in both; seed creates the MongoDB user once you provide `OWNER_FIREBASE_UID`.

### Verify (Login)

- After seed and login with OWNER email/password, dashboard and menus load; no 401/403 on protected routes.

---

## 8. Seed data (very important)

Seed creates the OWNER user in MongoDB (if not exists), sample supplier, wholesaler, products, BOM, a confirmed GRN (with raw stock and movements), a completed batch (consumption, wastage, finished stock with expiry), and an order + dispatch.

### 8.1 Create OWNER in Firebase

1. Firebase Console → **Authentication** → **Users** → **Add user**.
2. Email: use the same email you will put in `OWNER_EMAIL` (e.g. `owner@factory.com`).
3. Set a password (remember it for login).
4. After creation, copy the user’s **UID** (from the table or user detail). This is `OWNER_FIREBASE_UID`.

### 8.2 Set OWNER_EMAIL and OWNER_FIREBASE_UID in server env

In `server/.env`:

```env
OWNER_EMAIL=owner@factory.com
OWNER_FIREBASE_UID=paste-the-uid-from-firebase-here
```

### 8.3 Run seed

**Windows PowerShell:**

```powershell
cd C:\path\to\InventoryManagementSystem
npm run seed
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/InventoryManagementSystem
npm run seed
```

**Expected:** Logs like "Connected to MongoDB", "Owner user: [owner@factory.com](mailto:owner@factory.com)", "Seed completed.", then process exits.

### Verify seeded data in UI

1. Open [http://localhost:5173](http://localhost:5173).
2. Log in with OWNER email and password (the one you created in Firebase).
3. Check: Dashboard, **Suppliers** (Sample Supplier), **Wholesalers** (Sample Wholesaler), **Products** (raw + finished), **BOM**, **GRN** (confirmed), **Batches** (completed), **Orders**, **Dispatches**, **Reports**, **Audit** (as OWNER).

---

## 9. Automated testing

### 9.1 Server tests (FEFO + BOM consumption)

**Windows PowerShell:**

```powershell
cd C:\path\to\InventoryManagementSystem
npm run test:server
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/InventoryManagementSystem
npm run test:server
```

**Expected:** Vitest runs `server/tests/fefo.test.ts` and `server/tests/bom-consumption.test.ts`; all tests pass.

### 9.2 Client tests

**Windows PowerShell:**

```powershell
cd C:\path\to\InventoryManagementSystem
npm run test:client
```

**Git Bash / WSL / macOS / Linux:**

```bash
cd /path/to/InventoryManagementSystem
npm run test:client
```

**Expected:** Vitest runs client tests (e.g. `client/src/utils/format.test.ts`); all pass.

### Run all tests from root

```bash
npm run test
```

Runs both `test:server` and `test:client`.

---

## 10. Manual end-to-end test checklist

Do in this order to validate the full flow.

1. **Create/confirm GRN**  
   GRN list → Create GRN (supplier, items) → Save as DRAFT → Confirm. Check raw stock and stock movements.

2. **Create BOM**  
   BOM list → Create BOM (finished product + raw components with qty per unit). Save.

3. **Create / start / complete batch**  
   Batches → Create batch (finished product, planned qty, consumption lines from BOM, wastage optional) → Start → Complete (actual qtys, wastage, finished qty). Check raw consumption, finished stock with expiry, and movements.

4. **Create order (wholesaler or internal)**  
   Orders → Create order (wholesaler, items). Save. Confirm order.

5. **Confirm + dispatch using FEFO**  
   Dispatches → Create dispatch for the confirmed order. Server allocates by FEFO (earliest expiry first). Check dispatch record and stock deductions.

6. **Download Delivery Note PDF**  
   Dispatches → open a dispatch → Download PDF. Endpoint: `GET /api/dispatches/:id/pdf`. File should open as PDF.

7. **Reports + audit logs**  
   Reports: stock on hand, movements, expiry, production, wastage. Audit (OWNER only): view audit log entries.

---

## 11. Common issues and fixes

| Issue | Fix |
| --- | --- |
| **Node version** | Use **Node 20 LTS**. Check: `node -v`. If you use nvm: `nvm use 20`. |
| **OneDrive / Windows file locking (EPERM, ENOTEMPTY)** | Move project outside OneDrive, or disable OneDrive sync for the project folder. Run terminal as Administrator only if necessary; prefer moving repo. |
| **esbuild install / version blank on Windows** | Some Windows setups have issues with optional deps. Try: `npm cache clean --force`, delete `node_modules` and `package-lock.json`, then `npm install` again. Or use WSL for development. |
| **CORS errors** | Ensure `CORS_ORIGINS` in `server/.env` exactly matches the frontend origin (e.g. `http://localhost:5173`), no trailing slash. Restart server after changing. |
| **401 Firebase token verification** | Check `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Key must include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. On Windows single-line, use `\n` for newlines. |
| **403 user not found in MongoDB** | User must exist in MongoDB Users with correct `firebaseUid`. Run seed with `OWNER_FIREBASE_UID` set, or add user via OWNER → Users. |
| **Mongo connection errors** | Check `MONGODB_URI`: correct password, URL-encoded special chars, correct cluster host. Atlas Network Access: allow your IP (or 0.0.0.0/0 for dev). |

---

## 12. Optional deployment

### 12.1 Backend (Render / Railway)

- **Root directory:** `server` (if repo is monorepo).
- **Build:** `npm install && npm run build`
- **Start:** `npm run start`
- **Env vars (set in dashboard):**  
  `NODE_ENV`, `PORT`, `MONGODB_URI`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `CORS_ORIGINS` (deployed frontend URL), `API_BASE_URL` (public backend URL). Optional: `OWNER_EMAIL`, `OWNER_FIREBASE_UID` if you run seed from a one-off job.
- **Health check URL:** `/api/health` (expect 200 and `{ "success": true, "data": { "status": "ok" } }`).

### 12.2 Frontend (Firebase Hosting)

1. Install Firebase CLI: `npm install -g firebase-tools` → `firebase login`.
2. In repo root: `firebase init hosting` → choose existing project → **Public directory:** `client/dist` → Single-page app: Yes.
3. Build with **production** API URL:
   - **Windows PowerShell:**  
     `$env:VITE_API_BASE_URL="https://your-api.onrender.com/api"; npm run build --workspace=client`
   - **Git Bash / WSL / macOS / Linux:**  
     `VITE_API_BASE_URL=https://your-api.onrender.com/api npm run build --workspace=client`
4. Deploy: `firebase deploy --only hosting`.
5. Set `firebase.json` `"public": "client/dist"` if needed so the build output is used.

### 12.3 Post-deploy

- Set backend **CORS_ORIGINS** to the Firebase Hosting domain (e.g. `https://your-app.web.app`).
- Run seed once against production DB (with production `MONGODB_URI`, `OWNER_EMAIL`, `OWNER_FIREBASE_UID`); create the OWNER user in Firebase Auth first and copy UID.

More detail: **docs/DEPLOYMENT.md**.

---

## Notes

- **Root scripts:** From root, `npm run install:all` runs `npm install` (installs all workspaces). `npm run dev:server` / `npm run dev:client` / `npm run seed` / `npm run test` run the workspace scripts.
- **Env examples:** `server/.env.example` and `client/.env.example` were added so you can copy them to `.env` and fill values. Server env schema is in `server/src/config/env.ts`; seed also reads `OWNER_EMAIL` and `OWNER_FIREBASE_UID` from `process.env`.
- **Health route:** `GET /api/health` is defined in `server/src/modules/health/health.routes.ts` and mounted at `/api`.
- **PDF endpoint:** `GET /api/dispatches/:id/pdf` returns the Delivery Note PDF; requires auth; WHOLESALER can only access dispatches for their own orders.
