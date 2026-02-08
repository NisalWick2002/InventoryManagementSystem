# Factory Inventory & Production Management System (MVP) — Architecture

## Overview

```text
+------------------+     HTTPS / Bearer token      +------------------+     Mongoose      +------------------+
|  React (Vite)    |  -------------------------->  |  Express API     |  --------------->  |  MongoDB Atlas   |
|  Ant Design      |  <---------------------------  |  Node + TS       |  <---------------  |  (or local)      |
|  Firebase Auth   |     JSON + 401/403            |  Firebase Admin  |                    |                  |
+------------------+                               +------------------+                    +------------------+
        |                                                 |
        | Email/Password                                 | verifyIdToken
        v                                                 v
+------------------+                               +------------------+
|  Firebase Auth   |                               |  Users (role)   |
|  (client SDK)    |                               |  OWNER/EMPLOYEE/|
|                  |                               |  WHOLESALER      |
+------------------+                               +------------------+
```

- **Client**: React + Vite + TypeScript + Ant Design. Signs in with Firebase Email/Password; sends `Authorization: Bearer <idToken>` on every API request.
- **Server**: Express + TypeScript. Verifies the token with Firebase Admin SDK, loads the user from MongoDB (Users collection) to get role, and enforces RBAC on each route.
- **Database**: MongoDB (Atlas or local). Mongoose models for Users, Products, Suppliers, Wholesalers, BOM, GRN, Batch, RawStock, FinishedStock, StockMovement, Order, Dispatch, AuditLog.

## Data flow

### GRN confirm

1. User confirms a DRAFT GRN.
2. Server starts a transaction: for each GRN line, increment RawStock and insert StockMovement (type GRN_IN).
3. GRN status set to CONFIRMED; transaction committed.
4. Audit log entry created.

### Batch complete

1. User submits completion with actual qty produced, consumption lines (raw material + qty actual), and wastage.
2. Server validates sufficient raw stock for each consumption line.
3. Server starts a transaction: decrement RawStock per consumption; insert PROD_CONSUME movements; update Batch (consumption, actualQtyProduced, wastage, status COMPLETED); upsert FinishedStock (productId + batchId + quantity + expiry); insert PROD_OUTPUT movement.
4. Audit log entry created.

### Dispatch (FEFO)

1. User creates a dispatch for a CONFIRMED order.
2. Server loads all FinishedStock with quantity > 0, grouped by productId.
3. For each order line (productId, qty), FEFO allocates from batches sorted by expiryDate (earliest first) until requested qty is satisfied.
4. If any product has insufficient stock, return 400.
5. Server starts a transaction: for each allocation, decrement FinishedStock; insert DISPATCH_OUT movement; create Dispatch record; set Order status to DISPATCHED.
6. Delivery Note PDF can be generated on GET /api/dispatches/:id/pdf (PDFKit).

## RBAC

- **OWNER**: All routes; user management; audit log.
- **EMPLOYEE**: Products, Suppliers, Wholesalers, GRN, BOM, Batches, Orders (list + patch status), Dispatches, Reports. No Users, no Audit.
- **WHOLESALER**: Orders (POST, GET /orders/my), Dispatches/:id/pdf for own orders only; Products/Wholesalers read as needed. No GRN, BOM, Batches, Reports, Users, Audit.

Role is always read from the server-side Users collection after token verification; never trusted from the client.
