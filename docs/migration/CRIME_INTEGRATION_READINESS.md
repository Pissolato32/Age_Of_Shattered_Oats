# Crime Integration Readiness

## 1. Executive Summary
This document evaluates the readiness of the legacy `crime` domain (`legacy/main:src/domain/crime/`) for migration into `Age_Of_Shattered_Oats`.

---

## 2. Legacy Inventory (`src/domain/crime/`)

| File | Architectural Layer | Purpose | Target Classification |
|---|---|---|---|
| **`EscapeCatalogService.ts`** | INFRASTRUCTURE | Disk reader (`fs.readFileSync`) loading `simulation_tables.json` escape & captivity tables | **E — REJECTED INFRASTRUCTURE** |
| **`queries/GetEscapeDifficultyQuery.ts`** | APPLICATION / QUERY | Wrapper query invoking `EscapeCatalogService.getDifficultySpec()` | **E — REJECTED INFRASTRUCTURE** |
| **`commands/ImprisonCharacterCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite command setting `character.healthStatus = 'Imprisoned'` | **E — REJECTED INFRASTRUCTURE** |
| **`commands/RansomNegotiationCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite command deducting SD treasury to free an imprisoned character | **E — REJECTED INFRASTRUCTURE** |
| **`commands/AttemptEscapeCommand.ts`** | APPLICATION / CQRS | EventStore / SQLite command resolving escape rolls and modifying `escapeDcModifier` | **E — REJECTED INFRASTRUCTURE** |

---

## 3. Canonical Rules
- **Rule References**: `@rule imprisonment.escape` (from `legacy/main:docs/01_Knowledge/rules_tables/simulation_tables.yaml`).
- **Escape Difficulty Tables**:
  - `unwatched_camp`: 1d6 roll, success range [5, 6], +1 modifier for familiar terrain.
  - `guarded_camp`: 1d6 roll, success range [6], -1 modifier if chained.
  - `wooden_cage`: 1d6 roll, success range [6], requires outside help or tool + 3 days.
  - `iron_cage`: 0d6 roll, 0% escape chance alone (invariant: `BoundCharactersCannotEscapeAlone`).
  - `dungeon_cell`: 1d6 roll, success range [6], requires inside help or bribery.
  - `bound_gagged_blindfolded`: 0d6 roll, 0% escape chance.

---

## 4. Ransom Analysis
- **Audit Result**: In legacy code (`RansomNegotiationCommand.ts`), there is **no mathematical formula** calculating ransom pricing. The ransom cost is passed as an external parameter `ransomCostSd: number`, and the command simply validates `holding.treasurySd >= ransomCostSd`, deducts SD, and sets `healthStatus = 'Healthy'`.
- **Finding**: Ransom calculation is NOT a pure domain service in legacy; it is an imperative CQRS command with database persistence.

---

## 5. Escape Difficulty Analysis
- `AttemptEscapeCommand.ts` enforces the invariant `BoundCharactersCannotEscapeAlone` (iron cage / bound characters cannot escape without outside help).
- The modified roll formula:
  $$\text{ModifiedRoll} = \text{BaseRoll} + (\text{familiarTerrain} ? 1 : 0) - (\text{chained} ? 1 : 0) - \text{escapeDcModifier}$$
- **Resolution**: Requires 1d6 PRNG roll and state mutation on `character.stateJson.captivity.escapeDcModifier` (fails increment penalty by +1).

---

## 6. Catalog Analysis
- `EscapeCatalogService` depends synchronously on `fs.readFileSync(path.join(process.cwd(), 'docs/compiled/simulation_tables.json'))`.
- **Target Duplication**: 0 escape difficulty catalogs exist in target `src/data.ts`.
- **Classification**: **REJECTED INFRASTRUCTURE** (Disk File I/O).

---

## 7. CQRS Analysis
- All 3 commands (`ImprisonCharacterCommand`, `RansomNegotiationCommand`, `AttemptEscapeCommand`) and 1 query (`GetEscapeDifficultyQuery`) rely directly on `ICharacterRepository`, `IHoldingRepository`, `IEventStore`, and `randomUUID()`.
- **Classification**: **REJECTED INFRASTRUCTURE**.

---

## 8. Target Duplication Audit
- `git grep -n -i -E "ransom|prison|prisoner|captivity|hostage" -- src` returned **0 matches** in target `src/`.
- Zero duplicate formulas or state structures exist in target.

---

## 9. CampaignState Compatibility & Data Gaps
- **MISSING TARGET DATA**:
  - `src/types.ts` does **NOT** track `healthStatus` (`'Healthy'` | `'Imprisoned'`).
  - `src/types.ts` does **NOT** track `captivity` parameters (`cageType`, `chained`, `escapeDcModifier`).
  - `CampaignState` does **NOT** track holding dungeons or prisoner lists.

---

## 10. Gameplay Consumers Audit
- **UI Consumers (`ActivePlay.tsx`)**: **0 consumers**. Zero UI components, submenus, or modals exist for captivity, ransom negotiation, or prison escape attempts.
- **Engine Consumers (`src/engine.ts`)**: **0 consumers**. Zero turn resolution or campaign event logic invokes prison mechanics.

---

## 11. Determinism Audit
- Legacy `AttemptEscapeCommand` invokes `RandomService` PRNG for 1d6 escape rolls and `Date.now()` for seed fallback.
- Domain calculation of modifiers is pure, but resolution is stochastic.

---

## 12. Cross-Domain Coupling
- Imprisonment would couple `character` (health status), `holdings` (dungeon/treasury), and `relationship` (reputation loss / grudge on humiliation).

---

## 13. Documentation Compliance
- Canonical tables are documented in `legacy/main:docs/01_Knowledge/rules_tables/simulation_tables.yaml`.

---

## 14. Candidate vs. Rejected Components

| Component | Legacy File | Target Status | Reason |
|---|---|---|---|
| **`EscapeCatalogService`** | `EscapeCatalogService.ts` | **REJECT** | Synchronous disk File I/O (`fs.readFileSync`) |
| **`GetEscapeDifficultyQuery`** | `queries/GetEscapeDifficultyQuery.ts` | **REJECT** | CQRS query wrapper |
| **`ImprisonCharacterCommand`** | `commands/ImprisonCharacterCommand.ts` | **REJECT** | CQRS / EventStore / SQLite |
| **`RansomNegotiationCommand`** | `commands/RansomNegotiationCommand.ts` | **REJECT** | CQRS / EventStore / SQLite |
| **`AttemptEscapeCommand`** | `commands/AttemptEscapeCommand.ts` | **REJECT** | CQRS / EventStore / SQLite |

---

## 15. Risk Assessment
- **High Risk of Orphaned Code**: Migrating `crime` right now would introduce domain models that have **zero consumers** in `src/engine.ts` or `src/components/ActivePlay.tsx`, violating the core architectural directive (*"Não adicionar um domínio apenas porque encontramos código migrável; adicioná-lo somente se ele preencher uma lacuna real"*).

---

## 16. Final Readiness Verdict
**STATUS: REJECT / DEFER**

### Justification:
1. **No Pure Domain Formula for Ransom**: Ransom is an imperative CQRS command in legacy with no mathematical pricing formula.
2. **Missing Target Data**: `CampaignState` lacks prisoner and captivity state slices.
3. **No Target Gameplay Consumers**: Zero callers exist in `ActivePlay.tsx` or `src/engine.ts`.
4. **Architectural Discipline**: Avoid creating unconsumed abstractions in target `src/domain/`.
