# Architecture

## High-level runtime architecture

```text
Client (React SPA on Vercel)
  -> Firebase Auth (Email/Password) on client
  -> Bearer token in API calls

Server (Express app in Vercel serverless function)
  -> verify Firebase ID token via Firebase Admin
  -> load user/role from Mongo Users
  -> enforce RBAC in middleware
  -> execute module route logic
  -> write stock movements + audit logs

MongoDB Atlas
  -> master data + operational transactions + reporting data
```

## Vercel-specific structure

- Client SPA project root: `client`
- Server API project root: `server`
- Serverless handler: `server/api/[...path].ts`
- Handler boots compiled app from `server/dist`

Request path behavior:
- Public API base is `/api/*`
- Express mounts all routes under `/api`
- Example health endpoint: `/api/health`

## Backend modules and responsibilities

- `health`: liveness endpoint
- `me`: authenticated profile endpoint
- `users`: OWNER-only user management
- `products`: raw materials and finished goods
- `suppliers`: supplier master data
- `wholesalers`: wholesaler master data
- `grn`: draft/create/confirm stock-in
- `bom`: bill of materials per finished product
- `batches`: batch lifecycle (`DRAFT -> IN_PROGRESS -> COMPLETED`)
- `orders`: create/list/update status
- `dispatch`: FEFO allocation, stock deduction, PDF delivery note
- `reports`: stock, movements, expiry, production, wastage, sales, traceability
- `audit`: OWNER-only query of audit log

## Core data model groups

Identity and access:
- `User` (role: OWNER, EMPLOYEE, WHOLESALER)

Master data:
- `Product`
- `Supplier`
- `Wholesaler`
- `BOM`

Operations:
- `GRN`
- `Batch`
- `Order`
- `Dispatch`

Inventory and traceability:
- `RawStock`
- `FinishedStock` (by product + batch)
- `StockMovement`

Audit:
- `AuditLog`

## Critical flows

### GRN confirm

1. Validate GRN exists and is `DRAFT`.
2. Start Mongo transaction.
3. Increment `RawStock` per GRN line.
4. Insert `StockMovement` records (`GRN_IN`).
5. Update GRN to `CONFIRMED`.
6. Commit transaction and write audit event.

### Batch complete

1. Validate batch is `IN_PROGRESS`.
2. Validate required raw stock exists.
3. Start Mongo transaction.
4. Deduct raw stock and create `PROD_CONSUME` movements.
5. Update batch with actual qty and wastage.
6. Upsert `FinishedStock` for the batch.
7. Create `PROD_OUTPUT` movement.
8. Commit transaction and write audit event.

### Dispatch with FEFO

1. Validate order exists, is `CONFIRMED`, and not already dispatched.
2. Load available finished stock.
3. Allocate by FEFO (earliest expiry first).
4. Start Mongo transaction.
5. Deduct `FinishedStock` and write `DISPATCH_OUT` movements.
6. Create `Dispatch` and update order status to `DISPATCHED`.
7. Commit transaction and write audit event.
8. Delivery note PDF generated from dispatch data (`/dispatches/:id/pdf`).

## RBAC enforcement

Middleware chain:
- `requireAuth`: verify Firebase token
- `loadUser`: load Mongo user by `firebaseUid`
- `requireRole([...])`: enforce endpoint authorization

Role access:
- OWNER: full access including users and audit
- EMPLOYEE: operational modules and reports
- WHOLESALER: own-order scope and allowed dispatch PDF scope

## Operational constraints

- Transactions rely on Mongo transaction support (replica-set environment).
- Serverless startup path requires build artifacts (`dist`) before runtime.
- CORS allowlist must include deployed client origin(s).
