# Factory Inventory & Production Management System (MVP) — Deployment

## Environment variables

### Backend (Render / Railway)

| Variable | Description | Example |
| --- | --- | --- |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port (Render sets this) | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `FIREBASE_CLIENT_EMAIL` | Service account client email | `firebase-adminsdk-...@....iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service account private key (full key with `\n` for newlines) | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `OWNER_EMAIL` | Optional; used by seed | `owner@factory.com` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `https://your-app.web.app,https://your-app.firebaseapp.com` |
| `API_BASE_URL` | Optional; public URL of API (e.g. for PDF links) | `https://your-api.onrender.com` |
| `RATE_LIMIT_ENABLED` | Enable API rate limiting | `true` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window per IP | `100` |

### Frontend (Firebase Hosting)

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL (no trailing slash) | `https://your-api.onrender.com/api` |
| `VITE_FIREBASE_*` | Firebase web app config (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) | From Firebase Console |

## Backend on Render

1. Create a **Web Service**; connect the repo (e.g. monorepo root or server folder).
2. **Build**:
   - Root directory: `server` (if repo is monorepo).
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
3. Set all environment variables above in the Render dashboard (Secret Files / Environment).
4. **Health check**: Use path `/api/health`; expected response 200 with `{ "success": true, "data": { "status": "ok" } }`.
5. **FIREBASE_PRIVATE_KEY**: Paste the full key. On Render you can paste with real newlines; if using a single line, use `\n` for newlines (no extra quotes in the value).

*Screenshots placeholder: [Render Dashboard – Environment], [Render – Health check].*

## Frontend on Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. In project root: `firebase init hosting`
   - Select **Use an existing project** (or create one).
   - Public directory: `dist` (we will build the client into `dist`).
   - Single-page app: Yes.
   - Don’t overwrite index.html if you already have one in `client`; we build from client into `client/dist` or root `dist` — configure accordingly.
4. Build the client with production API URL:
   - Windows PowerShell: `$env:VITE_API_BASE_URL="https://your-api.onrender.com/api"; npm run build --workspace=client`
   - Git Bash/WSL/macOS/Linux: `VITE_API_BASE_URL=https://your-api.onrender.com/api npm run build --workspace=client`
5. If `firebase.json` points `public` to `client/dist`, run build from repo root with output to `client/dist`: ensure `client/vite.config.ts` has `outDir: 'dist'`, then from repo root: `npm run build:client` (which builds client into `client/dist`). Set `firebase.json` `"public": "client/dist"`.
6. Deploy: `firebase deploy --only hosting`
7. Set the same `VITE_*` variables in CI (e.g. GitHub Actions) when building so production build has correct API and Firebase config.

*Screenshots placeholder: [Firebase init], [firebase.json].*

## Post-deploy

1. Ensure MongoDB Atlas IP allowlist includes Render/Railway outbound IPs (or use 0.0.0.0/0 for testing).
2. Run seed once (from local or a one-off job) with `MONGODB_URI`, `OWNER_EMAIL`, `OWNER_FIREBASE_UID` set; create the Firebase Auth user for owner first and copy UID.
3. Set `CORS_ORIGINS` to the Firebase Hosting URL (e.g. `https://your-app.web.app`).
4. Test: open app → sign in as owner → check dashboard, GRN, batch, order, dispatch, PDF, reports, audit.
