# Kingdom Production Migration Report (Production, Food, Labor, Treasury Services)

## 1. Migrated Domain Files
- `src/domain/kingdom/services/ProductionService.ts`: Pure domain calculator for holding, fortification, resource patch yield, and agricultural winter penalties.
- `src/domain/kingdom/services/FoodService.ts`: Pure domain calculator for civilian (1 FSU / 1000 pop) and military (1 FSU / 100 soldiers) food consumption and famine tracking.
- `src/domain/kingdom/services/LaborService.ts`: Pure domain calculator for civilian labor pool (40% of population) and available workforce capacity.
- `src/domain/kingdom/services/TreasuryService.ts`: Pure domain service for non-military expense deductions.

---

## 2. Adapted Target Files
- `src/engine.ts`:
  - Added facade functions: `calculateWeeklyProduction()`, `calculateFoodConsumption()`, `calculateLaborCapacity()`.
  - Updated `resolveWeeklyTurn()` to delegate economic production, food consumption, and treasury deduction calculations directly to domain services.
  - Removed duplicate inline math formulas for food consumption and resource patch winter yields.
- `package.json`:
  - Added `tests/domain/KingdomProduction.test.ts` and `tests/integration/KingdomProductionEngineIntegration.test.ts` to `npm test`.

---

## 3. Deliberately Deferred / Rejected Legacy Components
- **`ConstructionService.ts`**: DEFERRED (requires separate PRNG construction roll audit).
- **`HoldingCatalogService.ts`**: REJECTED (Disk File I/O `fs.readFileSync`). Static catalogs remain in `src/data.ts`.
- **CQRS Commands & Repositories**: REJECTED (`StartConstructionCommand`, `AllocateLaborCommand`, etc. — SQLite / EventStore infrastructure).

---

## 4. Canonical Rules Preserved
- **Rule Reference**: `@rule holdings.tiers`, `@rule holdings.patches`, `@rule economy.weekly`
- **Holding & Fortification Income**: Daily yields per tier table.
- **Agricultural Winter Penalty**: 50% reduction in food yield during winter months (`Inverno`).
- **Food Consumption**: 1 FSU per 1,000 civilians per week; 1 FSU per 100 soldiers per week.
- **Labor Pool**: 40% of civilian population.

---

## 5. Test Suite & Validation
- **Unit Tests**: `tests/domain/KingdomProduction.test.ts` (**PASSED 100%**)
- **Integration Tests**: `tests/integration/KingdomProductionEngineIntegration.test.ts` (**PASSED 100%**)
- **Full Test Suite (`npm test`)**: **PASSED 100%**
- **Build (`npm run build`)**: **PASSED 0 errors**
- **Replay Validator (`ReplayValidator.ts`)**: **PASSED 10/10 snapshots**
- **Purity Scan**: 0 forbidden dependencies in `src/domain/kingdom/`.

---

## 6. Migration Matrix Status
Updated `docs/migration/MIGRATION_MATRIX.md`:
- `kingdom/succession`: **MIGRATED & INTEGRATED**
- `kingdom/production`: **MIGRATED & INTEGRATED**
- `kingdom/construction`: **PENDING / DEFERRED**
