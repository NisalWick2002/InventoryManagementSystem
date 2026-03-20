# Jira User Stories - HJMSM jayasinghe ( Quality manager )

## Sprint 01
```text
Sprint 01
??? QM-S1-US1: Define the initial quality approach for the Factory Inventory MVP
?   ??? QM-S1-ST1: Review Sprint 1 planning, startup, risk, and communication documents
?   ??? QM-S1-ST2: Identify the minimum quality gates expected for client, server, and documentation work
?   ??? QM-S1-ST3: Prepare the first quality plan and review approach for later sprint validation
??? QM-S1-US2: Prepare acceptance criteria for the main module families
?   ??? QM-S1-ST1: Break down expected quality checks for authentication, master data, inventory operations, and reports
?   ??? QM-S1-ST2: Define what will count as a pass for role-based access and data validation
?   ??? QM-S1-ST3: Share baseline acceptance expectations with the implementation team
??? QM-S1-US3: Prepare supplier-operation quality criteria before development starts
    ??? QM-S1-ST1: Define expected supplier fields, validation behavior, and usability checks
    ??? QM-S1-ST2: Note how supplier data should integrate into GRN and stock-in workflows
    ??? QM-S1-ST3: Add supplier checks to the overall QA coverage outline
```

## Sprint 02
```text
Sprint 02
??? QM-S2-US1: Validate supplier management behavior in the implemented MVP
?   ??? QM-S2-ST1: Review supplier create, list, update, and delete logic in backend routes and model validation
?   ??? QM-S2-ST2: Verify supplier UI behavior for form entry, feedback messages, and list loading
?   ??? QM-S2-ST3: Confirm supplier data is usable from the GRN workflow without breaking stock-in steps
??? QM-S2-US2: Execute quality checks on core operational flows
?   ??? QM-S2-ST1: Review auth, master data, GRN, BOM, batch, order, dispatch, and audit behavior against expected flow
?   ??? QM-S2-ST2: Check that validation errors and response formats remain consistent across modules
?   ??? QM-S2-ST3: Log defects or inconsistencies that affect sprint acceptance
??? QM-S2-US3: Build validation confidence using available tests and walkthroughs
    ??? QM-S2-ST1: Review FEFO, BOM, and integration test coverage in the server test suite
    ??? QM-S2-ST2: Run role-based manual walkthroughs for owner, employee, and wholesaler behaviors
    ??? QM-S2-ST3: Prepare a sprint QA validation summary with open issues and acceptance status
```

## Sprint 03
```text
Sprint 03
??? QM-S3-US1: Validate the system after deployment changes for Vercel hosting
?   ??? QM-S3-ST1: Review the client and server deployment setup against the actual hosted structure
?   ??? QM-S3-ST2: Verify that deployed routes, refresh behavior, and API access still match expected flows
?   ??? QM-S3-ST3: Capture deployment-related defects that affect user access or reliability
??? QM-S3-US2: Check supplier and inventory behavior under the deployment-ready build
?   ??? QM-S3-ST1: Re-test supplier list/create behavior against the latest integrated build
?   ??? QM-S3-ST2: Verify that supplier-driven GRN steps still function after deployment changes
?   ??? QM-S3-ST3: Log any inconsistency between local and deployed behavior
??? QM-S3-US3: Prepare the QA hardening backlog for the final sprint
    ??? QM-S3-ST1: Prioritize route, CORS, and runtime issues that block release acceptance
    ??? QM-S3-ST2: Note remaining usability gaps in batch and reporting screens
    ??? QM-S3-ST3: Hand over a focused defect list for Sprint 4 closure
```

## Sprint 04
```text
Sprint 04
??? QM-S4-US1: Run final regression checks across the release candidate
?   ??? QM-S4-ST1: Verify build, test, and lint gates for both client and server
?   ??? QM-S4-ST2: Re-check supplier operations, GRN flow, batch completion, orders, dispatch, reports, and audit
?   ??? QM-S4-ST3: Confirm that no critical regression was introduced by hardening work
??? QM-S4-US2: Validate final UI and reporting improvements before sign-off
?   ??? QM-S4-ST1: Review the completed batch flow in the frontend for usability and correctness
?   ??? QM-S4-ST2: Review reports tabs and data presentation for consistency and readability
?   ??? QM-S4-ST3: Confirm that final docs reflect the actual tested system behavior
??? QM-S4-US3: Complete the quality sign-off package for submission
    ??? QM-S4-ST1: Summarize test outcomes, resolved defects, and residual risks
    ??? QM-S4-ST2: Confirm supplier-module quality expectations are satisfied in the final build
    ??? QM-S4-ST3: Submit final QA acceptance input to the project manager
```
