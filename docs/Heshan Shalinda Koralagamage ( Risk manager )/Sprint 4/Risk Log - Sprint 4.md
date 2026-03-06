# Risk Log - Sprint 4

| Risk ID | Description | Probability | Impact | Trigger / Early Warning | Mitigation | Final Status |
|---|---|---|---|---|---|---|
| R4-01 | CORS preflight blocked for client origin | High | High | Browser console: missing `Access-Control-Allow-Origin` | Function-based CORS allowlist + explicit `OPTIONS *` handling | Closed |
| R4-02 | API nested route path not resolved in Vercel | High | High | `404 NOT_FOUND` on `/api/orders/my` | Explicit `/api/(.*)` route mapping to serverless handler | Closed |
| R4-03 | Late-stage regression during hardening | Medium | Medium | lint/test failures after fixes | Command gate: build, test server/client, lint | Closed |
| R4-04 | Incomplete batch completion UI | Medium | Medium | user unable to finish production flow from UI | Added create/complete batch UI workflow and consumption form | Closed |
| R4-05 | Operators misdiagnose extension JS errors as app bug | Medium | Low | `Unexpected token 'export'` with non-app filename | Added troubleshooting note in deployment docs | Closed |
| R4-06 | Future preview URL access policy ambiguity | Medium | Low | unexpected origin requests | Added `ALLOW_VERCEL_PREVIEWS` controlled switch | Open (accepted) |

## Closure Summary
Sprint 4 closed all P0/P1 release blockers linked to deployment reliability and production API access.
