# Jira User Stories - Nisal Dulneth Wickramaarachchi ( Start up manager )

## Sprint 01
```text
Sprint 01
??? SM-S1-US1: Set up the technical foundation for the Inventory Management System
?   ??? SM-S1-ST1: Establish the monorepo structure for client and server workspaces
?   ??? SM-S1-ST2: Prepare TypeScript, package scripts, and the initial folder structure for React and Express
?   ??? SM-S1-ST3: Align technical setup work with the Sprint 1 startup initiation plan
??? SM-S1-US2: Define the system architecture and development approach
?   ??? SM-S1-ST1: Break down the runtime model for React, Firebase Auth, Express, and MongoDB
?   ??? SM-S1-ST2: Identify the key backend modules and data models needed for the MVP
?   ??? SM-S1-ST3: Prepare the implementation path for seed data, RBAC, stock movements, and traceability
??? SM-S1-US3: Prepare the repository for Sprint 2 implementation
    ??? SM-S1-ST1: Finalize environment-variable expectations for client and server
    ??? SM-S1-ST2: Prepare shared utilities, validation direction, and initial coding standards
    ??? SM-S1-ST3: Coordinate handoff from planning into feature delivery
```

## Sprint 02
```text
Sprint 02
??? SM-S2-US1: Build the main backend implementation outside the allocated auth, product, supplier, and report areas
?   ??? SM-S2-ST1: Implement wholesalers, GRN, BOM, batches, orders, dispatch, audit, and health modules
?   ??? SM-S2-ST2: Create the supporting data models for stock snapshots, stock movements, batches, dispatches, and audit logs
?   ??? SM-S2-ST3: Connect module routes into the main Express application flow
??? SM-S2-US2: Implement the main frontend workflow outside the allocated areas
?   ??? SM-S2-ST1: Build the application shell, role-based navigation, and protected operational pages
?   ??? SM-S2-ST2: Implement GRN, BOM, batches, orders, dispatches, dashboard, audit, and wholesaler-facing flows
?   ??? SM-S2-ST3: Wire the frontend to the backend APIs and role-aware behavior
??? SM-S2-US3: Deliver core inventory movement and traceability logic
?   ??? SM-S2-ST1: Implement batch completion logic for raw consumption and finished output
?   ??? SM-S2-ST2: Implement FEFO dispatch allocation and dispatch recording
?   ??? SM-S2-ST3: Ensure audit and stock movement records are written for critical actions
??? SM-S2-US4: Prepare the system for integrated testing and demo setup
    ??? SM-S2-ST1: Create the seed script with owner, supplier, wholesaler, products, BOM, GRN, batch, and dispatch data
    ??? SM-S2-ST2: Support FEFO, BOM, and integration tests for critical flow validation
    ??? SM-S2-ST3: Keep the project runnable locally with stable install, dev, build, and seed commands
```

## Sprint 03
```text
Sprint 03
??? SM-S3-US1: Move the implemented system into a deployable Vercel architecture
?   ??? SM-S3-ST1: Add the backend serverless adapter and route it through the deployed API path
?   ??? SM-S3-ST2: Configure backend runtime behavior for the Vercel server project
?   ??? SM-S3-ST3: Configure client-side SPA refresh handling for the Vite frontend
??? SM-S3-US2: Stabilize runtime initialization for the deployed environment
?   ??? SM-S3-ST1: Improve Firebase Admin and MongoDB initialization behavior under serverless execution
?   ??? SM-S3-ST2: Align environment handling with deployed client and server expectations
?   ??? SM-S3-ST3: Support post-deploy smoke checks for core working flows
??? SM-S3-US3: Convert deployment findings into a final hardening backlog
    ??? SM-S3-ST1: Record route, preflight, and environment mismatches found during deployment testing
    ??? SM-S3-ST2: Prioritize the fixes needed for final release readiness
    ??? SM-S3-ST3: Prepare Sprint 4 implementation focus on blocker closure and polishing
```

## Sprint 04
```text
Sprint 04
??? SM-S4-US1: Close the remaining production blockers in the deployed system
?   ??? SM-S4-ST1: Harden backend CORS behavior using a function-based allowlist and explicit preflight handling
?   ??? SM-S4-ST2: Fix nested API route handling through Vercel route mapping updates
?   ??? SM-S4-ST3: Verify that the deployed frontend can access the backend without breaking existing flows
??? SM-S4-US2: Finish the last operational UI gaps and integration tasks
?   ??? SM-S4-ST1: Complete the batch create and batch complete frontend flow
?   ??? SM-S4-ST2: Expand reports visibility and supporting UI behavior for final usage
?   ??? SM-S4-ST3: Keep dispatch PDF, audit, and stock-driven flows working after final updates
??? SM-S4-US3: Prepare the system for release-quality verification
?   ??? SM-S4-ST1: Resolve lint issues and confirm build/test status across client and server
?   ??? SM-S4-ST2: Update README, setup, deployment, architecture, and user docs to match the actual system
?   ??? SM-S4-ST3: Confirm the system is demo-ready and submission-ready
??? SM-S4-US4: Support final documentation and project evidence completion
    ??? SM-S4-ST1: Align technical implementation evidence with the completed sprint records
    ??? SM-S4-ST2: Confirm the remaining modules outside allocated role areas are fully represented
    ??? SM-S4-ST3: Close the project as the primary technical owner of the remaining implementation workload
```
