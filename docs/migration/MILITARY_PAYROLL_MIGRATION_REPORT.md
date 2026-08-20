# Military Payroll Domain Migration Report (10th Consolidated Domain)

## 1. Repository State

- **Branch**: `integration/legacy-consolidation`
- **Pre-Migration Commit**: `d2d731f`
- **Post-Migration Commit**: `d2d731f` (staged for commit)
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

---

## 2. Legacy Source & Scope

- **Legacy Source**: `legacy/main:src/domain/military/services/PayrollService.ts`
- **Target Path**: `src/domain/military/services/PayrollService.ts`
- **Migrated Components**:
  - `PayrollService.calculateUpkeep(totalSoldiers)`
  - `PayrollService.calculateMilitaryWages(unitSizes, garrisonSize)`
  - `PayrollService.applyPaymentOutcome(holdingState, paid)`
  - `PayrollService.resolveDesertion(unpaidWeeks, prng)`
  - `PayrollService.applyDesertionToUnits(units, deserterCount)`
- **Rejected Legacy Infrastructure**:
  - `PayRetinuesCommand` (CQRS / EventStore wrapper rejected).
  - `WeeklyUpkeepCommand` (CQRS / EventStore wrapper rejected).

---

## 3. Preserved Canonical Rules

1. **Soldier Upkeep & Wages**:
   - `wageCost`: `Math.ceil(totalSoldiers / 10)` (0.1 SD per soldier).
   - `foodCost`: `totalSoldiers / 100` (0.01 FSU per soldier).
   - `garrisonWages`: `Math.ceil(garrison / 20)` (0.05 SD per garrison soldier).

2. **Payment Outcome & Morale**:
   - Paid: Resets `unpaidTicks` to 0, restores unit morale to baseline (min 5).
   - Unpaid: Increments `unpaidTicks`, applies `-2 morale` penalty per unpaid week (clamped min 1).

3. **Unpaid Wage Desertion (Rule G.3)**:
   - Week 1: 1d6 roll <= 2 trigger, 1d10 deserters.
   - Week 2: 1d6 roll <= 3 trigger, 2d10 deserters.
   - Week 3+: 1d6 roll <= 4 trigger, 3d10 deserters.

4. **Troop Deduction Safety**:
   - Deducts deserters safely from unit arrays from back to front without negative values.

---

## 4. Engine Facade Integration (`src/engine.ts`)

- `calculateMilitaryWages(units: { size: number }[], garrison: number)`
- `resolveTroopDesertion(unpaidWeeks: number, prng = globalRNG)`
- Wired directly into `resolveWeeklyTurn(state)` replacing inline wage math and handling unpaid wage streak desertions deterministically via `globalRNG`.

---

## 5. CampaignState & UI Impact

- **CampaignState**: `s.army.units`, `s.holdings.garrison`, `s.weeklyLedger.silverdew`, `s.weeklyLedger.unpaidWagesTicks`.
- **UI (`ActivePlay.tsx`)**: Intact. Presentation layer consumes Engine facades without direct coupling to domain services.

---

## 6. Determinism & RNG Integration

- `resolveTroopDesertion` receives the deterministic `globalRNG` instance (`src/core/RandomService.ts`) at the Engine boundary.
- **Snapshot Replay Validation**: `ReplayValidator.ts` verified 10/10 snapshots as 100% deterministic and sequential.

---

## 7. Validation Results

- **Unit Tests (`tests/domain/MilitaryPayroll.test.ts`)**: **PASSED 100%**.
- **Integration Tests (`tests/integration/MilitaryPayrollEngineIntegration.test.ts`)**: **PASSED 100%**.
- **Full Test Suite (`npm test`)**: **PASSED 100%** (Golden Scenarios 6/6 + 10 domain unit/integration suites + ReplayValidator).
- **Production Build (`npm run build`)**: **PASSED 0 errors**.
- **Domain Purity Audit**: **0 forbidden dependencies** in `src/domain/military`.
- **Duplication Audit**: Exactly **1 authoritative facade per mechanic** in `src/engine.ts`.

---

## 8. Final Status

**MIGRATION COMPLETE**
