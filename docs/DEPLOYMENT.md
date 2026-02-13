# Deployment Guide (Vercel)

Deploy as two Vercel projects from this monorepo.

## 1) Client project

- Root directory: `client`
- Framework preset: Vite
- Build command: `npm run build`
- Output: `dist`

Required env:
- `VITE_API_BASE_URL=https://<server-project>.vercel.app/api`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

SPA refresh fix is in `client/vercel.json`.

## 2) Server project

- Root directory: `server`
- Build command: `npm run build`
- Serverless handler: `server/api/[...path].ts`
- Runtime config: `server/vercel.json`

`server/vercel.json` includes explicit mapping:
- `/api/(.*)` -> `/api/[...path].ts`

This avoids nested-path misses like `/api/orders/my`.

Required env:
- `NODE_ENV=production`
- `MONGODB_URI`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CORS_ORIGINS=https://<client-project>.vercel.app`

Optional env:
- `ALLOW_VERCEL_PREVIEWS=false`
- `API_BASE_URL=https://<server-project>.vercel.app`
- `RATE_LIMIT_ENABLED=true`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=100`
- `OWNER_EMAIL`
- `OWNER_FIREBASE_UID`

## 3) CORS behavior

Server CORS is function-based allowlist:
- Exact match against `CORS_ORIGINS` entries
- Optional `*.vercel.app` allowance if `ALLOW_VERCEL_PREVIEWS=true`
- Explicit preflight support via `OPTIONS *`
- Allowed headers: `Authorization`, `Content-Type`
- Allowed methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`
- `credentials: true`

## 4) Preflight verification

Run after deploy:

```powershell
curl.exe -i -X OPTIONS "https://<server>/api/orders/my?limit=1" \
  -H "Origin: https://<client>" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expected:
- non-404 response
- `Access-Control-Allow-Origin: https://<client>`
- `Access-Control-Allow-Headers` includes `authorization,content-type`

If you still get Vercel `404 NOT_FOUND` for this endpoint, redeploy the server project so `server/vercel.json` route mapping is active.

## 5) Seed in deployed environment

Before seeding:
- Create owner user in Firebase Auth.
- Set `OWNER_EMAIL` + `OWNER_FIREBASE_UID`.

Then run:

```powershell
npm run seed
```

## 6) Export syntax console error

If users report `Unexpected token 'export'`:
- Confirm failing file from DevTools Network.
- App bundle is served as module (`<script type="module">`) and assets as `application/javascript`.
- If failing file is extension-injected and not under `/assets/`, treat as non-project browser extension issue.
