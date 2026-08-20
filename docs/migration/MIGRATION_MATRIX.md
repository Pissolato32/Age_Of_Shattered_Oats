# Migration Matrix & Master Consolidation Index

## Executive Summary
This document is the **Central Canonical Migration Control Matrix** for consolidating backend domain models from `legacy/main` into `Age_Of_Shattered_Oats`. All individual readiness audits, scorecards, and migration reports serve as supporting evidence linked to this master index.

---

## Master Domain Status Matrix

| Domain Module | Layer | Status | Reuse Classification | Risk | Primary Integration Point | Supporting Evidence Document |
|---|---|---|---|---|---|---|
| **`character`** | DOMAIN | **MIGRATED & INTEGRATED** | A — Direct Reuse | Low | `src/domain/character/Character.ts` | Initial consolidation |
| **`relationship`** | DOMAIN | **MIGRATED & INTEGRATED** | B — Minimal Adaptation | Low | `adjustHouseOpinion` / `setHouseOpinion` in `src/engine.ts` | [RELATIONSHIP_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/RELATIONSHIP_MIGRATION_REPORT.md) |
| **`npc_ai`** | DOMAIN / APP | **MIGRATED & INTEGRATED** | A — Direct Reuse | Low | `resolveNpcCombatAction()` in `src/engine.ts` | [NPC_AI_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/NPC_AI_MIGRATION_REPORT.md) |
| **`visibility`** | APP / DOMAIN SERVICE | **MIGRATED & INTEGRATED** | A — Direct Reuse | Low | `isEventVisibleToObserver()` / `getVisibleWorldSecrets()` in `src/engine.ts` | [VISIBILITY_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/VISIBILITY_MIGRATION_REPORT.md) |
| **`narrator`** | APP / AI / INFRA | **REJECTED** | F — Rejected | High | N/A (StateApplicator 2-way disk mutation violates Golden Rule) | [NARRATOR_MIGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/NARRATOR_MIGRATION_READINESS.md) |
| **`world`** | DOMAIN & APP | **REJECTED** | D — Duplicated | High | N/A (Duplicated in `calculateTravelTime` and `rollWeather` in `engine.ts`) | [THIRD_DOMAIN_SELECTION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/THIRD_DOMAIN_SELECTION_AUDIT.md) |
| **`region`** | INFRASTRUCTURE | **REJECTED** | E — Legacy File I/O | Medium | N/A (Synchronous `fs.readFileSync` disk YAML reading) | [THIRD_DOMAIN_SELECTION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/THIRD_DOMAIN_SELECTION_AUDIT.md) |
| **`adventure`** | DOMAIN / APP | **ALREADY PRESENT** | A — Direct Reuse | Low | `src/domain/adventure/AdventureEngine.ts` (Commit `f05d668`) | Target commit `f05d668` |
| **`commerce`** | DOMAIN SERVICE | **MIGRATED & INTEGRATED** | B — Minimal Adaptation | Low | `calculateMaterialPrice()` in `src/engine.ts` | [COMMERCE_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/COMMERCE_MIGRATION_REPORT.md) |
| **`core/TimeService`** | DOMAIN | **REJECTED** | N/A | Low | Replaced by native 8-month calendar in `src/engine.ts` | [TIME_SERVICE_INTEGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/TIME_SERVICE_INTEGRATION_READINESS.md) |
| **`items`** | DOMAIN SERVICE | **MIGRATED & INTEGRATED** | B — Minimal Adaptation | Low | `calculateCharacterCombatStats()` in `src/engine.ts` | [ITEMS_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/ITEMS_MIGRATION_REPORT.md) |
| **`kingdom/succession`** | DOMAIN SERVICE | **MIGRATED & INTEGRATED** | A — Direct Reuse | Low | `resolveDynasticSuccession()` in `src/engine.ts` | [SUCCESSION_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/SUCCESSION_MIGRATION_REPORT.md) |
| **`kingdom/production`** | DOMAIN SERVICE | **MIGRATED & INTEGRATED** | A — Direct Reuse | Low | `calculateWeeklyProduction()` / `calculateFoodConsumption()` / `calculateLaborCapacity()` in `src/engine.ts` | [KINGDOM_PRODUCTION_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/KINGDOM_PRODUCTION_MIGRATION_REPORT.md) |
| **`kingdom/construction`** | DOMAIN SERVICE | **MIGRATED & INTEGRATED** | B — Minimal Adaptation | Low | `calculateConstructionRefund()` / `resolveResourcePatchQuality()` in `src/engine.ts` | [KINGDOM_CONSTRUCTION_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/KINGDOM_CONSTRUCTION_MIGRATION_REPORT.md) |
| **`military/payroll`** | DOMAIN SERVICE | **MIGRATED & INTEGRATED** | B — Minimal Adaptation | Low | `calculateMilitaryWages()` / `resolveTroopDesertion()` in `src/engine.ts` | [MILITARY_PAYROLL_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MILITARY_PAYROLL_MIGRATION_REPORT.md) |
| **`military/breeding`** | DOMAIN SERVICE | **MIGRATED & INTEGRATED** | B — Minimal Adaptation | Low | `calculateMountBreedingSuccessRate()` in `src/engine.ts` | [MILITARY_BREEDING_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MILITARY_BREEDING_MIGRATION_REPORT.md) |
| **`crime`** | APP / CQRS | **PENDING** | Selective Extraction | Medium | Ransom/escape difficulty calculators | Pending audit |
| **`holdings`** | DOMAIN / MODEL | **PENDING** | Selective Extraction | Low | `Holding` models | Pending audit |

---

## Architectural Principles
1. **GAME ENGINE = SINGLE SOURCE OF TRUTH**: All state mutations must flow through deterministic `src/engine.ts` functions acting on `CampaignState`.
2. **Zero Secondary State Stores**: No domain may introduce parallel database models, standalone SQLite tables, or unvalidated state trees.
3. **Pure Decision Services**: Migrated domain services (e.g. `CommanderAIService`, `VisibilityService`, `MarketService`) evaluate rules purely without side effects or mutable global state.
