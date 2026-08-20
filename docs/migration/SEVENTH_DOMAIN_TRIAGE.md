# Seventh Domain Triage

## 1. Current Architecture Summary
- **Branch**: `integration/legacy-consolidation` (Commit `3309a35`).
- **Consolidated Domains**: `character`, `relationship`, `npc_ai`, `visibility`, `commerce`, `items` (6 domains migrated & integrated).
- **Pre-existing Target Domains**: `adventure` (`AdventureEngine.ts`).
- **Rejected Legacy Domains**: `narrator` (2-way disk mutation), `world` (high duplication with travel/weather engine), `region` (synchronous disk YAML I/O), `core/TimeService` (redundant standalone; handled via pure calendar adapters).
- **Architecture Golden Rule**: `GAME ENGINE = SINGLE SOURCE OF TRUTH` (0 SQLite/EventStore in target; pure domain services, single authoritative `CampaignState`).

---

## 2. Holdings Audit (`legacy/main:src/domain/holdings/`)

| File | Architectural Layer | Purpose | Target Status & Classification |
|---|---|---|---|
| **`models/Holding.ts`** | DOMAIN MODEL / AGGREGATE | Calculates civilian labor pool (`40%` of population) and unallocated labor capacity | **B — MINIMAL ADAPTATION** (Labor formulas are useful pure functions) |
| **`commands/CreateHoldingCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite holding creation command | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |

---

## 3. Crime Audit (`legacy/main:src/domain/crime/`)

| File | Architectural Layer | Purpose | Target Status & Classification |
|---|---|---|---|
| **`EscapeCatalogService.ts`** | INFRASTRUCTURE | Synchronous disk reader (`fs.readFileSync`) loading `simulation_tables.json` | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |
| **`queries/GetEscapeDifficultyQuery.ts`** | APPLICATION / QUERY | Catalog lookup wrapper for escape difficulty specs | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |
| **`commands/AttemptEscapeCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite prisoner escape attempt command | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |
| **`commands/ImprisonCharacterCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite character imprisonment command | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |
| **`commands/RansomNegotiationCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite ransom negotiation command | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |

> [!NOTE]
> **Pure Extraction Opportunity in Crime**:
> Ransom calculation formula ($\text{Ransom} = \text{baseTierCost} \times \text{reputationMod}$) and escape DC calculator can be extracted as a pure, stateless service (`RansomCalculator.ts`) without loading `EscapeCatalogService` or EventStore infrastructure.

---

## 4. Kingdom Audit (`legacy/main:src/domain/kingdom/`)

| File | Architectural Layer | Purpose | Target Status & Classification |
|---|---|---|---|
| **`services/SuccessionService.ts`** | DOMAIN SERVICE | Pure sorting algorithm for noble house succession order (legitimate children > siblings > nephews/nieces > blood relatives) | **A — DIRECT REUSE / B — MINIMAL ADAPTATION** (Strong pure candidate) |
| **`services/FoodService.ts`** | DOMAIN SERVICE | Calculates civilian food consumption (`1 FSU / 1000 pop`) and military rations | **D — DUPLICATED** (Overlaps with target engine weekly food tick) |
| **`services/ProductionService.ts`** | DOMAIN SERVICE | Daily/monthly holding and resource patch yield formulas | **D — DUPLICATED** (Overlaps with target engine weekly income tick) |
| **`services/LaborService.ts`** | DOMAIN SERVICE | Civilian labor capacity and patch allocation calculations | **B — MINIMAL ADAPTATION** |
| **`HoldingCatalogService.ts`** | INFRASTRUCTURE | Disk JSON loader (`fs.readFileSync`) for holding templates | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |
| **`commands/*` (9 commands)** | APPLICATION / CQRS | EventStore / SQLite construction & labor commands | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |

---

## 5. Military Audit (`legacy/main:src/domain/military/`)

| File | Architectural Layer | Purpose | Target Status & Classification |
|---|---|---|---|
| **`services/BreedingService.ts`** | DOMAIN SERVICE | Mount breeding success rate calculation with regional and tier penalties | **B — MINIMAL ADAPTATION** (Pure calculation formula) |
| **`services/PayrollService.ts`** | DOMAIN SERVICE | Soldier upkeep calculation (`10 soldiers = 1 SD`, `100 soldiers = 1 FSU`) & desertion rules | **C — SIGNIFICANT ADAPTATION / D — DUPLICATED** (Upkeep formula is pure; desertion relies on `RandomService` PRNG) |
| **`services/MountService.ts`** | DOMAIN SERVICE | Horse injury/death check outcomes | **C — SIGNIFICANT ADAPTATION** (Relies on PRNG and catalog table) |
| **`MountCatalogService.ts`** | INFRASTRUCTURE | Disk reader (`fs.readFileSync`) for mount JSON specs | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** (Replaced by `MOUNT_SPECS` in `src/data.ts`) |
| **`RetinueCatalogService.ts`** | INFRASTRUCTURE | Disk reader (`fs.readFileSync`) for retinue JSON specs | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |
| **`ShipCatalogService.ts`** | INFRASTRUCTURE | Disk reader (`fs.readFileSync`) for ship JSON specs | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |
| **`commands/*` & `queries/*`** | APPLICATION / CQRS | EventStore / SQLite military commands & queries | **E — LEGACY INFRASTRUCTURE COUPLING / REJECT** |

---

## 6. Selective Extraction Candidates
1. **`kingdom/SuccessionService.ts`**: Pure sorting algorithm for noble house succession order. High architectural value for House mechanics.
2. **`crime/RansomCalculator.ts`**: Pure calculation of ransom values and escape difficulty thresholds (extracted from `legacy/main:src/domain/crime`).
3. **`military/BreedingService.ts`**: Pure formula for mount breeding success rates.

---

## 7. Rejected Legacy Components
- **All 16 CQRS EventStore Commands**: `CreateHoldingCommand`, `AttemptEscapeCommand`, `ImprisonCharacterCommand`, `RansomNegotiationCommand`, `AllocateLaborCommand`, `StartConstructionCommand`, `AssignMountCommand`, `RecruitSoldiersCommand`, etc.
- **All 5 Synchronous Disk Catalog Loaders**: `EscapeCatalogService`, `HoldingCatalogService`, `MountCatalogService`, `RetinueCatalogService`, `ShipCatalogService` (`fs.readFileSync`).
- **All SQLite EventStore & SnapshotStore Repositories**.

---

## 8. Target Duplication Audit
- **Economy & Food Ticks**: `ProductionService.ts` and `FoodService.ts` in `kingdom` duplicate logic already integrated into `src/engine.ts` (`simulateTurn`).
- **Mount Catalogs**: `MountCatalogService.ts` in `military` duplicates `MOUNT_SPECS` already consolidated in `src/data.ts`.

---

## 9. Engine Health (`src/engine.ts`)
- **Current Lines**: 1,215 lines.
- **Golden Rule Compliance**: 100%. Engine remains single source of truth.
- **Doubtful Coupling**: Utility adapters (`getMonthNumberFromName`, `normalizeLocationToHub`, `getAbsoluteCampaignTurn`) are grouped at the top. Recommended for reorganization into `src/engine/adapters/` if file length exceeds 1,500 lines.

---

## 10. ActivePlay Health (`src/components/ActivePlay.tsx`)
- **Current Lines**: 2,915 lines.
- **Role**: Pure UI presentation and user intent dispatcher. 0 direct domain calculation logic.

---

## 11. Legacy Documentation Compliance
- Rules in `legacy/main:docs/01_Knowledge/politics/succession.yaml`, `economy/payroll.yaml`, `imprisonment/ransom.yaml` align with the candidate formulas evaluated in this triage.

---

## 12. Target Documentation Recommendations
- Maintain transition documents strictly in `docs/migration/`.
- Defer promotion to permanent `docs/domains/` until the migration phase finishes.

---

## 13. Determinism Audit
- **RNG / Clock / File I/O Scan**: `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- src/domain` confirms 100% purity in all 6 consolidated domains (`character`, `relationship`, `npc_ai`, `visibility`, `commerce`, `items`).

---

## 14. Test / Build / Replay Results
- `npm test`: **PASSED (100%)**
- `npm run build`: **PASSED (0 errors)**
- `ReplayValidator`: **PASSED (10/10 deterministic snapshots)**

---

## 15. Recommended Migration Candidates for Phase 7 (Ranked)
1. **Candidate A — `kingdom/SuccessionService.ts`**: Pure lineage sorting algorithm. Zero disk I/O, zero RNG, zero DB coupling. (Recommended as 7th domain).
2. **Candidate B — `crime` (Pure Ransom & Escape Calculator)**: Pure formula extraction without catalog readers or EventStore.

---

## 16. Components That Should NEVER Be Migrated
- `HoldingCatalogService`, `EscapeCatalogService`, `MountCatalogService`, `RetinueCatalogService`, `ShipCatalogService` (Disk File I/O).
- All legacy CQRS `*Command.ts` and `*Query.ts` files (EventStore/SQLite infrastructure coupling).

---

## 17. Final Architectural Recommendation
Proceed with the selective extraction of **`kingdom/SuccessionService.ts`** as the 7th domain candidate, maintaining 100% domain purity and zero infrastructure coupling.
