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
| **`crime`** | APP / CQRS | **PENDING** | Selective Extraction | Medium | Ransom/escape difficulty calculators | [CRIME_INTEGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/CRIME_INTEGRATION_READINESS.md) |
| **`holdings`** | DOMAIN / MODEL | **PENDING** | Selective Extraction | Low | `Holding` models | Pending audit |

---

## Chronological Migration & Audit Index

This index resolves the historical file naming variations across sequential triage audits:

| Seq # | Domain Module | Selection / Readiness Document | Migration Report | Post-Migration Audit |
|---|---|---|---|---|
| **1** | `character` | Baseline repository | Initial integration | — |
| **2** | `relationship` | [SECOND_DOMAIN_REUSE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/SECOND_DOMAIN_REUSE_AUDIT.md) | [RELATIONSHIP_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/RELATIONSHIP_MIGRATION_REPORT.md) | [RELATIONSHIP_POST_MIGRATION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/RELATIONSHIP_POST_MIGRATION_AUDIT.md) |
| **3** | `npc_ai` | [THIRD_DOMAIN_SELECTION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/THIRD_DOMAIN_SELECTION_AUDIT.md) | [NPC_AI_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/NPC_AI_MIGRATION_REPORT.md) | [NPC_AI_POST_MIGRATION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/NPC_AI_POST_MIGRATION_AUDIT.md) |
| **4** | `visibility` | [FOURTH_DOMAIN_SELECTION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/FOURTH_DOMAIN_SELECTION_AUDIT.md) | [VISIBILITY_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/VISIBILITY_MIGRATION_REPORT.md) | [POST_CONSOLIDATION_ARCHITECTURE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/POST_CONSOLIDATION_ARCHITECTURE_AUDIT.md) |
| **5** | `commerce` | [FIFTH_DOMAIN_SELECTION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/FIFTH_DOMAIN_SELECTION_AUDIT.md) | [COMMERCE_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/COMMERCE_MIGRATION_REPORT.md) | [POST_CONSOLIDATION_ARCHITECTURE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/POST_CONSOLIDATION_ARCHITECTURE_AUDIT.md) |
| **6** | `items` | [ITEMS_INTEGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/ITEMS_INTEGRATION_READINESS.md) | [ITEMS_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/ITEMS_MIGRATION_REPORT.md) | [POST_ITEMS_ARCHITECTURE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/POST_ITEMS_ARCHITECTURE_AUDIT.md) |
| **7** | `kingdom/succession` | [SEVENTH_DOMAIN_TRIAGE.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/SEVENTH_DOMAIN_TRIAGE.md) | [SUCCESSION_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/SUCCESSION_MIGRATION_REPORT.md) | [POST_7_DOMAIN_ARCHITECTURE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/POST_7_DOMAIN_ARCHITECTURE_AUDIT.md) |
| **8** | `kingdom/production` | [NEXT_DOMAIN_ARCHITECTURE_TRIAGE.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/NEXT_DOMAIN_ARCHITECTURE_TRIAGE.md) | [KINGDOM_PRODUCTION_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/KINGDOM_PRODUCTION_MIGRATION_REPORT.md) | [POST_8_DOMAIN_ARCHITECTURE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/POST_8_DOMAIN_ARCHITECTURE_AUDIT.md) |
| **9** | `kingdom/construction` | [KINGDOM_CONSTRUCTION_INTEGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/KINGDOM_CONSTRUCTION_INTEGRATION_READINESS.md) | [KINGDOM_CONSTRUCTION_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/KINGDOM_CONSTRUCTION_MIGRATION_REPORT.md) | [POST_9_DOMAIN_ARCHITECTURE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/POST_9_DOMAIN_ARCHITECTURE_AUDIT.md) |
| **10** | `military/payroll` | [MILITARY_PAYROLL_INTEGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MILITARY_PAYROLL_INTEGRATION_READINESS.md) | [MILITARY_PAYROLL_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MILITARY_PAYROLL_MIGRATION_REPORT.md) | [POST_11_DOMAIN_ARCHITECTURE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/POST_11_DOMAIN_ARCHITECTURE_AUDIT.md) |
| **11** | `military/breeding` | [MILITARY_BREEDING_INTEGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MILITARY_BREEDING_INTEGRATION_READINESS.md) | [MILITARY_BREEDING_MIGRATION_REPORT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MILITARY_BREEDING_MIGRATION_REPORT.md) | [POST_11_DOMAIN_ARCHITECTURE_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/POST_11_DOMAIN_ARCHITECTURE_AUDIT.md) |
| **—** | `narrator` | [NARRATOR_MIGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/NARRATOR_MIGRATION_READINESS.md) | *Rejected* | [DOCUMENTATION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/DOCUMENTATION_AUDIT.md) |
| **—** | `core/TimeService` | [TIME_SERVICE_INTEGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/TIME_SERVICE_INTEGRATION_READINESS.md) | *Rejected (Native Calendar)* | [DOCUMENTATION_AUDIT.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/DOCUMENTATION_AUDIT.md) |
| **—** | `crime` | [CRIME_INTEGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/CRIME_INTEGRATION_READINESS.md) | *Pending extraction* | — |

---

## Architectural Principles
1. **GAME ENGINE = SINGLE SOURCE OF TRUTH**: All state mutations must flow through deterministic `src/engine.ts` functions acting on `CampaignState`.
2. **Zero Secondary State Stores**: No domain may introduce parallel database models, standalone SQLite tables, or unvalidated state trees.
3. **Pure Decision Services**: Migrated domain services (e.g. `CommanderAIService`, `VisibilityService`, `MarketService`) evaluate rules purely without side effects or mutable global state.
