# Commerce Migration Report

## 1. Files Migrated
- `src/domain/commerce/services/MarketService.ts` (Pure domain service copied from `legacy/main` with embedded `MONTH_SEASONS` array to eliminate external dependencies).

---

## 2. Files Adapted
- `src/engine.ts`: Added Commerce integration helpers:
  - `getMonthNumberFromName(monthName)`: Maps target 12-month calendar strings (`Frostwane` $\rightarrow$ 1, `Greening` $\rightarrow$ 4, `Highsun_1` $\rightarrow$ 5, `Harvestfall_1` $\rightarrow$ 7, `Ashfall_1` $\rightarrow$ 9, `Longdark_1` $\rightarrow$ 11) to integer month numbers.
  - `calculateMaterialPrice(basePrice, materialId, regionId, monthName, stock?, capacity?)`: Primary Engine entrypoint for dynamic trade commodity pricing.
- `src/components/ActivePlay.tsx`: Updated trade submenu (`menuMode === 'trade'`) to dynamically compute regional market commodity prices and caravan trade returns using `calculateMaterialPrice()`.
- `package.json`: Updated `npm test` script to include `tests/domain/Commerce.test.ts` and `tests/integration/CommerceEngineIntegration.test.ts`.

---

## 3. Legacy Logic Preservation
- Mathematical formula preserved 100%:
  $$\text{FinalPrice} = \max\Big(0.1,\, \text{round}_{2}\big(\text{basePrice} \times (\text{demandMultiplier} + \text{seasonalModifier}) \times \text{saturationModifier}\big)\Big)$$
- Regional demand matrix (`REGIONAL_DEMAND_MODIFIERS`), winter grain scarcity (+50%), summer crop abundance (-20%), and market saturation bounds (0.4..1.1) preserved without alteration.

---

## 4. Time & Calendar Adapter
- **Adapter**: `getMonthNumberFromName(monthName)` translates target `CampaignState.worldLedger.currentDate.month` into month number 1..12.
- **Seasons**: Embedded `MONTH_SEASONS` array maps month numbers to `Inverno`, `Primavera`, `Verão`, and `Outono`.

---

## 5. Location Adapter
- Target regional names (`"Northern Snowlands"`, `"Nomad Steppe"`, `"Western Rivers"`, `"Eastern Forests"`, `"Central Plains"`, `"Southern Mountains"`) map 1-to-1 to `REGIONAL_DEMAND_MODIFIERS` demand keys.

---

## 6. Engine Integration
- **Engine Authority**: `calculateMaterialPrice()` in `src/engine.ts` owns the commercial pricing boundary.
- **State Mutability**: `MarketService` is 100% read-only and pure. `CampaignState` is never mutated during price queries.

---

## 7. Gameplay Integration
- In `ActivePlay.tsx`, launching supply caravans now queries `calculateMaterialPrice()` using the player's current region and current campaign month, dynamically calculating commodity local prices and trade returns.

---

## 8. Duplicate Logic Audit
- `git grep -n -i -E "calculatePrice|MarketService" -- src` returned **0 duplicate price calculation formulas**.

---

## 9. Determinism Audit
- `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- src/domain/commerce` returned **0 matches**.

---

## 10. Tests
- `tests/domain/Commerce.test.ts`: **PASSED (100%)**
- `tests/integration/CommerceEngineIntegration.test.ts`: **PASSED (100%)**
- `npm test`: **PASSED (100%)**

---

## 11. Build & Replay
- `npm run build`: **PASSED (0 errors)**
- `npx tsx src/tools/ReplayValidator.ts`: **PASSED (10/10 deterministic snapshots)**

---

## 12. Migration Matrix Update
- Status for `commerce` updated to `MIGRATED & INTEGRATED` in `docs/migration/MIGRATION_MATRIX.md`.
