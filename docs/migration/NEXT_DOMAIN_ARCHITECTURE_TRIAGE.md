# Next Domain Architecture Triage (Post-7-Domain Analysis)

## 1. Executive Summary & Current State
- **Branch**: `integration/legacy-consolidation` (Commit `830d319`).
- **Consolidated Domains (7)**: `character`, `relationship`, `npc_ai`, `visibility`, `commerce`, `items`, `kingdom/succession`.
- **Explicitly Deferred Domains**: `crime` (audited in `CRIME_INTEGRATION_READINESS.md` — 0 target callers, missing `captivity` data slices).
- **Explicitly Rejected Domains**: `narrator`, `world`, `region` (audited in earlier phases — disk catalog readers, CLI generators, EventStore CQRS handlers).
- **Core Architecture Rule**: `GAME ENGINE = SINGLE SOURCE OF TRUTH`.
- **Methodology**: Governed by `docs/development/DEVELOPMENT_METHODOLOGY.md`.

---

## 2. Working Tree Audit (`.agent/`)
- **Inspection Findings**: `.agent/` contains local IDE tool configurations (`.agent/rules/aikido_rules.md`).
- **Recommendation**: Do **NOT** version `.agent/` in Git commits. It represents local environment tool artifacts. Add `.agent/` to `.gitignore` if untracked files persist.

---

## 3. Comprehensive Inventory of Remaining Legacy Domain Candidates

The following legacy components across `legacy/main:src/domain/` were thoroughly evaluated:

```
src/domain/
├── core/
│   └── TimeService.ts
├── holdings/
│   ├── commands/CreateHoldingCommand.ts
│   └── models/Holding.ts
├── kingdom/
│   ├── HoldingCatalogService.ts (Disk I/O)
│   ├── commands/* (AllocateLabor, StartConstruction, WeeklyEconomyTick, etc.)
│   ├── queries/GetTradePricesQuery.ts
│   └── services/
│       ├── ProductionService.ts (Pure)
│       ├── FoodService.ts (Pure)
│       ├── LaborService.ts (Pure)
│       ├── TreasuryService.ts (Pure)
│       ├── ConstructionService.ts (Pure)
│       └── TransactionService.ts (Pure)
└── military/
    ├── MountCatalogService.ts (Disk I/O)
    ├── RetinueCatalogService.ts (Disk I/O)
    ├── ShipCatalogService.ts (Disk I/O)
    ├── commands/* (AssignMount, BuildShip, RecruitSoldiers, PayRetinues, etc.)
    ├── queries/*
    └── services/
        ├── PayrollService.ts (Pure)
        ├── MountService.ts (Pure)
        └── BreedingService.ts (Pure)
```

---

## 4. Evaluation of Legacy Candidates Against 15 Architectural Criteria

### Candidate A: `kingdom/production` (`ProductionService`, `FoodService`, `LaborService`, `TreasuryService`)
1. **Real Target Gap**: Yes. `src/engine.ts` currently calculates weekly economy ticks and food consumption using hardcoded inline logic.
2. **Real Gameplay Consumer**: Yes. `resolveWeeklyTurn()` in `src/engine.ts` and `ActivePlay.tsx` (LedgerViewer & economy state).
3. **Target Duplication**: 0 duplicate domain classes.
4. **Pure Business Rules**: 100% pure functions (daily/monthly SD & FSU production, winter agricultural penalties, civilian food consumption, labor capacity).
5. **Infrastructure Decoupling**: 100% decoupled (0 SQLite, 0 EventStore, 0 Disk I/O).
6. **RNG / Clock**: 0 RNG, 0 Clock.
7. **New State Slices**: 0 new slices required. Reuses existing `CampaignState.holdings`, `population`, `resourcePatches`, `treasurySd`, `treasuryFsu`.
8. **New Gameplay Concepts**: None required.
9. **Risk of Orphaned Code**: Zero. `resolveWeeklyTurn()` will immediately consume these services.
10. **Gameplay Value**: Very High (Canonical production, seasonal penalties, and famine mechanics).
11. **Architectural Risk**: Very Low.
12. **Adaptation Cost**: Low.
13. **Integration Boundary**: `ActivePlay.tsx (UI)` $\rightarrow$ `engine.ts (resolveWeeklyTurn facade)` $\rightarrow$ `src/domain/kingdom/services/`.
14. **Module Placement**: `src/domain/kingdom/services/`.
15. **Engine Responsibility**: `src/engine.ts` remains the facade orchestrating `CampaignState` mutations while delegating pure calculations to `ProductionService` and `FoodService`.
- **Classification**: **B — MINIMAL ADAPTATION (READY)**

---

### Candidate B: `military/payroll` (`PayrollService`, `MountService`)
1. **Real Target Gap**: Yes. Military wages, retinue food consumption, morale penalties, troop desertions, and horse injury recovery.
2. **Real Gameplay Consumer**: Yes. `ArmyUnit[]` in `CampaignState`, `resolveWeeklyTurn()`, and `ActivePlay.tsx` army management.
3. **Target Duplication**: Partial math in `resolveWeeklyTurn()`, but domain rules (morale decay per unpaid tick, 1d10 desertion dice, mount recovery weeks) are absent or inline.
4. **Pure Business Rules**: Pure calculations when PRNG is passed as parameter.
5. **Infrastructure Decoupling**: 100% decoupled from legacy CQRS commands. Catalogs (`MountCatalogService`) rejected in favor of static `MOUNT_SPECS` in `src/data.ts`.
6. **RNG / Clock**: PRNG rolls for desertion/injury integrated cleanly via `globalRNG`.
7. **New State Slices**: 0 required. `ArmyUnit` and `Character.stats` already exist.
8. **New Gameplay Concepts**: None required.
9. **Risk of Orphaned Code**: Low.
10. **Gameplay Value**: High (Retinue wage pressure, desertion, mount injury).
11. **Architectural Risk**: Low.
12. **Adaptation Cost**: Low.
13. **Integration Boundary**: `engine.ts` facade functions.
14. **Module Placement**: `src/domain/military/services/`.
15. **Engine Responsibility**: Engine handles PRNG rolls and `CampaignState` mutation.
- **Classification**: **B — MINIMAL ADAPTATION (READY)**

---

### Candidate C: `military/breeding` (`BreedingService`)
1. **Real Target Gap**: Mount breeding schedules and regional success penalties.
2. **Real Gameplay Consumer**: No active UI or state slice in target for mount breeding schedules.
3. **Risk of Orphaned Code**: High.
- **Classification**: **F — DEFERRED**

---

### Candidate D: `holdings/models/Holding.ts` & CQRS Commands
1. **Target Status**: Duplicate of `Holdings` interface in `src/types.ts`. CQRS commands rely on SQLite/EventStore.
- **Classification**: **D — DUPLICATED / E — REJECTED INFRASTRUCTURE**

---

### Candidate E: `core/TimeService.ts`
1. **Target Status**: Duplicate of `getMonthNumberFromName()` and calendar definitions in `src/data.ts`.
- **Classification**: **D — DUPLICATED**

---

## 5. Objective Candidate Ranking

| Rank | Candidate | Target Consumer? | Pure Rules? | State Compatibility | Value | Classification | Status |
|---|---|---|---|---|---|---|---|
| **#1** | **`kingdom/production`** (`ProductionService`, `FoodService`, `LaborService`, `TreasuryService`) | **YES** | **100% PURE** | **100% COMPATIBLE** | **VERY HIGH** | **B — MINIMAL ADAPTATION** | **RECOMMENDED NEXT DOMAIN** |
| **#2** | **`military/payroll`** (`PayrollService`, `MountService`) | **YES** | **100% PURE** | **100% COMPATIBLE** | **HIGH** | **B — MINIMAL ADAPTATION** | **HIGH PRIORITY SECOND** |
| **#3** | **`kingdom/construction`** (`ConstructionService`) | **YES** | **100% PURE** | **100% COMPATIBLE** | **MEDIUM** | **B — MINIMAL ADAPTATION** | **READY** |
| **#4** | **`military/breeding`** (`BreedingService`) | **NO** | Pure | Lacks active state slice | **LOW** | **F — DEFERRED** | **DEFERRED** |
| **#5** | **`crime`** | **NO** | CQRS / Stochastic | Lacks `captivity` slice | **LOW** | **F — DEFERRED** | **DEFERRED** |
| **#6** | **`narrator` / `world` / `region`** | **NO** | Disk I/O / CLI | N/A | **NONE** | **E/F — REJECTED** | **REJECTED** |

---

## 6. Recommended Candidate & Justification

### Recommended Candidate: `kingdom/production` (`ProductionService`, `FoodService`, `LaborService`, `TreasuryService`)

#### Justification:
1. **Solves an Immediate Architectural Gap**: `src/engine.ts` currently calculates weekly economy, food production, and seasonal penalties using inline code in `resolveWeeklyTurn()`. Migrating `ProductionService`, `FoodService`, `LaborService`, and `TreasuryService` establishes cohesive, pure domain services in `src/domain/kingdom/services/`.
2. **Zero Orphaned Code**: `resolveWeeklyTurn()` in `src/engine.ts` and `ActivePlay.tsx` (LedgerViewer) are active consumers ready to call the new domain services immediately.
3. **100% Pure Domain**: 0 DB, 0 EventStore, 0 Disk File I/O, 0 RNG, 0 Clock.
4. **100% State Compatible**: Reuses existing `CampaignState.holdings`, `population`, `resourcePatches`, `treasurySd`, and `treasuryFsu`.
5. **Clean Architecture Alignment**:
   $$\text{ActivePlay.tsx (UI)} \longrightarrow \text{engine.ts (resolveWeeklyTurn facade)} \longrightarrow \text{ProductionService / FoodService (src/domain/kingdom/services/)}$$

---

## 7. Criteria for Next Readiness Audit (`KINGDOM_PRODUCTION_INTEGRATION_READINESS.md`)
Before authorization of implementation, the readiness audit must specify:
1. Exact method signatures for `ProductionService.ts`, `FoodService.ts`, `LaborService.ts`, `TreasuryService.ts`.
2. Facade integration points in `src/engine.ts` (`resolveWeeklyTurn`).
3. Verification that CQRS commands (`StartConstructionCommand.ts`, `AllocateLaborCommand.ts`, etc.) are 100% rejected.
4. Unit and integration test plan in `tests/domain/` and `tests/integration/`.
