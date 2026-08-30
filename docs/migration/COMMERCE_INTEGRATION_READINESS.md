# Commerce Integration Readiness

## 1. Legacy Service
- **Source File**: `legacy/main:src/domain/commerce/services/MarketService.ts`
- **Class**: `MarketService`
- **Architectural Role**: Pure domain service calculating trade commodity prices, regional demand multipliers, seasonal modifiers, and market saturation penalties.

---

## 2. Legacy Formula
`MarketService.calculatePrice(basePrice, materialId, regionId, monthNumber, stock = 0, marketCapacity = 150)`:

$$\text{FinalPrice} = \max\Big(0.1,\, \text{round}_{2}\big(\text{basePrice} \times (\text{demandMultiplier} + \text{seasonalModifier}) \times \text{saturationModifier}\big)\Big)$$

1. **Regional Demand Multiplier**:
   - `cleanRegionId = regionId.toLowerCase().replace(/\s+/g, '_')`
   - `demandMultiplier = 1 + (REGIONAL_DEMAND_MODIFIERS[cleanRegionId][materialId] || 0)`
   - *Examples*:
     - Grain in `southern_mountains`: demand mod = +1.5 $\rightarrow$ multiplier = 2.5
     - Iron in `southern_mountains`: demand mod = -0.2 $\rightarrow$ multiplier = 0.8
     - Timber in `nomad_steppe`: demand mod = +1.0 $\rightarrow$ multiplier = 2.0
2. **Seasonal Modifier**:
   - Month 1..12 maps to `MONTH_SEASONS` (`Inverno`, `Primavera`, `Verão`, `Outono`).
   - Winter (`Inverno`): `grain`, `fish`, `vegetables` $\rightarrow +0.50$ (winter scarcity); `furs`, `wool` $\rightarrow +0.25$ (winter demand).
   - Spring/Summer (`Primavera`/`Verão`): `grain`, `fish`, `vegetables` $\rightarrow -0.20$ (crop abundance).
3. **Saturation Modifier**:
   - `ratio = stock / marketCapacity`
   - `ratio <= 0.25` $\rightarrow 1.1$ (Scarcity bonus)
   - `ratio <= 0.50` $\rightarrow 1.0$ (Normal)
   - `ratio <= 0.75` $\rightarrow 0.8$ (Mild glut)
   - `ratio <= 1.00` $\rightarrow 0.6$ (Heavy glut)
   - `ratio > 1.00` $\rightarrow 0.4$ (Market overflow)

---

## 3. Target Commerce Architecture
- `CampaignState` in `src/engine.ts` owns all financial parameters (`s.character.silverdew`, `s.weeklyLedger.incomeDetail.trade`).
- Single Source of Truth: `src/engine.ts` will host the `calculateMaterialPrice()` query helper. `MarketService` remains 100% read-only and pure.

---

## 4. Material Compatibility
Target trade commodities match legacy material IDs:
- `grain` (Food / FSU)
- `timber` (Construction Timber)
- `iron` (Ore & Metals)
- `herbs` / `medicine` (Sacred Herbs / Healing)
- `stone` (Building Stone)
- `weapons` (Military Arms)
- `horses` (Cavalry Mounts)
- `furs` (Warm Furs)

---

## 5. Region Compatibility
Target regional names map 1-to-1 to `REGIONAL_DEMAND_MODIFIERS`:
- `"Northern Snowlands"` $\rightarrow$ `northern_snowlands`
- `"Nomad Steppe"` $\rightarrow$ `nomad_steppe_north` / `nomad_steppe`
- `"Western Rivers"` $\rightarrow$ `western_rivers_north` / `western_rivers`
- `"Eastern Forests"` $\rightarrow$ `eastern_forests_north` / `eastern_forests`
- `"Central Plains"` $\rightarrow$ `central_plains`
- `"Southern Mountains"` $\rightarrow$ `southern_mountains`

---

## 6. Calendar Compatibility
Target `CampaignState.worldLedger.currentDate.month` string (`Frostwane`, `Deepfrost`, `Longdark`, `Thawrise`, `Greening`, `Highsun`, `Harvestfall`, `Ashfall`) maps to month numbers 1..12:
- `Frostwane` $\rightarrow$ Month 1 (`Inverno`)
- `Deepfrost` $\rightarrow$ Month 2 (`Inverno`)
- `Longdark` $\rightarrow$ Month 3 (`Inverno`)
- `Thawrise` $\rightarrow$ Month 4 (`Primavera`)
- `Greening` $\rightarrow$ Month 5 (`Primavera`)
- `Highsun` $\rightarrow$ Month 6 (`Verão`)
- `Harvestfall` $\rightarrow$ Month 8 (`Outono`)
- `Ashfall` $\rightarrow$ Month 10 (`Outono`)

To keep `MarketService.ts` completely decoupled from legacy `TimeService.ts`, the static `MONTH_SEASONS` array will be embedded directly in `MarketService.ts`.

---

## 7. Stock / Market Capacity
> [!NOTE]
> Market saturation currently has no authoritative `CampaignState` persistent city stock slice.
> **Condition**: Default parameters (`stock = 0`, `marketCapacity = 150`) will be passed by default (yielding `saturationModifier = 1.1` scarcity bonus for fresh market trips), preserving deterministic pure calculation without creating parallel state.

---

## 8. Existing Target Commerce Flow
In `src/components/ActivePlay.tsx`:
Caravan trades currently use fixed trade rewards (`handleLaunchCaravan`). `calculateMaterialPrice()` will provide dynamic material prices to evaluate trade returns.

---

## 9. Duplicate Logic Audit
- `git grep -n -i -E "calculatePrice|MarketService|regionalDemands" -- src` returned **0 duplicate implementations**. `MarketService` is the unique owner.

---

## 10. Proposed Engine Boundary
Add to `src/engine.ts`:
```ts
export function calculateMaterialPrice(
  basePrice: number,
  materialId: string,
  regionId: string,
  monthName: string,
  stock = 0,
  marketCapacity = 150
): MarketPriceResult {
  const service = new MarketService();
  const monthNumber = getMonthNumberFromName(monthName);
  return service.calculatePrice(basePrice, materialId, regionId, monthNumber, stock, marketCapacity);
}
```

---

## 11. Test Strategy
1. **Unit Test**: `tests/domain/Commerce.test.ts` (Validates regional demand multipliers, winter grain scarcity +50%, summer crop abundance -20%, saturation bounds 0.4..1.1, minimum price floor 0.1 SD).
2. **Integration Test**: `tests/integration/CommerceEngineIntegration.test.ts` (Validates Engine boundary `calculateMaterialPrice()` with target `CampaignState` region and month name inputs).

---

## 12. Determinism Audit
- `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- legacy/main/src/domain/commerce` returned **0 matches**.
- 100% deterministic mathematical price calculator.

---

## 13. Reuse Classification
**B — MINIMAL ADAPTATION**  
(Preserves original class and formula; embeds `MONTH_SEASONS` array directly in `MarketService.ts` to remove external dependency on `TimeService.ts`).

---

## 14. Risks
- **LOW RISK**: Pure read-only price calculation service. 0 state mutation, 0 side effects.

---

## 15. Gameplay Impact
Resource purchases and trade caravan returns will dynamically reflect regional demand (e.g. grain costs 150% more in southern mountains) and seasonal scarcity (e.g. food costs 50% more in winter).

---

## 16. Migration Readiness
**STATUS: READY WITH CONDITIONS**

**Condition**:
Default `stock = 0` and `marketCapacity = 150` parameters will be passed until an authoritative city stock slice is added to `CampaignState`.

---

## 17. Exact Implementation Plan
*(To be executed only upon explicit user approval)*:
1. Copy `legacy/main:src/domain/commerce/services/MarketService.ts` to `src/domain/commerce/services/MarketService.ts` (embed `MONTH_SEASONS` array inline).
2. Create unit test `tests/domain/Commerce.test.ts`.
3. Add `calculateMaterialPrice()` helper and month-name mapper to `src/engine.ts`.
4. Create integration test `tests/integration/CommerceEngineIntegration.test.ts`.
5. Update `package.json` test script.
6. Run `npm test`, `npm run build`, and `ReplayValidator`.
7. Create `COMMERCE_MIGRATION_REPORT.md` in `docs/migration/`.
8. Commit to `integration/legacy-consolidation`.
