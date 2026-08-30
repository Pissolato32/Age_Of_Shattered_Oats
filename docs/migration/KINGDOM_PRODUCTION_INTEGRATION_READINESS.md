# Kingdom Production Domain Integration Readiness Audit

## 1. Current Repository State

- **Branch**: `integration/legacy-consolidation`
- **Current Commit**: `830d319` (`feat: integrate dynastic succession domain into engine`)
- **Working Tree**: `src/` and `tests/` are 100% clean and untouched.
- **Untracked Files Identified**:
  - `.agent/` (Local IDE tool configuration — recommended to add to `.gitignore`)
  - `docs/development/DEVELOPMENT_METHODOLOGY.md`
  - `docs/migration/CRIME_INTEGRATION_READINESS.md`
  - `docs/migration/NEXT_DOMAIN_ARCHITECTURE_TRIAGE.md`
  - `docs/migration/POST_7_DOMAIN_ARCHITECTURE_AUDIT.md`
- **Current Consolidated Domain Modules in `src/domain/`**:
  1. `src/domain/character/Character.ts`
  2. `src/domain/relationship/Relationship.ts` & `MemoryLog.ts`
  3. `src/domain/npc_ai/CommanderAIService.ts`
  4. `src/domain/visibility/VisibilityService.ts`
  5. `src/domain/commerce/services/MarketService.ts`
  6. `src/domain/items/CombatStatsCalculator.ts`
  7. `src/domain/kingdom/services/SuccessionService.ts`
  8. `src/domain/adventure/AdventureEngine.ts` (Pre-existing target domain)

---

## 2. Legacy Domain Analysis (`legacy/main:src/domain/kingdom/`)

| Legacy Service / Component | Purity | Dependencies | Target Equivalent | Duplication Status | Consumer in Target | Recommended Classification |
|---|---|---|---|---|---|---|
| **`ProductionService.ts`** | 100% Pure | `MONTH_SEASONS` (`TimeService`) | Inline math in `resolveWeeklyTurn()` | **SEMANTICALLY EQUIVALENT** | `src/engine.ts` (`resolveWeeklyTurn`) & `ActivePlay.tsx` | **A — DIRECT REUSE / B — MINIMAL ADAPTATION** |
| **`FoodService.ts`** | 100% Pure | None | `u.size * 0.01` in `resolveWeeklyTurn()` | **EXACT DUPLICATE** | `src/engine.ts` (`resolveWeeklyTurn`) | **A — DIRECT REUSE** |
| **`LaborService.ts`** | 100% Pure | None | `laborPool: 400` (40% of 1000 pop) | **EXACT DUPLICATE** | `src/engine.ts` & `ActivePlay.tsx` | **A — DIRECT REUSE** |
| **`TreasuryService.ts`** | 100% Pure | None | Inline SD deduction in `resolveWeeklyTurn()` | **SEMANTICALLY EQUIVALENT** | `src/engine.ts` | **A — DIRECT REUSE** |
| **`ConstructionService.ts`** | Pure (with PRNG) | `RandomService` | Inline patch upgrade yield calculations | **MISSING FORMULA** | `src/engine.ts` | **B — MINIMAL ADAPTATION** |
| **`TransactionService.ts`** | 100% Pure | None | Treasury checks | **SEMANTICALLY EQUIVALENT** | `src/engine.ts` | **B — MINIMAL ADAPTATION** |
| **`HoldingCatalogService.ts`** | 0% Pure | `fs.readFileSync`, `path.join` | Static data in `src/data.ts` | **REJECTED INFRASTRUCTURE** | N/A | **E — REJECTED INFRASTRUCTURE** |
| **CQRS Commands** (`StartConstruction`, `AllocateLabor`, `UpgradeHolding`, etc.) | 0% Pure | `IHoldingRepository`, `IEventStore`, `SQLite` | Engine facade actions | **REJECTED INFRASTRUCTURE** | N/A | **E — REJECTED INFRASTRUCTURE** |

---

## 3. Formula Inventory & Rules Canonical Audit

### 3.1 Holding Base Income
- **Rule Reference**: `@rule holdings.tiers` (Legacy Section 68.1)
- **Formula**:
  $$\text{DailyBaseSD} = \text{HOLDING\_INCOME\_PER\_DAY}[\text{holdingTier}]$$
  - Tier 0 (Hamlet): 2.5 SD/day (17.5 SD/week)
  - Tier 1 (Village): 7.5 SD/day (52.5 SD/week)
  - Tier 2 (Large Village): 15 SD/day (105 SD/week)
  - Tier 3 (Town): 30 SD/day (210 SD/week)
  - Tier 4 (Large Town): 50 SD/day (350 SD/week)
  - Tier 5 (City): 87.5 SD/day (612.5 SD/week)
  - Tier 6 (Large City): 150 SD/day (1050 SD/week)
  - Tier 7 (Metropolis): 250 SD/day (1750 SD/week)
  - Tier 8 (Capital): 500 SD/day (3500 SD/week)

### 3.2 Fortification Income
- **Rule Reference**: `@rule holdings.tiers` (Legacy Section 68.2)
- **Formula**:
  $$\text{DailyFortSD} = \text{FORTIFICATION\_INCOME\_PER\_DAY}[\text{fortificationTier}]$$
  - Tier 1 (Watchtower): 2.5 SD/day
  - Tier 2 (Fortified Manor): 7.5 SD/day
  - Tier 3 (Keep): 15 SD/day
  - Tier 4 (Castle): 30 SD/day
  - Tier 5 (Bastion): 50 SD/day
  - Tier 6 (Fortress): 75 SD/day
  - Tier 7 (Citadel): 125 SD/day

### 3.3 Resource Patch Production & Seasonal Penalty
- **Rule Reference**: `@rule holdings.patches` (Legacy Section 68.3)
- **Formula**:
  $$\text{DailyPatchSD} = \text{RESOURCE\_PATCH\_SD\_PER\_DAY}[\text{type}][\text{tier}]$$
  $$\text{DailyPatchFSU} = (\text{isWinter} \land \text{type} === \text{'grain\_field'}) ? (\text{DailyYield} \times 0.5) : \text{DailyYield}$$
- **Winter Agriculture Penalty**: 50% reduction in food yield during Winter months (`Inverno`).

### 3.4 Food Consumption Rules
- **Civilian Consumption**:
  $$\text{WeeklyCivilianFSU} = \text{Math.round}\left(\frac{\text{population}}{1000}\right)$$
  (Rule A.32: 1 FSU per 1,000 civilians per week).
- **Military / Garrison Consumption**:
  $$\text{WeeklyMilitaryFSU} = \frac{\text{totalSoldiers}}{100}$$
  (1 FSU per 100 soldiers/garrison per week).

### 3.5 Civilian Labor Pool & Allocation
- **Rule Reference**: `@rule holdings.patches`, `@rule holdings.buildings`
- **Total Labor Pool**:
  $$\text{LaborPool} = \lfloor \text{population} \times 0.40 \rfloor$$
- **Available Labor**:
  $$\text{AvailableLabor} = \max(0, \text{LaborPool} - \text{AllocatedLabor})$$

---

## 4. Target Gap Analysis

1. **Current Engine Mechanics (`src/engine.ts` lines 851–931)**:
   - `resolveWeeklyTurn()` performs inline economy calculations:
     - `holdingBaseIncome` is calculated via hardcoded string checks (`Bastion`, `Castle`, `Fortified Town`, `Walled City`).
     - `patchFood`, `patchTimber`, `patchIron`, `patchStone` are accumulated inline.
     - `totalFoodConsumption` (`u.size * 0.01`) is calculated inline.
     - Famine morale penalties (`morale - 1`) and desertion calculations (`10% per unit`) are hardcoded inside the turn resolution loop.
2. **Gap**:
   - The calculation of economic production, food consumption, labor capacity, and treasury deductions lacks cohesive domain boundary modules.
   - Extracting `ProductionService`, `FoodService`, `LaborService`, `TreasuryService`, and `ConstructionService` into `src/domain/kingdom/services/` establishes pure business rules and allows `src/engine.ts` to act strictly as facade orchestrator.

---

## 5. Duplication & Compatibility Analysis

- **`FoodService.calculateMilitaryConsumption(soldiers)`**: Exact match to `soldiers * 0.01` in target.
- **`LaborService.calculateLaborPool(population)`**: Exact match to `population * 0.40` in target.
- **`ProductionService.calculateDailyProduction()`**: Adaptable adapter maps target `s.holdings.type` or numeric `holdingTier` cleanly without altering `CampaignState`.
- **Verdict**: Zero risk of creating duplicate sources of truth. Migrating these services replaces inline engine math with pure canonical domain calls.

---

## 6. Architectural Impact & Facade Design

### Layered Architecture Flow:

$$\text{ActivePlay.tsx (UI)} \longrightarrow \text{engine.ts (resolveWeeklyTurn facade)} \longrightarrow \text{src/domain/kingdom/services/}$$

- **`src/engine.ts` Role**:
  - Exposes facade functions (e.g. `calculateWeeklyProduction()`, `calculateWeeklyFoodConsumption()`, `calculateLaborPool()`).
  - `resolveWeeklyTurn(state)` invokes these domain services to compute production and consumption results, then mutates `CampaignState` state slices.
- **`CampaignState` Integrity**:
  - 0 new state slices required.
  - Reuses `state.holdings`, `state.weeklyLedger`, `state.army.units`.

---

## 7. Recommended Migration Scope

### Components to Migrate:
1. **`src/domain/kingdom/services/ProductionService.ts`**: Pure domain class for holding, fortification, resource patch production, and winter penalties.
2. **`src/domain/kingdom/services/FoodService.ts`**: Pure domain class for civilian and military food consumption calculation.
3. **`src/domain/kingdom/services/LaborService.ts`**: Pure domain class for labor pool and labor availability calculation.
4. **`src/domain/kingdom/services/TreasuryService.ts`**: Pure domain class for non-military expense deductions.
5. **`src/domain/kingdom/services/ConstructionService.ts`**: Pure domain class for construction refund calculation and patch quality resolution.

### Components to Reject / Exclude:
1. **`HoldingCatalogService.ts`**: Rejected (Disk File I/O `fs.readFileSync`). Static catalogs remain in `src/data.ts`.
2. **CQRS Commands & Repositories**: Rejected (SQLite / EventStore infrastructure).

---

## 8. Test Status Baseline

- **Unit & Integration Suite (`npm test`)**: **PASSED (100%)**
- **Replay Validator (`ReplayValidator.ts`)**: **PASSED (10/10 snapshots deterministic)**
- **Build (`npm run build`)**: **PASSED (0 errors)**

---

## 9. Documentation Status
Saved in `docs/migration/KINGDOM_PRODUCTION_INTEGRATION_READINESS.md`.

---

## 10. Final Verdict

**STATUS: READY FOR MIGRATION**

Kingdom Production is READY for explicit human approval before implementation.
