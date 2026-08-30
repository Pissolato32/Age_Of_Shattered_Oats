# Post-7-Domain Architecture Audit

## 1. Executive Summary
This audit evaluates the architectural health, single source of truth integrity, domain purity, component coupling, and test coverage of `Age_Of_Shattered_Oats` following the successful consolidation of 7 core domain models (`character`, `relationship`, `npc_ai`, `visibility`, `commerce`, `items`, `kingdom/succession`).

---

## 2. Current Architecture Overview
- **Branch**: `integration/legacy-consolidation` (Commit `830d319`).
- **Consolidated Domains (7)**:
  1. `character`: State initialization, stats, archetype setup (`src/domain/character/Character.ts`).
  2. `relationship`: Faction opinion modifiers and memory log decay (`src/domain/relationship/`).
  3. `npc_ai`: NPC commander combat tactic selection (`src/domain/npc_ai/CommanderAIService.ts`).
  4. `visibility`: Fog-of-war and spatial propagation delays (`src/domain/visibility/VisibilityService.ts`).
  5. `commerce`: Dynamic regional and seasonal market pricing (`src/domain/commerce/services/MarketService.ts`).
  6. `items`: Derived Armor Class (AC) and Initiative bonus calculations (`src/domain/items/CombatStatsCalculator.ts`).
  7. `kingdom/succession`: Primogeniture hierarchy sorting for dynastic succession (`src/domain/kingdom/services/SuccessionService.ts`).
- **Pre-existing Target Domain**: `adventure` (`src/domain/adventure/AdventureEngine.ts`).
- **Architecture Golden Rule**: `GAME ENGINE = SINGLE SOURCE OF TRUTH` (0 SQLite/EventStore in target; pure domain services, single authoritative `CampaignState`).

---

## 3. Conceptual Domain Dependency Graph

```
                            ┌────────────────────────┐
                            │  ActivePlay.tsx (UI)   │
                            └───────────┬────────────┘
                                        │ (Dispatch Only)
                                        ▼
                            ┌────────────────────────┐
                            │    src/engine.ts       │
                            │  (Single Facade API)   │
                            └───────────┬────────────┘
                                        │
           ┌──────────────┬─────────────┼─────────────┬──────────────┬──────────────┐
           ▼              ▼             ▼             ▼              ▼              ▼
     ┌───────────┐  ┌───────────┐ ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐
     │Character  │  │Relationship│ │ NPC AI    │ │Visibility │  │ Commerce  │  │   Items   │
     └─────┬─────┘  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
           │              │             │             │              │              │
           └──────────────┴─────────────┼─────────────┴──────────────┴──────────────┘
                                        ▼
                            ┌────────────────────────┐
                            │    src/data.ts         │
                            │ (Static Item Catalogs) │
                            └────────────────────────┘
```

---

## 4. Single Source of Truth Audit

| Rule Domain | Canonical Source | Engine Facade | UI Consumer (`ActivePlay.tsx`) | Status |
|---|---|---|---|---|
| **Character Stats & AC** | `CombatStatsCalculator.ts` | `calculateCharacterCombatStats()` | Read-only render | **CANONICAL** |
| **Faction Opinion** | `Relationship.ts` | `adjustHouseOpinion()` / `setHouseOpinion()` | Read-only render | **CANONICAL** |
| **NPC Combat Tactics** | `CommanderAIService.ts` | `resolveNpcCombatAction()` | Read-only render | **CANONICAL** |
| **Fog-of-War Secrets** | `VisibilityService.ts` | `getVisibleWorldSecrets()` | Read-only render | **CANONICAL** |
| **Market Commodity Prices**| `MarketService.ts` | `calculateMaterialPrice()` | Read-only render | **CANONICAL** |
| **Dynastic Succession** | `SuccessionService.ts` | `resolveDynasticSuccession()` | Read-only render | **CANONICAL** |

- **Audit Result**: **0 DUPLICATE or SUSPICIOUS logic implementations** found in `ActivePlay.tsx`. All 7 domain calculations route strictly through exported `src/engine.ts` facade functions.

---

## 5. Engine Health (`src/engine.ts`)
- **Current File Metrics**: 1,298 lines, 24 exported functions.
- **Architectural Golden Rule**: 100% preserved. `engine.ts` remains the single public API facade for all domain operations.
- **Risk Assessment**: Low to Moderate. While line count is manageable (1,298 lines), utility translation functions (`getMonthNumberFromName`, `getAbsoluteCampaignTurn`, `normalizeLocationToHub`) are grouped at the top.
- **Recommendation**: **(B) Maintain `engine.ts` as the single public API facade**. If file size exceeds 1,500 lines in future sprints, organize internal helper adapters into sub-modules (`src/engine/adapters/`) without changing exported function signatures.

---

## 6. ActivePlay Health (`src/components/ActivePlay.tsx`)
- **Current File Metrics**: 2,882 lines.
- **Audit Findings**:
  - The UI component operates strictly as a presentation and user intent dispatch layer.
  - The naive array index succession selection (`children[0]`) in `handleAbdicateOrDie` was successfully replaced with `resolveDynasticSuccession(s, mode)`.
  - Zero direct mechanical rule calculations exist in `ActivePlay.tsx`.

---

## 7. Domain Purity Audit

| Domain Folder | RNG | Clock / Date | File I/O | Database / SQLite | Side Effects | Status |
|---|---|---|---|---|---|---|
| `src/domain/character` | 0 | 0 | 0 | 0 | None | **PURE** |
| `src/domain/relationship` | 0 | 0 | 0 | 0 | None | **PURE** |
| `src/domain/npc_ai` | 0 | 0 | 0 | 0 | None | **PURE** |
| `src/domain/visibility` | 0 | 0 | 0 | 0 | None | **PURE** |
| `src/domain/commerce` | 0 | 0 | 0 | 0 | None | **PURE** |
| `src/domain/items` | 0 | 0 | 0 | 0 | None | **PURE** |
| `src/domain/kingdom` | 0 | 0 | 0 | 0 | None | **PURE** |

- **Verification Command**: `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- src/domain/character src/domain/relationship src/domain/npc_ai src/domain/visibility src/domain/commerce src/domain/items src/domain/kingdom` returned **0 violations**.

---

## 8. Cross-Domain Coupling Assessment
- **`character` $\leftrightarrow$ `items`**: **LOW**. `CombatStatsCalculator` accepts a generic character stats duck-type interface `{ stats: Partial<Character['stats']> }`.
- **`kingdom/succession` $\leftrightarrow$ `character`**: **LOW**. `SuccessionService` accepts a generic `Relative[]` array. Engine maps `FamilyChild` $\rightarrow$ `Relative` seamlessly.
- **`commerce` $\leftrightarrow$ `calendar`**: **LOW**. `MarketService` takes a month number (`1..12`). `engine.ts` converts month names to numbers via `getMonthNumberFromName()`.

---

## 9. CampaignState Audit (`src/types.ts`)
- `CampaignState` is the single authoritative state container.
- Derived properties (`character.stats.ac`, `character.stats.initiativeBonus`) are recalculated directly on `CampaignState` via `recalculateCharacterStats(state)`.
- No parallel state stores exist.

---

## 10. Data Catalog Audit (`src/data.ts`)
- `ARMOR_SPECS`, `SHIELD_SPECS`, `MOUNT_SPECS` in `src/data.ts` serve as the single source of truth for item stats.
- `CombatStatsCalculator` consumes these specs without duplicating definitions.

---

## 11. Determinism Audit
- **RNG Scan**: Zero `Math.random()` calls in `src/`. All RNG uses `globalRNG` (deterministic PRNG).
- **Build**: `npm run build` passed with **0 errors**.
- **Replay Validator**: `npx tsx src/tools/ReplayValidator.ts` passed **10/10 snapshots deterministically**.

---

## 12. Legacy Compliance
- Canonical rules from `legacy/main:docs/01_Knowledge/politics/succession.yaml`, `items/armor.yaml`, `items/shields.yaml` are preserved with 100% mathematical and logical fidelity.

---

## 13. Documentation Health
- All migration audit documents are contained within `docs/migration/`.
- Zero root-level temporary markdown files exist.
- Permanent blueprints remain in `docs/architecture/`, `docs/design/`, `docs/testing/`.

---

## 14. Test Architecture
- **Unit Tests**: 100% passing (`RelationshipAndMemory.test.ts`, `NpcAi.test.ts`, `Visibility.test.ts`, `Commerce.test.ts`, `CombatStatsCalculator.test.ts`, `SuccessionService.test.ts`).
- **Integration Tests**: 100% passing (`RelationshipEngineIntegration.test.ts`, `NpcAiEngineIntegration.test.ts`, `VisibilityEngineIntegration.test.ts`, `CommerceEngineIntegration.test.ts`, `CombatStatsEngineIntegration.test.ts`, `SuccessionEngineIntegration.test.ts`).
- **Regression Suite**: `GoldenScenarios.test.ts` (6/6 canonical scenarios approved).

---

## 15. Migration Matrix Validation
- [docs/migration/MIGRATION_MATRIX.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MIGRATION_MATRIX.md) accurately reflects all 7 consolidated domains as `MIGRATED & INTEGRATED`.

---

## 16. Remaining Architectural Risks
- **Engine Size Growth**: `src/engine.ts` at 1,298 lines is getting close to the 1,500-line threshold. Extraction of internal adapters into `src/engine/adapters/` should be planned if next domain additions push it past 1,500 lines.

---

## 17. Recommended Refactorings
- None required immediately before selecting the 8th domain.
- Keep helper adapters organized as clean static functions in `src/engine.ts`.

---

## 18. Recommended Next Domain Candidate
- **Candidate**: **`crime` (Pure Ransom & Escape Calculator)**.
- **Rationale**: Extracted pure formulas for prisoner ransom pricing and escape DC thresholds without loading `EscapeCatalogService` disk readers or EventStore CQRS handlers.

---

## 19. Final Architectural Verdict
**RECOMMENDATION: SAFE TO SELECT EIGHTH DOMAIN**
