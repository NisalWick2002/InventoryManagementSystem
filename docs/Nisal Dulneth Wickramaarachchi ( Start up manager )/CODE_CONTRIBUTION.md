# Coding Contribution - Start up Manager

## Primary Implementation Ownership
This role carried the main technical implementation workload across backend, frontend, deployment runtime, and final hardening.

## Major Code Contributions
### Backend Core
- Express app bootstrap and middleware orchestration (`server/src/app.ts`).
- Auth/RBAC integration with Firebase Admin and Mongo user model.
- Core modules under `server/src/modules/*` (products, suppliers, wholesalers, GRN, BOM, batches, orders, dispatch, reports, audit).
- Inventory and traceability models, stock movement handling, and audit utilities.
- FEFO allocation and delivery note PDF generation support.

### Frontend Core
- App layout and role-based route structure.
- Operational screens in `client/src/pages/*` for all MVP modules.
- Final sprint UI enhancements for batch completion, reporting, and onboarding hints.

### Platform and Release
- Serverless adapter and deployment runtime files (`server/api/[...path].ts`, `server/vercel.json`, `client/vercel.json`).
- CORS hardening and route reliability fixes for production.
- Seed workflow and deployment/runbook alignment.

## Team Coding Distribution (Agreed)
- **Nisal Dulneth Wickramaarachchi (Start up manager): 62%**
- NBUUB Balalla (Project manager): 10%
- KMDD Kulathunga (Scheduling manager): 8%
- HJMSM Jayasinghe (Quality manager): 11%
- Heshan Shalinda Koralagamage (Risk manager): 9%

This satisfies the requirement that the startup manager contributes more than 50% of total coding effort.
