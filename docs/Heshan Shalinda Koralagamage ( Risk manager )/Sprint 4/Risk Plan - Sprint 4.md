# Risk Plan - Sprint 4

**Project:** Factory Inventory & Production Management System (MVP)  
**Role:** Risk Manager  
**Sprint:** 4  
**Version:** 1.0

## 1. Sprint Context
Sprint 4 focused on production hardening and release readiness. Technical work included CORS hardening, nested API routing fixes, lint cleanup, and UI completion for key operational flows.

## 2. Release-Critical Risks
1. Preflight CORS failure blocking wholesaler/internal API access.
2. Residual route mismatch for `/api/*` paths in deployed serverless project.
3. Last-mile UI gaps in batch completion flow reducing operational usability.
4. Regression risk from final code cleanup and doc synchronization.

## 3. Mitigation and Acceptance Controls
- Implement function-based CORS allowlist and explicit OPTIONS preflight handling in `server/src/app.ts`.
- Add `ALLOW_VERCEL_PREVIEWS` controlled toggle in `server/src/config/env.ts`.
- Expand UI support in `client/src/pages/Batches.tsx` and `client/src/pages/Reports.tsx`.
- Require build + test + lint pass before release sign-off.

## 4. Exit Criteria
- No blocking CORS errors for allowed origins.
- Deployed nested API routes resolve to server handler.
- Demo flow passes: auth, GRN confirm, batch complete, order confirm, dispatch FEFO, PDF, reports.
- Updated runbooks available for deployment and troubleshooting.

## 5. Sprint 4 Risk Outcome
High-impact production risks were reduced to manageable operational risk, with remaining exposure mainly in environment misconfiguration during future redeployments.
