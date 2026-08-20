# Military Breeding Integration Readiness Audit

## 1. Repository State

- **Branch**: `integration/legacy-consolidation`
- **Current HEAD Commit**: `7eed3f8` (`feat: integrate military payroll domain into engine`)
- **Working Tree**: Clean (`.agent/` untracked directory).
- **Target `src/domain/` Inventory**:
  1. `character/Character.ts`
  2. `relationship/Relationship.ts`, `MemoryLog.ts`
  3. `npc_ai/CommanderAIService.ts`
  4. `visibility/VisibilityService.ts`
  5. `commerce/services/MarketService.ts`
  6. `items/CombatStatsCalculator.ts`
  7. `kingdom/services/SuccessionService.ts`
  8. `kingdom/services/ProductionService.ts`, `FoodService.ts`, `LaborService.ts`, `TreasuryService.ts`
  9. `kingdom/services/ConstructionService.ts`
  10. `military/services/PayrollService.ts`
  11. `adventure/AdventureEngine.ts` (Pre-existing target domain)

---

## 2. Legacy Inventory (`legacy/main:src/domain/military/services/BreedingService.ts`)

- **Component**: `legacy/main:src/domain/military/services/BreedingService.ts`
- **Rule Reference**: `@rule military.breeding`
- **Legacy Methods**:
  - `calculateSuccessRate(baseSuccessRate, primaryRegion, mountId, location, holdingTier)`:
    - Checks if breeding `location` matches the mount's `primaryRegion`.
    - If non-native region: applies `-25% success chance penalty` (`Math.max(0.10, rate - 0.25)`).
    - If `mountId === 'destrier'` and `holdingTier < 5`: applies capital breeding penalty (`-20% success chance`, clamped to `0.10`).
    - Rounds success rate to 2 decimal places (`Math.round(rate * 100) / 100`).
  - `normalizeRegionName(location)`: Helper for standardizing region string names.

---

## 3. Target Inventory (`src/data.ts`, `src/types.ts`, `src/engine.ts`)

- **Target Data Specs (`src/data.ts`)**:
  - `MOUNT_SPECS`: Contains `riding_horse`, `warhorse`, `draft_warhorse` specs.
  - Regions: `"Southern Mountains"`, `"Central Plains"`, `"Nomad Steppe"`, `"Western Rivers"`.
- **Target Engine (`src/engine.ts`)**:
  - Mounts are currently equipped as character items (`char.stats.mount`) providing initiative modifiers via `CombatStatsCalculator.ts`.
  - **Active Consumer Status**: Currently, `resolveWeeklyTurn()` does NOT execute mount breeding progression commands.

---

## 4. Responsibility Analysis

- **Legacy Responsibility**: Calculates breeding success probability based on regional suitability and holding tier limits.
- **Target Architectural Gap**: `BreedingService` represents a pure business calculation module. If integrated, it will expose `calculateMountBreedingSuccessRate()` via the Engine facade.

---

## 5. Formula / Rule Inventory

| Formula / Rule | Legacy Formula | Target Status |
|---|---|---|
| **Non-Native Region Penalty** | `Math.max(0.10, baseRate - 0.25)` if region does not match primary region | **UNMAPPED IN TARGET** |
| **Destrier Capital Penalty** | `Math.max(0.10, rate - 0.20)` if `mountId === 'destrier'` and `holdingTier < 5` | **UNMAPPED IN TARGET** |
| **Region Normalization** | Normalizes mountain/river/steppe/plain strings | **EQUIVALENT STRING MATCHING IN DATA** |

---

## 6. Determinism Analysis

- **Purity Scan**: `BreedingService.ts` contains 0 `Math.random()`, 0 `Date.now()`, 0 `fs.*`, 0 `sqlite`, 0 `EventStore`.
- **Finding**: `BreedingService.ts` is 100% mathematically pure and has 0 infrastructure dependencies.

---

## 7. CampaignState Compatibility

- **`CampaignState` (`src/types.ts`)**:
  - `state.holdings.mountBreeding` (optional state property exists).
- **Compatibility Status**: **COMPATIBLE**.

---

## 8. Consumer Analysis

- **Active Engine Consumer**: None currently in `src/engine.ts` turn resolution loop.
- **Engine Facade Entrypoint**:
  - `calculateMountBreedingSuccessRate(baseRate: number, primaryRegion: string | undefined, mountId: string, location: string, holdingTier: number): number`

---

## 9. Architectural Boundary Analysis

- **Cohesion & Pure Domain Isolation**: `BreedingService` forms a clean, cohesive domain module under `src/domain/military/services/BreedingService.ts`.
- **Engine Facade Boundary**: Engine facade delegates success rate calculations directly to `BreedingService`.

---

## 10. Migration Scope Options

- **Option A (Recommended)**:
  - Migrate pure `BreedingService.ts` into `src/domain/military/services/BreedingService.ts`.
  - Expose Engine facade `calculateMountBreedingSuccessRate()`.
  - Reject legacy CQRS commands (`StartMountBreedingCommand`, `ProgressMountBreedingCommand`) coupled to SQLite/EventStore.

---

## 11. Risks

- **Determinism Risk**: **ZERO** (100% pure math).
- **Integration Risk**: **ZERO** (pure calculation service).

---

## 12. Recommendation

Migrate `BreedingService.ts` into `src/domain/military/services/BreedingService.ts` as a pure domain module.

---

## 13. Conditions

- Must be exposed via Engine facade `calculateMountBreedingSuccessRate()`.
- Legacy CQRS commands must remain rejected.
- Requires explicit human approval before generating or executing the implementation prompt.

---

## 14. Final Readiness Verdict

**STATUS: READY WITH CONDITIONS**

**Condition**: Requires explicit human approval before generating or executing the implementation prompt.
