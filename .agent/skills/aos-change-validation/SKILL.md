---
name: aos-change-validation
description: 10-step operational workflow to investigate, implement, and validate engineering changes in the repository.
---

# Change Validation Workflow (10 Steps)

Follow this procedure before considering any change completed in the project:

1. **Inspect Existing Architecture**: Identify the modules, contracts, and execution pipelines involved.
2. **Search for Equivalent Implementations**: Verify if an existing type, service, or function already serves the same purpose.
3. **Identify Canonical Source of Truth**: Locate the authoritative owner of the data (`worldLedger`, specific subsystem, or `engine.ts`).
4. **Identify Affected Invariants**: Map conservation properties, RNG determinism, or semantic contracts impacted.
5. **Implement Minimal Sufficient Change**: Fix the existing flow at its root; never add redundant layers, artificial adapters, or duplicate fields.
6. **Execute Targeted Domain Tests**: Run unit tests for the altered domain (`tests/domain/*`).
7. **Execute Integration Tests**: Validate subsystem chaining (`tests/integration/*`).
8. **Execute Replay / Simulation**: Run `npm run replay:validate` or corresponding simulation per the simulation matrix.
9. **Inspect Git Diff**: Ensure zero `any` types, zero redundant dependencies, and absolute adherence to mechanical silence.
10. **Human Playtest Gate (`PLAYTEST_REQUIRED`)**: Upon reaching `TECHNICALLY_DONE`, the AI must immediately stop coding and hand over to the user for live browser playtesting (WIP=1). Non-blocking findings are deferred to the Backlog.
