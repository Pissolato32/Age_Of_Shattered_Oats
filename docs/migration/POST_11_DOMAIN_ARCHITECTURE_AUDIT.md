# Post-11-Domain Architecture Audit & Remaining Domain Triage

## 1. Repository State

- **Branch**: `integration/legacy-consolidation`
- **Current HEAD Commit**: `4ac85c7` (`feat: integrate military breeding domain into engine`)
- **Remote Synchronization**: Fully synchronized with `origin/integration/legacy-consolidation`.
- **Working Tree Status**: Clean (`.agent/` untracked directory).
- **Target `src/domain/` Consolidated Inventory**:
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
  11. `military/services/BreedingService.ts`
  12. `adventure/AdventureEngine.ts` (Pre-existing target domain)

---

## 2. Consolidated 11 Domains Matrix & Consumption Status

| Domain | Target Path | Engine Facade Entrypoint | Purity | Target Consumption Status |
|---|---|---|---|---|
| **`character`** | `src/domain/character/Character.ts` | `createCharacter()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`relationship`** | `src/domain/relationship/Relationship.ts` | `setHouseOpinion()` / `recordVow()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`npc_ai`** | `src/domain/npc_ai/CommanderAIService.ts` | `selectCommanderTactic()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`visibility`** | `src/domain/visibility/VisibilityService.ts` | `calculateEventVisibility()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`commerce`** | `src/domain/commerce/services/MarketService.ts` | `calculateMaterialPrice()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`items`** | `src/domain/items/CombatStatsCalculator.ts` | `calculateCharacterCombatStats()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`kingdom/succession`** | `src/domain/kingdom/services/SuccessionService.ts` | `resolveDynasticSuccession()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`kingdom/production`** | `src/domain/kingdom/services/` | `calculateWeeklyProduction()` / `calculateFoodConsumption()` / `calculateLaborCapacity()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`kingdom/construction`** | `src/domain/kingdom/services/ConstructionService.ts` | `calculateConstructionRefund()` / `resolveResourcePatchQuality()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`military/payroll`** | `src/domain/military/services/PayrollService.ts` | `calculateMilitaryWages()` / `resolveTroopDesertion()` | 100% Pure | **ACTIVELY CONSUMED** |
| **`military/breeding`** | `src/domain/military/services/BreedingService.ts` | `calculateMountBreedingSuccessRate()` | 100% Pure | **CONSOLIDATED (Gameplay Flow Deferred)** |

---

## 3. Engine, CampaignState, and Presentation Health

- **`CampaignState` (`src/types.ts`)**:
  - Remains the single authoritative, mutable state container for the entire application.
  - Zero parallel mutable state stores or secondary database trees introduced.
- **Engine (`src/engine.ts`)**:
  - Remains a clean, public facade and deterministic orchestrator.
  - No mandatory line-count threshold splits enforced.
  - Orchestrates weekly turn resolution (`resolveWeeklyTurn`), weather rolling, production yield, troop consumption, and payroll outcomes.
- **Presentation (`ActivePlay.tsx`)**:
  - Functions as a pure presentation and intent-dispatching UI layer.
  - Zero mechanical rule calculations inside React components.

---

## 4. Determinism Audit

- **Scan Path**: `src/domain/`
- **Forbidden Dependencies Found**: **0** (`Math.random`, `Date.now`, `fs.*`, `sqlite`, `EventStore`, `SnapshotStore`).
- **Replay Validation**: `ReplayValidator.ts` verified 10/10 snapshots as 100% deterministic and sequential.

---

## 5. Exhaustive Legacy Inventory Triage

Every remaining component in `legacy/main:src/domain/` has been systematically evaluated:

| Legacy Component | Nature | Target Status / Verdict | Reason |
|---|---|---|---|
| **`military/services/MountService.ts`** | Pure domain service for post-combat horse death/injury rolls & recovery weeks | **RECOMMENDED NEXT DOMAIN** (B — Minimal Adaptation) | Completes mount equipment lifecycle math alongside `CombatStatsCalculator` and `BreedingService`. |
| **`core/TimeService.ts`** | 12-month / 360-day calendar translator | **REJECTED** | Conflicts with target's 8-month / 32-week calendar model in `src/engine.ts` and `src/data.ts`. |
| **`crime/`** | Escape & Ransom difficulty calculators | **DEFERRED — FUTURE FEATURE** | Target `CampaignState` currently lacks `captivity` / `imprisonment` state slices. |
| **`world/services/WeatherService.ts`** | Weather modifier calculator | **DUPLICATED / ALREADY COVERED** | Target `src/engine.ts` (`rollWeather()`) and `src/data.ts` already contain authoritative weather logic. |
| **`world/TravelService.ts`** | Movement travel day calculator | **DUPLICATED / ALREADY COVERED** | Target `src/engine.ts` (`calculateTravelDays()`) already contains travel speed logic. |
| **`character/ProfessionService.ts` & `NameCatalogService.ts`** | Character name & origin generators | **DUPLICATED / ALREADY COVERED** | Target `src/data.ts` and `createInitialState()` in `src/engine.ts` handle character specs. |
| **Catalog Services** (`ItemCatalogService`, `HoldingCatalogService`, `MountCatalogService`, `RetinueCatalogService`, `ShipCatalogService`) | Static data spec loaders | **DUPLICATED / ALREADY COVERED** | Target `src/data.ts` contains static specs (`MOUNT_SPECS`, `HOLDING_SPECS`, etc.). |
| **CQRS Commands & Queries** (`StartConstructionCommand`, `AssignMountCommand`, `WeeklyEconomyTickCommand`, etc.) | Legacy application CQRS infrastructure | **REJECTED (INFRASTRUCTURE COUPLED)** | Coupled to legacy SQLite repositories, EventStore, and SnapshotStore. |

---

## 6. Narrative / AI Architecture Compatibility

- Documented in [docs/development/NARRATIVE_AI_ARCHITECTURE.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/development/NARRATIVE_AI_ARCHITECTURE.md).
- Strict separation maintained:
  `PLAYER → AI Semantic Intent → ENGINE Authoritative Resolution → AI Narrative Realization → PLAYER`
- Knowledge boundaries protected: World Truth vs Character Knowledge vs Player Knowledge vs Rumors vs Secrets.

---

## 7. Recommended Next Migration Candidate

**RECOMMENDED NEXT DOMAIN**: **`military/services/MountService.ts`**

- **Justification**: Pure domain calculation service for post-combat horse death/injury checks (`resolveHorseDeathCheck` and `applyHorseDeathCheckOutcome`). Completes the military mount equipment lifecycle alongside `CombatStatsCalculator.ts` and `BreedingService.ts`.
- **Classification**: **B — MINIMAL ADAPTATION (READY WITH CONDITIONS)**.
- **Requirement**: Must be exposed via Engine facade `resolveHorseDeathCheck()` with `globalRNG` injection. Requires explicit human approval before conducting the readiness audit or generating the implementation prompt.
