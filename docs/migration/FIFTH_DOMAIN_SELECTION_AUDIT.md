# Fifth Domain Selection Audit

## 1. Current Migration State
- **Repository Branch**: `integration/legacy-consolidation` (Commit `9a696ab`).
- **Golden Principle**: `GAME ENGINE = SINGLE SOURCE OF TRUTH`.
- **Completed Migrations**:
  - `character`: Migrated and consolidated (`src/domain/character/`).
  - `relationship`: Migrated (`Relationship.ts`, `MemoryLog.ts`), integrated into `src/engine.ts` (`adjustHouseOpinion`/`setHouseOpinion`), 100% verified.
  - `npc_ai`: Migrated (`CommanderAIService.ts`), integrated into `src/engine.ts` (`resolveNpcCombatAction`), 100% verified.
  - `visibility`: Migrated (`VisibilityService.ts`), integrated into `src/engine.ts` (`isEventVisibleToObserver`/`getVisibleWorldSecrets`), 100% verified.
- **Rejected Modules**:
  - `narrator`: Rejected (StateApplicator 2-way disk mutation violation).
  - `world`: Rejected (High duplication with `calculateTravelTime` and `rollWeather` in `engine.ts`).
  - `region`: Rejected (Synchronous `fs.readFileSync` disk YAML I/O).
- **Already Present**:
  - `adventure`: Present in target repository (`src/domain/adventure/AdventureEngine.ts` committed in `f05d668`).

---

## 2. Documentation State
- Master consolidation control matrix established in [docs/migration/MIGRATION_MATRIX.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MIGRATION_MATRIX.md).
- Root directory cleaned of migration document clutter; all 13 process markdown files organized into `docs/migration/`.
- Canonical architecture (`docs/architecture/`), design (`docs/design/`), and testing (`docs/testing/`) blueprints established.

---

## 3. Remaining Legacy Domains

The unmigrated candidate domains in `legacy/main:src/domain/` include:
- `commerce`: Dynamic market commodity pricing (`MarketService.ts`).
- `core`: Calendar time translation (`TimeService.ts`).
- `crime`: Prison escape and ransom difficulty queries (`EscapeCatalogService.ts`, etc.).
- `holdings`: Holding models (`Holding.ts`).
- `items`: Equipment stats calculator (`CombatStatsCalculator.ts`).
- `kingdom`: Construction, labor, food, production, treasury, succession services.
- `military`: Mount breeding, retinue payroll, ship building services.

---

## 4. Candidate Analysis

### Candidate 1: `commerce` (`src/domain/commerce/`)
- **Responsibility**: Dynamic commodity market price calculation (`MarketService.ts`) incorporating base prices, regional demand modifiers (`REGIONAL_DEMAND_MODIFIERS`), seasonal scarcity (+50% winter grain scarcity, +25% winter fur demand, -20% summer abundance), and market saturation penalties/bonuses.
- **Architectural Layer**: **DOMAIN SERVICE**
- **Source Files**: `src/domain/commerce/services/MarketService.ts`
- **Tests**: `tests/domain/EconomyWeekly.test.ts`
- **Dependencies**: Static `MONTH_SEASONS` array from `TimeService`. 0 SQLite DB, 0 filesystem I/O, 0 EventStore/SnapshotStore, 0 RNG, 0 Clock.
- **Target Equivalent / Duplication**: Target `src/data.ts` contains static market condition strings (`tradeVolume`, `priceTrend`, `shortages`), but has **zero** dynamic commodity pricing formula (`calculatePrice`).
- **Migration Complexity**: **LOW**
- **Migration Risk**: **LOW**
- **Architectural Value**: **HIGH** (Provides clean, deterministic trade pricing for commercial transactions in `ActivePlay.tsx` and `src/engine.ts`).
- **Reuse Classification**: **B — MINIMAL ADAPTATION** (Pure class; self-contained `MONTH_SEASONS` array).

---

### Candidate 2: `core/TimeService` (`src/domain/core/`)
- **Responsibility**: Translates absolute simulated ticks (days) into structured `CalendarDate` objects (`day`, `monthNumber`, `monthName`, `season`, `year`).
- **Architectural Layer**: **DOMAIN**
- **Source Files**: `src/domain/core/TimeService.ts`
- **Tests**: `tests/domain/CoreAndCharacter.test.ts`
- **Target Equivalent**: Target `src/engine.ts` calculates dates inline in `resolveWeeklyTurn()`.
- **Migration Complexity**: **LOW**
- **Migration Risk**: **LOW**
- **Architectural Value**: **MEDIUM**
- **Reuse Classification**: **A — DIRECT REUSE**

---

### Candidate 3: `items/CombatStatsCalculator` (`src/domain/items/`)
- **Responsibility**: Derives dynamic Armor Class and Initiative stats from character equipment (`CombatStatsCalculator.ts`).
- **Architectural Layer**: **DOMAIN SERVICE**
- **Source Files**: `src/domain/items/CombatStatsCalculator.ts`
- **Dependencies**: Depends on `ItemCatalogService` (which reads `docs/compiled/items.json` from disk).
- **Migration Complexity**: **MEDIUM**
- **Migration Risk**: **MEDIUM**
- **Reuse Classification**: **C — SIGNIFICANT ADAPTATION**

---

## 5. Rejected Candidates
- `kingdom` / `military` / `crime`: Heavily coupled to legacy SQLite repositories (`IHoldingRepository`), legacy `IEventStore`, `ISnapshotStore`, and disk JSON files (`docs/compiled/`). Selective extraction of pure formulas can be evaluated in future phases.

---

## 6. Candidate Ranking

1. **`commerce` (`MarketService.ts`)** — **RECOMMENDED FIFTH DOMAIN**  
   - Layer: DOMAIN SERVICE | Value: HIGH | Risk: LOW | Duplication: NONE.
2. **`core/TimeService` (`TimeService.ts`)**  
   - Layer: DOMAIN | Value: MEDIUM | Risk: LOW | Duplication: PARTIAL (Engine inline date logic).
3. **`items/CombatStatsCalculator` (`CombatStatsCalculator.ts`)**  
   - Layer: DOMAIN SERVICE | Value: MEDIUM | Risk: MEDIUM | Duplication: NONE.

---

## 7. Recommended Fifth Domain

### **RECOMMENDED FIFTH DOMAIN: commerce (`MarketService.ts`)**

**Technical Justification**:
1. **High Architectural & Gameplay Value**: `MarketService.ts` introduces dynamic commodity trade pricing formulas based on regional demand (`northern_snowlands`, `nomad_steppe`, `western_rivers`, `eastern_forests`, `central_plains`, `southern_mountains`), seasonal scarcity (+50% winter grain scarcity, +25% fur demand), and market saturation levels (0.4 glut penalty to 1.1 scarcity bonus).
2. **Zero Infrastructure Coupling**: 0 SQLite DB dependencies, 0 filesystem dependencies, 0 EventStore/SnapshotStore dependencies, 0 AI/RAG dependencies.
3. **Pure Determinism**: 0 RNG calls, 0 Clock calls. It is a 100% deterministic mathematical price calculator (`calculatePrice`).
4. **Zero Target Duplication**: Target `src/data.ts` has static text descriptors, but no dynamic commodity price calculation formula.
5. **Existing Test Coverage**: Tested in `tests/domain/EconomyWeekly.test.ts` (<5ms execution).

---

## 8. Integration Boundary

### Proposed Engine Entrypoint (`src/engine.ts`)
```ts
export function calculateMaterialPrice(
  basePrice: number,
  materialId: string,
  regionId: string,
  monthNumber: number,
  stock = 0,
  marketCapacity = 150
): MarketPriceResult {
  const service = new MarketService();
  return service.calculatePrice(basePrice, materialId, regionId, monthNumber, stock, marketCapacity);
}
```

---

## 9. Risks
- **LOW RISK**: Pure read-only price calculation service. Does not mutate `CampaignState` or break deterministic turn execution.

---

## 10. Expected Gameplay Value
Players trading resources or purchasing supplies in regional markets will experience realistic, location- and season-sensitive commodity pricing (e.g. grain costs 50% more in winter; furs cost less in summer in forest regions).

---

## 11. Required Next Steps
1. Perform controlled readiness audit for `commerce` (`MarketService.ts`).
2. Export `calculateMaterialPrice()` in `src/engine.ts`.
3. Integrate price calculation in `ActivePlay.tsx` trade menu.
4. Add unit and engine integration tests.

---

## 12. Approval Gate

> [!IMPORTANT]
> **Esta etapa NÃO realizou migração de código.**  
> **Implementação do quinto domínio requer aprovação explícita.**
