# Time Service Integration Readiness Audit

## 1. Repository State

- **Branch**: `integration/legacy-consolidation`
- **Head Commit**: `d2d731f` (`feat: integrate kingdom construction domain into engine`)
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

## 2. Legacy Inventory (`legacy/main:src/domain/core/TimeService.ts`)

- **File**: `legacy/main:src/domain/core/TimeService.ts`
- **Exported Constants**:
  - `MONTHS`: Array of 12 month names (`["Frostwane", "Deepfrost", "Longdark", "Thawrise", "Greening", "Highsun", "Highsun", "Harvestfall", "Harvestfall", "Ashfall", "Ashfall", "Longdark"]`).
  - `MONTH_SEASONS`: Array of 12 Portuguese season names (`["Inverno", "Inverno", "Inverno", "Primavera", "Primavera", "Verão", "Verão", "Outono", "Outono", "Outono", "Outono", "Inverno"]`).
- **Exported Interfaces**:
  - `CalendarDate`: `{ day: number; monthNumber: number; monthName: string; season: string; year: number }`.
- **Exported Class**:
  - `TimeService`:
    - `calculateDate(absoluteTicks: number): CalendarDate` (calculates 360-day year, 30-day month, day 1..30).
    - `formatDate(absoluteTicks: number): string` (formats string: `"${monthName}, Dia ${day}, Ano ${year}"`).

---

## 3. Target Inventory (`src/engine.ts`, `src/data.ts`, `src/types.ts`)

- **Target Calendar Model (`src/data.ts`)**:
  - `MONTHS` is an **8-month fantasy calendar**: `["Frostwane", "Deepfrost", "Longdark", "Thawrise", "Greening", "Highsun", "Harvestfall", "Ashfall"]`.
- **Target Seasons (`src/types.ts`)**:
  - Fantasy season names: `'Thawtide'`, `'Sunreach'`, `'Reapingfall'`, `'Deepfrost'`.
- **Turn & Calendar Progression (`src/engine.ts`)**:
  - `resolveWeeklyTurn(state)` natively orchestrates campaign turn advancement: 4 weeks per month, 8 months per year = 32 weeks per year.
  - `getMonthIndexFromName(monthName)` maps month names to 1..8 month indices for domain services like `MarketService`.
  - `rollWeather(region, season, isWarmYear)` handles weather generation per turn.

---

## 4. Responsibility Analysis

- **Legacy Model**: Assumes a continuous daily tick counter (`absoluteTicks`), converting days to a 12-month / 360-day calendar date.
- **Target Model**: Operates on a weekly turn structure (`weeklyLedger.week`, `weeklyLedger.season`, `worldLedger.currentDate.month`, `worldLedger.currentDate.year`).
- **Architectural Boundary**: Calendar turn advancement is intrinsically tied to `CampaignState` turn mutation and belongs natively inside `src/engine.ts` facade orchestration, not as an independent domain service.

---

## 5. Formula / Rule Inventory & Gap Analysis

| Rule / Feature | Legacy `TimeService` | Target `src/engine.ts` / `src/data.ts` | Conflict / Gap Status |
|---|---|---|---|
| **Month Spec** | 12 months (duplicated names) | 8 distinct fantasy months | **DIRECT CONFLICT** |
| **Seasons** | 12 Portuguese seasons (`Inverno`, `Primavera`, etc.) | 4 fantasy seasons (`Thawtide`, `Sunreach`, etc.) | **DIRECT CONFLICT** |
| **Year Duration** | 360 days (12 months x 30 days) | 32 weeks (8 months x 4 weeks) | **DIRECT CONFLICT** |
| **Turn Advancement** | Daily tick converter (`calculateDate`) | Weekly Engine turn resolution (`resolveWeeklyTurn`) | **DIRECT CONFLICT** |
| **Month Index Adapter** | Missing | `getMonthIndexFromName()` in `src/engine.ts` | **TARGET SUPERIOR** |

---

## 6. Duplication Analysis

Migrating legacy `TimeService.ts` into the target would create **severe rule duplication and conflicting sources of truth**:
1. Conflicting month constants (`12-month legacy` vs `8-month target`).
2. Conflicting season names (`Portuguese` vs `Fantasy`).
3. Conflicting calendar calculation logic (`Daily tick conversion` vs `Weekly turn state mutation`).

---

## 7. Consumer Analysis

- **Target Calls to `TimeService`**: **0**.
- Zero components in `src/`, `src/engine.ts`, `src/types.ts`, `src/data.ts`, or `src/components/ActivePlay.tsx` call `calculateDate()` or use legacy `TimeService`.
- Target domain services (e.g. `MarketService`, `ProductionService`) consume month indices via `getMonthIndexFromName()` or `w.season` directly supplied by `src/engine.ts`.

---

## 8. Determinism Analysis

- **Purity Scan**: `TimeService.ts` contains 0 `Math.random()`, 0 `Date.now()`, 0 `fs.*`, 0 `sqlite`, 0 `EventStore`.
- **Finding**: While legacy `TimeService.ts` is mathematically pure, purity alone does not justify migration when the domain model conflicts with the target architecture.

---

## 9. Architectural Boundary Analysis

According to `docs/development/DEVELOPMENT_METHODOLOGY.md`:
- Domain services must solve a **real functional gap** and maintain **cohesive responsibility**.
- Legacy code must **NOT** be migrated merely because it exists.
- Calendar turn advancement natively belongs inside `src/engine.ts` as part of `CampaignState` turn orchestration.

---

## 10. Migration Value

- **Value**: **NONE / NEGATIVE**.
- Migrating `TimeService.ts` would break the target's 8-month calendar system, duplicate turn progression rules, and add unused code to `src/domain/`.

---

## 11. Risks

- **Domain Model Collision**: Clashes with `s.worldLedger.currentDate` and `s.weeklyLedger`.
- **UI & Market Breakdown**: Would distort `MarketService` seasonal pricing and `resolveWeeklyTurn` weather rolls.

---

## 12. Recommendation

**REJECT / EXCLUDE** legacy `TimeService.ts`. The target's existing calendar adapters in `src/engine.ts` and static specs in `src/data.ts` are architecturally superior and preserve 100% domain integrity.

---

## 13. Conditions

- Maintain calendar turn advancement and month name adapters inside `src/engine.ts` and `src/data.ts`.

---

## 14. Final Readiness Verdict

**REJECT**
