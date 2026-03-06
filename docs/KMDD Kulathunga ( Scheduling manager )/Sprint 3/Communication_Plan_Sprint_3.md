# Communication Plan - Sprint 3

**Project:** Factory Inventory & Production Management System (MVP)  
**Role:** Scheduling Manager  
**Sprint:** 3  
**Version:** 1.0

## 1. Sprint Goal
Deployment transition to Vercel with stable routing and initialization behavior.

## 2. Coordination Model
- Daily deployment sync on environment state and route tests.
- Pre-deploy checklist review for server and client projects.
- Post-deploy validation call for runtime diagnostics.

## 3. Schedule Anchors
- Day 1-2: serverless adapter and server config.
- Day 3: Firebase/Mongo init reliability fixes.
- Day 4: client SPA rewrite validation.
- Day 5: issue triage and hardening backlog handover.

## 4. High-Dependency Items
- `server/vercel.json` and `server/api/[...path].ts` must align.
- `client/vercel.json` rewrite must match React Router usage.
- Environment values must be synchronized across projects.

## 5. Outcome
Sprint cadence exposed runtime issues early, enabling a focused Sprint 4 stabilization plan.
