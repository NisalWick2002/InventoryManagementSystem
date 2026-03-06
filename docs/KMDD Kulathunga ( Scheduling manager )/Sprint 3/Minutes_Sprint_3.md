# Meeting Minutes - Sprint 3

## Session A
**Agenda:** Vercel deployment readiness.

### Decisions
- Keep client and server as separate Vercel projects.
- Use catch-all serverless handler for `/api/*`.
- Add explicit production smoke commands to release workflow.

### Risks Logged
- Nested API path mismatch risk on specific endpoints.
- Environment variable drift between local and production.

## Session B
**Agenda:** Sprint review and carry-forward prioritization.

### Key Findings
- SPA refresh issue mitigated with rewrite config updates.
- Remaining blocker: route/cors behavior on nested API calls.

### Sprint 4 Backlog Lock
1. CORS hardening and explicit preflight handling.
2. API route mapping validation for `/api/orders/my`.
3. Lint and UI completion tasks before final sign-off.
