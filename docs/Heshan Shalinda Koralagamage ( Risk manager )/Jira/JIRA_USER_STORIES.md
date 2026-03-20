# Jira User Stories - Heshan Shalinda Koralagamage ( Risk manager )

## Sprint 01
```text
Sprint 01
??? RM-S1-US1: Establish the initial project risk register for the Inventory Management System
?   ??? RM-S1-ST1: Review Sprint 1 project plan, startup initiation notes, quality plan, and communication plan
?   ??? RM-S1-ST2: Identify early risks around unclear scope, missing environment setup, and dependency readiness
?   ??? RM-S1-ST3: Record probability, impact, mitigation approach, and escalation owner for each key risk
??? RM-S1-US2: Assess startup and architecture risks before core implementation begins
?   ??? RM-S1-ST1: Review planned React, Express, Firebase, and MongoDB integration points
?   ??? RM-S1-ST2: Highlight authentication, data integrity, and hosting risks that could affect later sprints
?   ??? RM-S1-ST3: Share high-priority risks with the project manager and startup manager for action planning
??? RM-S1-US3: Set up a practical risk-monitoring approach for the team
    ??? RM-S1-ST1: Define how risks will be reviewed during sprint checkpoints
    ??? RM-S1-ST2: Prepare issue-escalation guidance for blockers that threaten delivery dates
    ??? RM-S1-ST3: Align the risk log with planned sprint outputs and team responsibilities
```

## Sprint 02
```text
Sprint 02
??? RM-S2-US1: Track implementation risks across the core MVP build
?   ??? RM-S2-ST1: Monitor risks around auth, product data, supplier data, GRN flow, BOM, batches, orders, and dispatch
?   ??? RM-S2-ST2: Flag high-impact risks where multi-collection inventory updates could fail or become inconsistent
?   ??? RM-S2-ST3: Update mitigation actions as backend modules and UI pages become available
??? RM-S2-US2: Control inventory integrity and traceability risks
?   ??? RM-S2-ST1: Review risks in stock movements, raw stock deductions, finished stock outputs, and FEFO allocation
?   ??? RM-S2-ST2: Track risks tied to audit logging and batch-to-dispatch traceability links
?   ??? RM-S2-ST3: Escalate any reliability concern that could break reporting or dispatch accuracy
??? RM-S2-US3: Maintain a sprint risk log aligned to the real implementation
    ??? RM-S2-ST1: Record risks related to seed data, owner onboarding, and unregistered Firebase users
    ??? RM-S2-ST2: Capture mitigation expectations for validation, transactions, and API error handling
    ??? RM-S2-ST3: Review residual risks with the team before moving to deployment work
```

## Sprint 03
```text
Sprint 03
??? RM-S3-US1: Manage deployment and hosting risks during Vercel rollout
?   ??? RM-S3-ST1: Track backend serverless adapter and route-mapping risks for /api/*
?   ??? RM-S3-ST2: Identify risks in Firebase Admin and MongoDB initialization under serverless runtime
?   ??? RM-S3-ST3: Escalate any issue that could block the deployed client from reaching the API
??? RM-S3-US2: Monitor environment and runtime consistency risks
?   ??? RM-S3-ST1: Review VITE_API_BASE_URL, CORS, Firebase, and owner seed variable dependency points
?   ??? RM-S3-ST2: Log risks caused by differences between local and production environments
?   ??? RM-S3-ST3: Recommend smoke checks for health, me, orders, and report endpoints after deploy
??? RM-S3-US3: Track delivery risks caused by route and refresh behavior
    ??? RM-S3-ST1: Record SPA refresh risk for React Router pages on Vercel
    ??? RM-S3-ST2: Record nested API path risk for routes such as /api/orders/my
    ??? RM-S3-ST3: Prepare carry-forward mitigation items for Sprint 4 hardening
```

## Sprint 04
```text
Sprint 04
??? RM-S4-US1: Close release-blocking reliability risks before final submission
?   ??? RM-S4-ST1: Track CORS preflight failures affecting the deployed frontend and backend
?   ??? RM-S4-ST2: Track route-resolution risks for nested API paths in the deployed server
?   ??? RM-S4-ST3: Confirm mitigations are reflected in app configuration and deployment guidance
??? RM-S4-US2: Review regression and production-readiness risks after final code polish
?   ??? RM-S4-ST1: Monitor the effect of lint cleanup and final UI changes on working demo flows
?   ??? RM-S4-ST2: Check that reports, dispatch PDF, and audit behavior remain intact after hardening
?   ??? RM-S4-ST3: Record any remaining operational risks as accepted residual risk
??? RM-S4-US3: Finalize the risk closure summary for project submission
    ??? RM-S4-ST1: Summarize closed, mitigated, and accepted risks across all four sprints
    ??? RM-S4-ST2: Confirm that no unresolved high-priority risk blocks demo or submission
    ??? RM-S4-ST3: Provide final risk input to the project manager and startup manager for sign-off
```
