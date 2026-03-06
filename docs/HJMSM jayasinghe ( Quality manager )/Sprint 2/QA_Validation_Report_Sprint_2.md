# QA Validation Report - Sprint 2

## Executed Validation Areas
1. **Authentication and RBAC**
   - Verified backend role gating on internal modules.
   - Confirmed wholesaler-specific `/orders/my` behavior.
2. **Inventory mutation correctness**
   - GRN confirm increases raw stock and writes movement records.
   - Batch complete consumes raw stock and adds finished stock by batch.
   - Dispatch reduces finished stock and creates `DISPATCH_OUT` movements.
3. **Traceability and audit**
   - Dispatch allocations preserve product-batch relationship.
   - Audit entries created for critical CRUD and status transitions.

## Automated Test Coverage Used
- `server/tests/fefo.test.ts`
- `server/tests/bom-consumption.test.ts`
- `server/tests/integration/flows.test.ts`

## Defects Found During Sprint
- Early mismatch in edge-case validation messaging between routes.
- Minor UI inconsistencies in status visibility and form defaults.

## Disposition
- Critical defects: 0 open.
- High defects: 0 open.
- Medium defects: deferred usability refinements to Sprint 4.

## Sprint 2 QA Sign-off
Core MVP functionality accepted for progression to deployment hardening.
