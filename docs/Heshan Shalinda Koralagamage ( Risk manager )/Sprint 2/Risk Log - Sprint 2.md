# Risk Log - Sprint 2

| Risk ID | Description | Probability | Impact | Trigger / Early Warning | Mitigation | Status |
|---|---|---|---|---|---|---|
| R2-01 | Incorrect raw stock deduction when completing batches | Medium | High | Negative stock values or mismatch with batch consumption | Validate consumption payload, transaction-based updates, movement audit | Mitigated |
| R2-02 | FEFO allocation chooses wrong batch order | Medium | High | Dispatch allocations not matching earliest expiry | Add deterministic FEFO utility and unit tests (`server/tests/fefo.test.ts`) | Mitigated |
| R2-03 | Unauthorized access to owner/employee APIs | Low | High | Wholesaler can open internal route | Apply `requireAuth` + `loadUser` + `requireRole` on protected endpoints | Mitigated |
| R2-04 | Incomplete traceability links between order, dispatch, and batch | Medium | Medium | Report output missing batch linkage | Store `batchId` in finished stock and dispatch allocations | Mitigated |
| R2-05 | Seed onboarding fails due to missing owner UID | Medium | Medium | First login blocked for owner account | Document `OWNER_EMAIL` + `OWNER_FIREBASE_UID` setup and guard in seed script | Open (controlled) |
| R2-06 | Wide sprint scope reduces QA depth | Medium | Medium | Last-week bug burst | Prioritize critical flow tests (GRN, batch, dispatch) and stagger feature freeze | Partially mitigated |

## Notes
- No critical data-loss incident occurred in Sprint 2.
- Highest residual risk moved to deployment/runtime handling in Sprint 3.
