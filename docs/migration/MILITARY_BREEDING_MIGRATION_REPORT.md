# Military Breeding Domain Migration Report (11th Consolidated Domain)

## 1. Repository State

- **Branch**: `integration/legacy-consolidation`
- **Pre-Migration Commit**: `7eed3f8`
- **Post-Migration Commit**: `7eed3f8` (staged for commit)
- **Target `src/domain/` Consolidated Domains**:
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
  11. `military/services/BreedingService.ts`

---

## 2. Legacy Source & Scope

- **Legacy Source**: `legacy/main:src/domain/military/services/BreedingService.ts`
- **Target Path**: `src/domain/military/services/BreedingService.ts`
- **Migrated Components**:
  - `BreedingService.calculateSuccessRate(baseSuccessRate, primaryRegion, mountId, location, holdingTier)`
  - `BreedingService.normalizeRegionName(location)`
- **Rejected Legacy Infrastructure**:
  - `StartMountBreedingCommand` (CQRS / EventStore wrapper rejected).
  - `ProgressMountBreedingCommand` (CQRS / EventStore wrapper rejected).

---

## 3. Preserved Canonical Rules

1. **Non-Native Region Breeding Penalty**:
   - `Math.max(0.10, rate - 0.25)` if breeding `location` does not match the mount's `primaryRegion`.

2. **Destrier Capital Fortification Requirement Penalty**:
   - `Math.max(0.10, rate - 0.20)` if `mountId === 'destrier'` and `holdingTier < 5`.

3. **Probability Rounding & Minimum Clamping**:
   - Final success rate is clamped to a minimum of `0.10` and rounded to 2 decimal places (`Math.round(rate * 100) / 100`).

---

## 4. Engine Facade Integration (`src/engine.ts`)

- `calculateMountBreedingSuccessRate(baseSuccessRate: number, primaryRegion: string | undefined, mountId: string, location: string, holdingTier: number): number`
- Delegates directly to `BreedingService.calculateSuccessRate()`.

---

## 5. CampaignState & UI Impact

- **Domain Scope Classification**: **MIGRATION COMPLETE — DOMAIN CONSOLIDATED, GAMEPLAY DEFERRED**.
- **CampaignState**: `mountBreeding?: any` optional field preserved.
- **ActivePlay / Turn Loop**: Pure calculation service consolidated and exposed via Engine facade. Active turn resolution loop in `resolveWeeklyTurn()` does not execute mount breeding commands (gameplay flow deferred).

---

## 6. Determinism & Validation Results

- **Purity Scan**: **0 forbidden dependencies** in `src/domain/military`.
- **Unit Tests (`tests/domain/MilitaryBreeding.test.ts`)**: **PASSED 100%**.
- **Integration Tests (`tests/integration/MilitaryBreedingEngineIntegration.test.ts`)**: **PASSED 100%**.
- **Full Test Suite (`npm test`)**: **PASSED 100%** (Golden Scenarios 6/6 + 11 domain unit/integration suites + ReplayValidator).
- **Production Build (`npm run build`)**: **PASSED 0 errors**.
- **Snapshot Replay Validation**: `ReplayValidator.ts` verified 10/10 snapshots as 100% deterministic and sequential.

---

## 7. Final Status

**MIGRATION COMPLETE — DOMAIN CONSOLIDATED, GAMEPLAY DEFERRED**
