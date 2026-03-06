# Quality Plan - Sprint 2

**Project:** Factory Inventory & Production Management System (MVP)  
**Role:** Quality Manager  
**Sprint:** 2  
**Version:** 1.0

## 1. Purpose
Define quality controls for core MVP implementation covering backend correctness, UI flow reliability, and data traceability.

## 2. Quality Objectives
- Ensure API response format consistency: `{ success, data?, error? }`.
- Validate RBAC enforcement for OWNER, EMPLOYEE, WHOLESALER roles.
- Verify inventory integrity across GRN, production, and dispatch transitions.
- Confirm auditability through `AuditLog` and `StockMovement`.

## 3. Scope Under QA
- Server modules: users, products, suppliers, wholesalers, GRN, BOM, batches, orders, dispatch, reports, audit.
- Client pages: dashboard, master data screens, GRN, BOM, batches, orders, dispatches, reports, users, audit.
- Seed and setup workflow for local demo reproducibility.

## 4. Verification Approach
- **Static checks:** linting and schema review.
- **Automated tests:** unit tests for FEFO and BOM logic + integration flow checks.
- **Manual scenarios:** role-based end-to-end walkthrough from login to dispatch PDF.

## 5. Entry/Exit Criteria
**Entry:** core routes compiled, seed data available, basic UI wiring complete.  
**Exit:** no critical flow blocker in auth, stock mutation, dispatch, or reporting.

## 6. Sprint 2 Quality Outcome
Quality baseline established with automated FEFO/BOM assertions and role-aware manual flow checks; deployment quality controls planned for Sprint 3.
