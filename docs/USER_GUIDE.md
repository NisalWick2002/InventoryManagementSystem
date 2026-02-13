# User Guide

## Roles

- OWNER: full access, user administration, audit view
- EMPLOYEE: operations and reports
- WHOLESALER: create/view own orders and access own dispatch PDF

## Sign-in model

1. User signs in through Firebase Email/Password.
2. Backend verifies token and maps Firebase UID to Mongo `User` record.
3. If Firebase auth exists but no Mongo `User` exists, access is blocked until user is added.

## Owner workflow

1. Add master data:
   - Products
   - Suppliers
   - Wholesalers
2. Manage user records in Users page.
3. Create and confirm GRNs.
4. Manage BOMs.
5. Start and monitor batches.
6. Confirm/cancel orders.
7. Create dispatches for confirmed orders.
8. Download delivery note PDFs.
9. Use reports and audit logs.

## Employee workflow

1. Maintain GRNs and confirm them.
2. Maintain BOMs.
3. Start batches and monitor production records.
4. Confirm/cancel orders.
5. Create dispatches.
6. Use reports.

## Wholesaler workflow

1. Place orders from Orders page.
2. View own order statuses.
3. Download dispatch delivery note PDF when available.

## Current UI coverage notes

Current UI coverage includes:
- master data management (products/suppliers/wholesalers)
- GRN create + confirm
- BOM create/list and batch create/start/complete
- orders + dispatch + delivery-note PDF
- reports tabs (stock, movements, expiry, production, wastage, sales-by-wholesaler, traceability)
- owner-only users + audit log

Advanced edge-case operations still remain API-first (for example custom dispatch allocation overrides and deep data exports).

## Core status transitions

- GRN: `DRAFT -> CONFIRMED`
- Batch: `DRAFT -> IN_PROGRESS -> COMPLETED`
- Order: `DRAFT -> CONFIRMED -> DISPATCHED`, or `CANCELLED`

## Quick troubleshooting for users

- "Account not registered": ask OWNER to create a User record with correct Firebase UID.
- Dispatch blocked: order must be `CONFIRMED` and finished stock must be sufficient.
- CORS/network errors in browser: deployment env vars likely mismatched (`VITE_API_BASE_URL` or `CORS_ORIGINS`).
