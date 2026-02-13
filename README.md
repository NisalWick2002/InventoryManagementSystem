# Factory Inventory & Production Management System (MVP)

Monorepo for single-factory food production with Firebase Auth, MongoDB, RBAC, stock ledger, FEFO dispatching, delivery-note PDF, and audit trail.

## Monorepo layout

```text
/
  client/   React + Vite + TypeScript + Ant Design
  server/   Express + TypeScript + Mongoose + Firebase Admin
  docs/     setup, deployment, architecture, user guide
```

## Runtime requirements

- Node.js >= 18 (Node 20 recommended)
- npm >= 9
- Firebase project (Email/Password + service account)
- MongoDB Atlas (replica set recommended for transactions)

## Quick start

1. Install dependencies:
   - `npm install`
2. Create env files:
   - `copy server\.env.example server\.env`
   - `copy client\.env.example client\.env`
3. Fill env values.
4. Create Firebase owner user and set:
   - `OWNER_EMAIL`
   - `OWNER_FIREBASE_UID`
5. Seed demo data:
   - `npm run seed`
6. Run apps:
   - terminal 1: `npm run dev:server`
   - terminal 2: `npm run dev:client`

Local URLs:
- API: `http://localhost:5000/api`
- Client: `http://localhost:5173`
- Health: `http://localhost:5000/api/health`

## Verified commands (current repo)

- `npm run build --workspace=server`
- `npm run build --workspace=client`
- `npm run test:server`
- `npm run test:client`
- `npm run lint`

## Environment variables

### Server (`server/.env`)

Required:
- `MONGODB_URI`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Recommended:
- `NODE_ENV=development`
- `PORT=5000`
- `CORS_ORIGINS=http://localhost:5173`
- `ALLOW_VERCEL_PREVIEWS=false`
- `API_BASE_URL=http://localhost:5000`
- `RATE_LIMIT_ENABLED=true`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=100`

Seed keys:
- `OWNER_EMAIL`
- `OWNER_FIREBASE_UID`

### Client (`client/.env`)

Required:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

API base:
- Local: `VITE_API_BASE_URL=/api`
- Production: `VITE_API_BASE_URL=https://<server-project>.vercel.app/api`

## Vercel deployment model

Use two Vercel projects from this monorepo.

1. Client project
   - Root directory: `client`
   - Build command: `npm run build`
   - Output: `dist`
   - SPA refresh rewrite in `client/vercel.json`
2. Server project
   - Root directory: `server`
   - Build command: `npm run build`
   - Handler: `server/api/[...path].ts`
   - Runtime config: `server/vercel.json`
   - Explicit route mapping: `/api/(.*)` -> `/api/[...path].ts`

Production CORS requirements:
- `CORS_ORIGINS` must contain exact client origin(s), no trailing slash.
- Use `ALLOW_VERCEL_PREVIEWS=true` only if you intentionally allow all `*.vercel.app` preview origins.

## Production troubleshooting

- Preflight check:
  - PowerShell: `curl.exe -i -X OPTIONS "https://<server>/api/orders/my?limit=1" -H "Origin: https://<client>" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization,content-type"`
  - Expect non-404 plus `Access-Control-Allow-Origin: https://<client>`
- `Unexpected token 'export'`:
  - Verify the failing filename in DevTools.
  - If it is not one of `/assets/*.js` and looks extension-injected (for example `webpage_content_reporter.js`), it is a browser extension issue, not project bundle config.

## Documentation map

- `docs/SETUP_ALL_IN_ONE.md`
- `docs/DEPLOYMENT.md`
- `docs/ARCHITECTURE.md`
- `docs/USER_GUIDE.md`
