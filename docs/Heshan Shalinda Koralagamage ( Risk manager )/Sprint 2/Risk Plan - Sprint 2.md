# Risk Plan - Sprint 2

**Project:** Factory Inventory & Production Management System (MVP)  
**Role:** Risk Manager  
**Sprint:** 2  
**Version:** 1.0

## 1. Sprint Context
Sprint 2 focused on core MVP implementation: RBAC authentication, master data, GRN workflow, BOM, production batches, FEFO dispatch, reports, audit logging, and seed data.

## 2. Risk Management Objectives
- Protect inventory accuracy during GRN confirm, batch complete, and dispatch operations.
- Reduce security and access risks caused by role misconfiguration.
- Control integration risk between Firebase Auth, MongoDB, and Express APIs.
- Maintain delivery confidence while implementing many modules in one sprint.

## 3. Key Risks Identified
1. **Inventory integrity risk**: incorrect stock deductions during batch completion and dispatch.
2. **Authorization risk**: backend routes accidentally exposed without `requireRole` checks.
3. **Data model consistency risk**: mismatch between batch/stock movement references and reports.
4. **Scope compression risk**: multiple critical modules delivered in parallel can reduce test depth.
5. **Seed reliability risk**: invalid owner UID/email setup can block first-time onboarding.

## 4. Mitigation Strategy
- Enforce server-side RBAC middleware on all privileged modules.
- Require validation via Zod schemas at body/query boundaries.
- Use MongoDB transactions for multi-collection write operations in GRN, batch, and dispatch flows.
- Track critical actions in `AuditLog` and `StockMovement` for post-incident traceability.
- Keep a repeatable seed script and explicit setup instructions in root docs.

## 5. Monitoring and Controls
- Daily risk check during standup against blocked tasks.
- Mid-sprint checkpoint on auth flow and inventory mutation endpoints.
- End-sprint review against integration tests and walkthrough scenarios.

## 6. Sprint 2 Risk Outcome
Core functional risk remained moderate but controlled. Major risk exposures were transferred to Sprint 3 hardening actions (deployment and runtime behavior under Vercel).
