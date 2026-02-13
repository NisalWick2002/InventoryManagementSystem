# Setup All In One

## 1) Prerequisites

- Node.js 20 LTS recommended
- npm 9+
- Firebase project (Email/Password auth)
- MongoDB Atlas cluster

## 2) Install

```powershell
npm install
```

## 3) Configure Firebase

1. Enable Email/Password in Firebase Authentication.
2. Add Web App and copy client keys into `client/.env` (`VITE_FIREBASE_*`).
3. Generate service account key and copy into `server/.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

If private key is one line, keep newline escapes as `\n`.

## 4) Configure MongoDB

Set `MONGODB_URI` in `server/.env`.
Use Atlas replica set for transaction support.

## 5) Create env files

```powershell
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Server env minimum:
- `MONGODB_URI`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CORS_ORIGINS`
- `ALLOW_VERCEL_PREVIEWS`

Client env minimum:
- `VITE_API_BASE_URL`
- `VITE_FIREBASE_*`

## 6) Seed owner and demo data

1. Create owner user in Firebase Auth.
2. Set `OWNER_EMAIL` and `OWNER_FIREBASE_UID` in `server/.env`.
3. Run:

```powershell
npm run seed
```

## 7) Run locally

Terminal 1:

```powershell
npm run dev:server
```

Terminal 2:

```powershell
npm run dev:client
```

Check:
- `http://localhost:5000/api/health`
- `http://localhost:5173`

## 8) Validate toolchain

```powershell
npm run build --workspace=server
npm run build --workspace=client
npm run test:server
npm run test:client
npm run lint
```

Current status in this repo:
- build: pass
- tests: pass
- lint: pass

## 9) Smoke flow

1. Sign in as OWNER.
2. Create+confirm GRN.
3. Create batch -> start -> complete.
4. Create order -> confirm.
5. Create dispatch (FEFO) -> download PDF.
6. Open reports and audit log.

## 10) Troubleshooting

- 401/invalid token: validate Firebase client+server keys.
- 403 user not found: add user in Mongo Users (seed or Users screen).
- CORS blocked: ensure server `CORS_ORIGINS` exactly matches client origin.
- `Unexpected token 'export'`: check filename in DevTools; extension-injected scripts are non-project issues.
