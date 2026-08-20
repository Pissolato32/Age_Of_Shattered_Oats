# Items Migration Report (CombatStatsCalculator)

## 1. Files Migrated
- `src/domain/items/CombatStatsCalculator.ts` (Selective extraction of derived combat stats calculator from `legacy/main:src/domain/items/CombatStatsCalculator.ts`).

---

## 2. Files Adapted
- `src/data.ts`: Added canonical static item catalog constants (`ARMOR_SPECS`, `SHIELD_SPECS`, `MOUNT_SPECS`) and interface definitions (`ArmorItemSpec`, `ShieldItemSpec`, `MountItemSpec`).
- `src/types.ts`: Added `baseInitiative?: number`, `armor?: string`, `mountInjured?: boolean`, `mountInitiativeMod?: number` to `Character.stats`.
- `src/engine.ts`: Added Engine boundary facades:
  - `calculateCharacterCombatStats(character)`: Primary entrypoint for derived AC and Initiative queries.
  - `recalculateCharacterStats(state)`: Updates `state.character.stats.ac` and `state.character.stats.initiativeBonus` dynamically from equipment.
- `package.json`: Updated `npm test` script to include `tests/domain/CombatStatsCalculator.test.ts` and `tests/integration/CombatStatsEngineIntegration.test.ts`.

---

## 3. Deliberately Omitted / Rejected Legacy Infrastructure
- **`ItemCatalogService.ts`**: Rejected (Synchronous `fs.readFileSync` disk file I/O loading `armor.json`, `shields.json`, etc.).
- **Legacy CQRS Commands** (`EquipArmorCommand.ts`, `EquipWeaponCommand.ts`, `EquipShieldCommand.ts`, `AddMaterialToHoldingCommand.ts`): Rejected (Acquired to legacy SQLite `ICharacterRepository`, `IEventStore`, `randomUUID()`).

---

## 4. Preserved Canonical Formulas
- **Armor Class (AC)**:
  $$\text{AC} = \text{baseAC} + \text{shieldACMod}$$
  - Unarmored / Cloth: `baseAC` = 2
  - Leather: `baseAC` = 3
  - Chain: `baseAC` = 4
  - Plate: `baseAC` = 5
  - Shield: `shieldACMod` = +1 (standard, heater, tower)
- **Initiative**:
  $$\text{Initiative} = \text{baseInitiative} + \text{armorMod} + \text{shieldMod} + \text{mountMod} - \text{mountInjuryPenalty}$$
  - Cloth / Unarmored: `armorMod` = +1 (agility bonus)
  - Leather: 0 | Chain: -1 | Plate: -2
  - Standard/Heater Shield: 0 | Tower Shield: -1
  - Riding Horse / Courser: +1 to +2 | Warhorse: +2 | Draft Warhorse: 0
  - Mount Injured: -1 penalty when `mountInjured === true`

---

## 5. Canonical Data Catalog Location
- `src/data.ts` serves as the single source of truth for canonical item specs (`ARMOR_SPECS`, `SHIELD_SPECS`, `MOUNT_SPECS`). `CombatStatsCalculator` consumes these specs without duplicating definitions.

---

## 6. Engine Integration & Single Source of Truth
- `src/engine.ts` owns the `calculateCharacterCombatStats()` facade.
- `recalculateCharacterStats(state)` derives `state.character.stats.ac` and `state.character.stats.initiativeBonus` directly on the authoritative `CampaignState` object. 0 parallel state, 0 secondary stores.

---

## 7. Duplicate Logic Audit
- `git grep -n -i -E "calculateAC|calculateInitiative|CombatStatsCalculator" -- src` returned **0 duplicate calculation formulas**.

---

## 8. Determinism Audit
- `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- src/domain/items` returned **0 matches**.

---

## 9. Tests
- `tests/domain/CombatStatsCalculator.test.ts`: **PASSED (100%)**
- `tests/integration/CombatStatsEngineIntegration.test.ts`: **PASSED (100%)**
- `npm test`: **PASSED (100%)**

---

## 10. Build & Replay
- `npm run build`: **PASSED (0 errors)**
- `npx tsx src/tools/ReplayValidator.ts`: **PASSED (10/10 deterministic snapshots)**

---

## 11. Migration Matrix Update
- Status for `items` updated to `MIGRATED & INTEGRATED` in `docs/migration/MIGRATION_MATRIX.md`.
