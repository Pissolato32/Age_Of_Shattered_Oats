---
name: aos-simulation
description: Operational procedure to select the appropriate level of validation, stress tests, simulation, and deterministic replays.
---

# Validation and Simulation Procedure

## Fundamental Principle of Validation
> **Simulation is not a proof of mechanical correctness.**
> Simulations and stress tests serve to discover emergent behaviors, statistical drift, and regressions at scale. Formal guarantees of conservation properties and resource bounds are the exclusive domain of **invariant tests**.

---

## Decision Matrix: Change Type → Required Validation

| Change Type | Minimum Required Validation | Commands / Tests |
| :--- | :--- | :--- |
| **Small Domain Rule** | Targeted test + related suite | `npx tsx tests/domain/<Domain>.test.ts` |
| **`engine.ts` (Loop / Orchestrator)** | Integration tests + Replay validation | `npx tsx tests/integration/*` and `npm run replay:validate` |
| **RNG / Determinism** | Deterministic replay + Magnitude simulation | `npm run replay:validate` and `npm run sim:magnitude` |
| **Combat / Statistics** | Domain tests + Magnitude simulation | `npx tsx tests/domain/CombatStatsCalculator.test.ts` and `npm run sim:magnitude` |
| **Economy / Resources** | Domain tests + Long stress simulation | `npx tsx tests/domain/Commerce.test.ts` and `npm run stress:long` |
| **State / Persistence** | Persistence audit + Replay validation | `npx tsx tests/M25StatePersistenceAudit.test.ts` and `npm run replay:validate` |
| **Cross-Cutting Change** | Full test suite | `npm test` |
| **Performance Optimization** | Stress test suite | `npm run stress:short` / `npm run stress:medium` / `npm run stress:long` |

---

## Command Catalog
- **Replay Validation**: `npm run replay:validate`
- **Magnitude Simulation**: `npm run sim:magnitude`
- **Short Stress (10k ticks)**: `npm run stress:short`
- **Medium Stress (50k ticks)**: `npm run stress:medium`
- **Long Stress (100k ticks)**: `npm run stress:long`
- **Full Suite**: `npm test`
