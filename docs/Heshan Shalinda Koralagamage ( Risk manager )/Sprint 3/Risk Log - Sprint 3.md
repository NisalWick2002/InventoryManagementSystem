# Risk Log - Sprint 3

| Risk ID | Description | Probability | Impact | Trigger / Early Warning | Mitigation | Status |
|---|---|---|---|---|---|---|
| R3-01 | Nested API routes return Vercel `404 NOT_FOUND` | High | High | `/api/orders/my` failing in production | Added explicit route mapping in `server/vercel.json` and redeploy checklist | Mitigated in Sprint 4 |
| R3-02 | Firebase/Mongo startup race in serverless runtime | Medium | High | intermittent init failure during cold start | Added warm-instance init guard in `server/api/[...path].ts` | Mitigated |
| R3-03 | SPA refresh breaks on client-side routes | Medium | Medium | refresh on `/orders` or `/reports` returns 404 | Added `client/vercel.json` rewrite to `index.html` | Mitigated |
| R3-04 | Environment variable mismatch after deploy | Medium | High | CORS/auth failures only in production | Standardized env checklist in deployment docs | Mitigated |
| R3-05 | Incomplete production smoke validation | Medium | Medium | bugs found by users first | Added explicit preflight and endpoint smoke commands | Partially mitigated |

## Evidence Anchors
- Deployment-focused commits: `189bc61`, `1725395`, `2591d7e`, `9bc34cf`, `db60442`.
- Critical runtime checks were promoted to release gate for Sprint 4.
