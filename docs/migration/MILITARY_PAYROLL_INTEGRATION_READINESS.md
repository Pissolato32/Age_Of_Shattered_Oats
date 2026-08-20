# Military Payroll Integration Readiness

## 1. Repository State

- **Branch**: `integration/legacy-consolidation`
- **Current HEAD Commit**: `d2d731f` (`feat: integrate kingdom construction domain into engine`)
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

## 2. Legacy Inventory (`legacy/main:src/domain/military/services/PayrollService.ts`)

- **Component**: `legacy/main:src/domain/military/services/PayrollService.ts`
- **Rule Reference**: `@rule military.retinues`
- **Legacy Methods**:
  - `calculateUpkeep(totalSoldiers: number): UpkeepCosts`: Calculates weekly wage cost (`Math.ceil(totalSoldiers / 10)`) and food cost (`totalSoldiers / 100`).
  - `applyPaymentOutcome(holdingState, paid: boolean): void`: Restores morale (min 5) if paid; increments `unpaidTicks` and applies morale penalty (`-2`, min 1) if unpaid.
  - `resolveDesertion(unpaidWeeks: number, prng: RandomService): DesertionResult`: Evaluates 1d6 roll vs unpaid streak threshold (Week 1: 1-2, Week 2: 1-3, Week 3+: 1-4) and rolls deserting troops (1d10, 2d10, 3d10).
  - `applyDesertionToUnits(units: any[], deserterCount: number): number`: Deducts deserting troops from unit arrays.

---

## 3. Target Inventory (`src/engine.ts`, `src/types.ts`, `src/data.ts`)

- **Current Engine Turn Resolution (`src/engine.ts` lines 940–990)**:
  - `resolveWeeklyTurn(state)` calculates troop wages inline: `u.size * 0.1` for active units and `garrison * 0.05` for garrison.
  - Passes total wages to `TreasuryService.deductExpenses({ treasurySd }, totalWages)`.
  - If unpaid (`treasuryOutcome.defaulted`), applies `-2 morale` penalty inline.
  - Famine desertions (`10% per unit`) are handled during food shortage.

---

## 4. Payroll Responsibility Analysis

- **Legacy Responsibility**: Centralizes military wage calculations, payment outcomes, morale recovery/penalties, and unpaid wage desertion rolls.
- **Target Responsibility Gap**: Currently, wage calculations (`u.size * 0.1` and `garrison * 0.05`) are embedded as inline math in `resolveWeeklyTurn()`. Migrating `PayrollService` extracts these pure business calculations into `src/domain/military/services/PayrollService.ts`, allowing `src/engine.ts` to act strictly as facade orchestrator.

---

## 5. Formula / Rule Inventory

| Formula / Rule | Legacy Formula | Target Current Implementation | Status |
|---|---|---|---|
| **Troop Wages** | `Math.ceil(totalSoldiers / 10)` (0.1 SD/soldier) | Inline `u.size * 0.1` in `resolveWeeklyTurn()` | **DUPLICATED / INLINE** |
| **Garrison Wages** | Included in garrison upkeep (0.05 SD/garrison) | Inline `garrison * 0.05` in `resolveWeeklyTurn()` | **DUPLICATED / INLINE** |
| **Payment Morale Recovery** | Paid: restore morale to min 5 | Unmapped | **MISSING FORMULA** |
| **Unpaid Morale Penalty** | Unpaid: `-2 morale` (clamped min 1) | Inline `u.morale = Math.max(1, u.morale - 2)` | **DUPLICATED / INLINE** |
| **Unpaid Wage Desertion** | 1d6 roll vs threshold (1-2/1-3/1-4) + 1d10/2d10/3d10 | Unmapped for unpaid wages (only food famine desertion exists) | **MISSING FORMULA** |

---

## 6. Determinism Analysis

- **Purity Scan**: `PayrollService.ts` contains 0 `Math.random()`, 0 `Date.now()`, 0 `fs.*`, 0 `sqlite`, 0 `EventStore`.
- **RNG Boundary**: `resolveDesertion(unpaidWeeks, prng)` receives a PRNG provider. Supplying `globalRNG` from `src/core/RandomService.ts` at the Engine facade boundary preserves 100% deterministic snapshot replayability (`ReplayValidator.ts`).

---

## 7. CampaignState Compatibility

- **`CampaignState` (`src/types.ts`)**:
  - `state.army.units`: Contains unit sizes and morale (`u.size`, `u.morale`).
  - `state.holdings.garrison`: Contains garrison headcount.
  - `state.weeklyLedger.silverdew`: Contains treasury SD balance.
  - `state.weeklyLedger.unpaidWagesTicks`: Unpaid wage streak counter.
- **Compatibility Status**: **COMPATIBLE**.

---

## 8. Consumer Analysis

- **Active Target Consumer**: `resolveWeeklyTurn()` in `src/engine.ts`.
- **Engine Facade Entrypoints**:
  - `calculateMilitaryWages(units: { size: number }[], garrison: number): { armyWages: number; garrisonWages: number; totalWages: number }`
  - `resolveTroopDesertion(unpaidWeeks: number, prng = globalRNG): DesertionResult`

---

## 9. Duplication Analysis

- Inline formulas for troop wages (`u.size * 0.1`) and garrison wages (`garrison * 0.05`) in `resolveWeeklyTurn()` will be removed and replaced by `PayrollService`.
- There will remain **exactly ONE authoritative implementation** for military payroll calculations.

---

## 10. Architectural Boundary Analysis

- **Cohesion & Domain Isolation**: `PayrollService` forms a clear, cohesive domain module under `src/domain/military/services/`.
- **Engine Facade Stability**: `src/engine.ts` remains the authoritative public API and state orchestrator.

---

## 11. Migration Scope Options

- **Option A (Recommended)**:
  - Migrate `src/domain/military/services/PayrollService.ts`.
  - Expose Engine facades: `calculateMilitaryWages()` and `resolveTroopDesertion()`.
  - Wire into `resolveWeeklyTurn()`, replacing inline wage math.
  - Reject legacy CQRS commands (`PayRetinuesCommand`, `WeeklyUpkeepCommand`).

---

## 12. Risks

- **Determinism Risk**: **LOW** (explicit `globalRNG` injection at Engine boundary).
- **Replay Risk**: **LOW** (preserves snapshot replayability).
- **Integration Risk**: **LOW** (pure calculation service with clear parameters).

---

## 13. Recommendation

Migrate `PayrollService.ts` into `src/domain/military/services/PayrollService.ts` as the 10th consolidated domain module.

---

## 14. Conditions

- `resolveDesertion()` MUST receive the deterministic `globalRNG` explicitly through the Engine boundary.

---

## 15. Final Readiness Verdict

**STATUS: READY WITH CONDITIONS**

**Condition**: `resolveDesertion` MUST receive the deterministic `globalRNG` explicitly from the Engine boundary to guarantee 100% snapshot replayability.
