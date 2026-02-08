# Factory Inventory & Production Management System (MVP) — User Guide

## Roles

- **OWNER (Admin)**: Manage users/roles, master data, confirm GRNs, approve operations, view all reports and audit log.
- **EMPLOYEE**: Daily operations: GRN, BOM, batches, orders, dispatch, reports (no users/audit).
- **WHOLESALER**: Place orders, view own orders, download delivery note PDFs.

## Owner

1. **Users**: Create users (Firebase UID + email + role). For WHOLESALER, link a Wholesaler record. Ensure the user has signed up in Firebase Auth with the same email first (or create them via Firebase Console).
2. **Products**: Add Raw Materials and Finished Goods (SKU, name, unit, category, reorder level, cost/selling price).
3. **Suppliers / Wholesalers**: Create supplier and wholesaler master data.
4. **GRN**: Create GRN (supplier + lines: raw material, qty, unit cost). Confirm GRN to increase raw material stock.
5. **BOM**: Define Bill of Materials per finished product (components: raw material + qty per unit + unit).
6. **Batches**: Create batch (finished product, planned qty, manufacture/expiry dates). Start batch, then complete with actual qty, consumption (from BOM or override with reason), and wastage.
7. **Orders**: View all orders; confirm DRAFT orders. Dispatching is done from the Dispatches module.
8. **Dispatches**: Create dispatch for a CONFIRMED order (FEFO allocation is automatic). This updates stock and order status. Download Delivery Note PDF.
9. **Reports**: Stock on hand (raw + finished by batch), movements, expiry, production, wastage.
10. **Audit**: View audit log of critical actions.

## Employee

1. Create/edit GRNs and confirm them.
2. Maintain BOMs and batches (create, start, complete with consumption and wastage).
3. View and confirm order status (confirm only).
4. Create dispatches for confirmed orders; download PDFs.
5. Use all reports (stock, movements, expiry, production, wastage). No access to Users or Audit.

## Wholesaler

1. Place orders (select finished products and quantities). Orders are created as DRAFT.
2. View **My Orders** (list and status).
3. After internal team confirms and dispatches, download Delivery Note PDF from the dispatch record.

## Agile MVP backlog (short)

- [ ] Batch creation wizard (prefill consumption from BOM).
- [ ] Order creation form for wholesaler (product picker + qty).
- [ ] Dashboard widgets (low stock, expiring soon, pending GRNs).
- [ ] Email notifications (order confirmed, dispatch done).
- [ ] Traceability report UI (by wholesaler/order).
- [ ] Adjustments (stock correction) with reason and audit.
