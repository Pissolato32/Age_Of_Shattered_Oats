# Items Integration Readiness (CombatStatsCalculator)

## 1. Executive Summary
This document is the readiness audit for integrating derived combat stats calculation (`CombatStatsCalculator.ts`) from `legacy/main:src/domain/items/` into `Age_Of_Shattered_Oats`.

---

## 2. Legacy Inventory (`src/domain/items/`)

| File | Architectural Layer | Purpose | Target Status |
|---|---|---|---|
| **`CombatStatsCalculator.ts`** | DOMAIN SERVICE | Derived calculation of Armor Class (AC) and Initiative based on character equipment | **MIGRATE & ADAPT** (Selective Extraction) |
| **`ItemCatalogService.ts`** | INFRASTRUCTURE | Synchronous disk I/O (`fs.readFileSync`) loading JSON compiled catalogs (`armor.json`, `shields.json`, etc.) | **REJECT** (Legacy File I/O) |
| **`EquipArmorCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite character armor equipment handler | **REJECT** (Legacy CQRS / Database) |
| **`EquipShieldCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite character shield equipment handler | **REJECT** (Legacy CQRS / Database) |
| **`EquipWeaponCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite character weapon equipment handler | **REJECT** (Legacy CQRS / Database) |
| **`AddMaterialToHoldingCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite material inventory handler | **REJECT** (Legacy CQRS / Database) |

---

## 3. CombatStatsCalculator Deep Analysis

### Functions & Mathematical Rules

1. **`calculateAC(char, catalog)`**:
   $$\text{AC} = \text{baseAC} + \text{shieldACMod}$$
   - Default `baseAC` = 2 (Cloth / Unarmored).
   - If armor equipped: `baseAC = armorSpec.armor_class`
     - `cloth`: 2
     - `leather`: 3
     - `chain`: 4
     - `plate`: 5
   - If shield equipped: `shieldACMod = shieldSpec.armor_class_mod` (+1 for all standard/heater/tower shields).

2. **`calculateInitiative(char, catalog, mountCatalog?)`**:
   $$\text{Initiative} = \text{baseInitiative} + \text{armorMod} + \text{shieldMod} + \text{mountMod} - \text{mountInjuryPenalty}$$
   - Default `baseInitiative` = 0.
   - Armor Initiative Modifiers:
     - `cloth` / None: +1 (Unarmored agility bonus)
     - `leather`: 0
     - `chain`: -1
     - `plate`: -2
   - Shield Initiative Modifiers:
     - `standard_shield`: 0
     - `heater_shield`: 0
     - `tower_shield`: -1
   - Mount Initiative Modifiers:
     - `courser` / Riding Horse: +1 to +2
     - `warhorse`: +2
     - `draft_warhorse`: 0
   - Mount Injury Penalty: -1 Initiative if `mountInjured === true`.

---

## 4. Dependency Audit
- **Direct Dependencies in Legacy**:
  - `Character` (Legacy domain model)
  - `ItemCatalogService` (Disk JSON file reader)
  - `MountCatalogService` (Disk JSON mount reader)
- **Engine / Storage Side Effects**: 0 DB calls, 0 File I/O, 0 EventStore/SnapshotStore, 0 RNG, 0 Clock.
- **Decoupling Requirement**: Replace `ItemCatalogService` and `MountCatalogService` parameter objects with static embedded item lookup dictionaries (`ARMOR_SPECS`, `SHIELD_SPECS`, `MOUNT_SPECS`).

---

## 5. Target Duplication Audit
- In target `src/types.ts`, `Character.stats` has properties:
  - `ac: number`
  - `initiativeBonus: number`
  - `armor: string`
  - `shield: string`
  - `mount: string`
  - `mountInjured?: boolean`
- In target `src/engine.ts`, `ac` and `initiativeBonus` are currently initialized statically (`ac = 4`, `initiativeBonus = 1`).
- **0 duplicate dynamic AC or Initiative calculation formulas exist in target `src/`**.

---

## 6. Legacy Documentation Audit
- Canonical item rules are documented in:
  - `legacy/main:docs/01_Knowledge/items/armor.yaml`
  - `legacy/main:docs/01_Knowledge/items/shields.yaml`
  - `legacy/main:docs/01_Knowledge/military_naval/mounts.yaml`
- Embedded specifications in target will adhere 100% to these canonical rules.

---

## 7. Determinism Audit
- `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- legacy/main/src/domain/items/CombatStatsCalculator.ts` returned **0 matches**.
- 100% deterministic pure calculation service.

---

## 8. Test Coverage Audit
Legacy unit tests in `legacy/main:tests/domain/ItemsDomain.test.ts` and `tests/domain/MountsDomain.test.ts` establish canonical test assertions:
- Unarmored baseline: AC 2, Initiative +1
- Plate armor: AC 5, Initiative -2
- Plate + Tower Shield: AC 6, Initiative -3
- Plate + Tower Shield + Courser (+2 init): AC 6, Initiative -1
- Plate + Tower Shield + Injured Courser (-1 penalty): AC 6, Initiative -2

---

## 9. Selective Extraction Candidates
- **MIGRATE**: `CombatStatsCalculator.ts` (Selective extraction).
- **REJECT**: `ItemCatalogService.ts` and legacy CQRS Equip commands.

---

## 10. Recommended Engine Boundary
Add helper functions to `src/engine.ts`:
```ts
export function calculateCharacterCombatStats(character: Character): { ac: number; initiativeBonus: number } {
  const calc = new CombatStatsCalculator();
  return calc.calculateStats(character);
}

export function updateCharacterEquipment(state: CampaignState, equipmentUpdates: Partial<Character['stats']>): void {
  // Update character equipment slots and recalculate derived AC and Initiative in state
}
```

---

## 11. Reuse Classification
**B — MINIMAL ADAPTATION**  
(Pure calculation logic extracted; catalog dependency replaced with pure embedded static specs).

---

## 12. Risk & Gameplay Value
- **Risk**: **LOW** (Pure calculation helper).
- **Gameplay Value**: **HIGH** (Player armor, shield, and mount equipment upgrades dynamically update character AC and Initiative stats).

---

## 13. Known Limitations
- None. Static item specs represent canonical rule definitions.

---

## 14. Migration Readiness
**STATUS: ITEMS INTEGRATION: READY WITH CONDITIONS**

**Condition**:
`CombatStatsCalculator` must be decoupled from legacy `ItemCatalogService` disk file I/O by embedding static item specs in TypeScript data constants.

---

## 15. Exact Implementation Plan
*(To be executed only upon explicit user approval)*:
1. Copy and adapt `CombatStatsCalculator.ts` to `src/domain/items/CombatStatsCalculator.ts` with static item specs embedded.
2. Create unit test `tests/domain/Items.test.ts`.
3. Add `calculateCharacterCombatStats()` helper to `src/engine.ts`.
4. Create integration test `tests/integration/ItemsEngineIntegration.test.ts`.
5. Update `package.json` test script.
6. Run `npm test`, `npm run build`, and `ReplayValidator`.
7. Create `ITEMS_MIGRATION_REPORT.md` in `docs/migration/`.
8. Update `MIGRATION_MATRIX.md`.
9. Commit to `integration/legacy-consolidation`.
