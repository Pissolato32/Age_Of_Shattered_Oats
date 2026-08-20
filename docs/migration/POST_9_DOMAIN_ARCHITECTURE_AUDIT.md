# Post-9-Domain Architecture Audit & Remaining Domain Triage

## 1. Repository State

- **Branch**: `integration/legacy-consolidation`
- **HEAD Commit**: `d2d731f` (`feat: integrate kingdom construction domain into engine`)
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
  10. `adventure/AdventureEngine.ts` (Pre-existing target domain)

---

## 2. Consolidated 9 Domains Matrix

| Domain | Target Path | Engine Facade Entrypoint | Purity | Status |
|---|---|---|---|---|
| **`character`** | `src/domain/character/Character.ts` | `createCharacter()` | 100% Pure | **CONSOLIDATED & INTEGRATED** |
| **`relationship`** | `src/domain/relationship/Relationship.ts` | `setHouseOpinion()` / `recordVow()` | 100% Pure | **CONSOLIDATED & INTEGRATED** |
| **`npc_ai`** | `src/domain/npc_ai/CommanderAIService.ts` | `selectCommanderTactic()` | 100% Pure | **CONSOLIDATED & INTEGRATED** |
| **`visibility`** | `src/domain/visibility/VisibilityService.ts` | `calculateEventVisibility()` | 100% Pure | **CONSOLIDATED & INTEGRATED** |
| **`commerce`** | `src/domain/commerce/services/MarketService.ts` | `calculateMaterialPrice()` | 100% Pure | **CONSOLIDATED & INTEGRATED** |
| **`items`** | `src/domain/items/CombatStatsCalculator.ts` | `calculateCharacterCombatStats()` | 100% Pure | **CONSOLIDATED & INTEGRATED** |
| **`kingdom/succession`** | `src/domain/kingdom/services/SuccessionService.ts` | `resolveDynasticSuccession()` | 100% Pure | **CONSOLIDATED & INTEGRATED** |
| **`kingdom/production`** | `src/domain/kingdom/services/` | `calculateWeeklyProduction()` / `calculateFoodConsumption()` / `calculateLaborCapacity()` | 100% Pure | **CONSOLIDATED & INTEGRATED** |
| **`kingdom/construction`** | `src/domain/kingdom/services/ConstructionService.ts` | `calculateConstructionRefund()` / `resolveResourcePatchQuality()` | 100% Pure (with PRNG boundary) | **CONSOLIDATED & INTEGRATED** |

---

## 3. Construction Integration Verification

- **Module**: `src/domain/kingdom/services/ConstructionService.ts`
- **Engine Facades**: `calculateConstructionRefund()`, `resolveResourcePatchQuality(prng = globalRNG)`
- **Determinism**: 100% deterministic (PRNG supplied explicitly by Engine via `globalRNG`).
- **Tests**: `tests/domain/KingdomConstruction.test.ts` and `tests/integration/KingdomConstructionEngineIntegration.test.ts` passing 100%.

---

## 4. Remaining Legacy Candidates Analysis & Triage

Remaining legacy candidates evaluated:

1. **`core/TimeService.ts`**:
   - **Legacy Source**: `legacy/main:src/core/TimeService.ts`
   - **Nature**: Pure calendar translation utility (`MONTH_SEASONS`, `calculateDaysBetween`, season lookups).
   - **Value**: High utility for time, season, and month calculations across Engine turns.
   - **Infrastructure Coupling**: 0%.

2. **`military/services/PayrollService.ts` & `BreedingService.ts`**:
   - **Legacy Source**: `legacy/main:src/domain/military/services/`
   - **Nature**: Pure calculations for unit tier payroll wages and mount breeding quality.
   - **Value**: Medium gameplay value for military upkeep and mount mechanics.
   - **Infrastructure Coupling**: 0%.

3. **`holdings/`**:
   - **Legacy Source**: `legacy/main:src/domain/holdings/`
   - **Nature**: Building requirements and upgrade validation models.
   - **Infrastructure Coupling**: Low to Medium.

4. **`crime/`**:
   - **Legacy Source**: `legacy/main:src/domain/crime/`
   - **Nature**: Ransom and escape difficulty calculators.
   - **Status**: **DEFERRED** (previously audited in `CRIME_INTEGRATION_READINESS.md` — target currently lacks `captivity` state slices).

---

## 5. Candidate Ranking for 10th Domain

1. **Candidate #1 (Recommended)**: **`core/TimeService.ts`** — Pure calendar, month index, and season utility domain module with zero infrastructure coupling and high utility across Engine turns.
2. **Candidate #2**: **`military/services/PayrollService.ts`** — Pure domain military wage calculator.
3. **Candidate #3**: **`military/services/BreedingService.ts`** — Pure domain mount quality calculator.

---

## 6. Final Architectural Verdict

**STATUS: ARCHITECTURALLY HEALTHY — SAFE TO SELECT NEXT DOMAIN**
