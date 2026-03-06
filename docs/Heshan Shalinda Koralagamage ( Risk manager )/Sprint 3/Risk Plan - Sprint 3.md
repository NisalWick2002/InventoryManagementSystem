# Risk Plan - Sprint 3

**Project:** Factory Inventory & Production Management System (MVP)  
**Role:** Risk Manager  
**Sprint:** 3  
**Version:** 1.0

## 1. Sprint Context
Sprint 3 focused on deployment and runtime stabilization for Vercel hosting. Key technical changes included serverless adapter setup, Vercel API routing configuration, and client SPA routing rewrites.

## 2. Primary Risk Themes
- **Environment drift** between local and deployed serverless runtime.
- **Route resolution risk** for nested API endpoints under `/api/*`.
- **Auth initialization risk** when Firebase Admin and Mongo connections are handled in serverless instances.
- **Client refresh risk** for React Router routes in production.

## 3. Planned Controls
- Introduce dedicated serverless entrypoint (`server/api/[...path].ts`) and one-time init pattern.
- Maintain explicit route rules in `server/vercel.json` and `client/vercel.json`.
- Execute post-deploy smoke checks for `/api/health`, `/api/me`, `/api/orders`, and `/api/orders/my`.
- Record deployment-specific failures with reproducible curl checks.

## 4. Contingency Actions
- If nested API routes fail, add explicit mapping for `/api/(.*)` to handler.
- If SPA refresh fails, enforce fallback rewrite to `index.html`.
- If initialization fails, isolate bootstrap logic and retry with warm-instance guard.

## 5. Sprint 3 Risk Outcome
Risk profile moved from functional correctness to runtime reliability. High-priority deployment blockers were identified and queued for Sprint 4 hardening.
