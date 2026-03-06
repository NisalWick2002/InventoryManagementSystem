# Quality Plan - Sprint 3

**Project:** Factory Inventory & Production Management System (MVP)  
**Role:** Quality Manager  
**Sprint:** 3  
**Version:** 1.0

## 1. Sprint Quality Focus
Deployment and runtime quality on Vercel.

## 2. Key Quality Risks Targeted
- Serverless initialization reliability for Firebase Admin and MongoDB.
- Correct API routing for nested paths.
- Frontend SPA refresh behavior for React Router routes.
- Production environment consistency (`VITE_API_BASE_URL`, CORS, Firebase keys).

## 3. Validation Plan
- Run post-deploy endpoint smoke checks (`/api/health`, `/api/orders`, `/api/orders/my`).
- Validate browser navigation + hard refresh on nested client routes.
- Confirm no regression in core functional flows after deployment changes.
- Capture evidence in release checklist.

## 4. Test Gates
- Build success for both workspaces.
- Existing server/client test suites pass.
- Manual production sanity checks completed on deployed URLs.

## 5. Sprint 3 Quality Outcome
Quality status remained conditional: deployment-specific route and CORS issues were identified and prioritized for Sprint 4 remediation.
