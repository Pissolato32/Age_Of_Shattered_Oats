# Second Domain Reuse Audit

## 1. Architectural principle
The target project **Age_Of_Shattered_Oats** operates under a strict, non-negotiable architectural rule:

> **GAME ENGINE = SINGLE SOURCE OF TRUTH**

- **Deterministic Rule Enforcement**: All state transitions, resource deductions, character stats, opinion bounds, and combat mechanics must be executed deterministically by pure domain/engine code.
- **AI / Narrative Role**: AI models act strictly as sensory post-processors. They translate engine outputs into literary narratives, but **MUST NOT** directly mutate state, bypass the engine, or write files to disk (e.g. legacy `StateApplicator`).
- **Backend Reuse Criterion**: Legacy backend code is eligible for migration only if it represents pure, deterministic domain or application logic that obeys the command/engine flow and has zero unmanaged legacy infrastructure coupling.

---

## 2. Candidates inspected
8 legacy candidates (and their associated sub-modules and tests) were audited:

1. **`relationship`** (`src/domain/relationship/`)
2. **`npc_ai`** (`src/domain/npc_ai/`)
3. **`visibility`** (`src/domain/visibility/`)
4. **`region`** (`src/domain/region/`)
5. **`world`** (`src/domain/world/`)
6. **`adventure`** (`src/domain/adventure/`)
7. **`commerce`** (`src/domain/commerce/`)
8. **`core`** (`src/domain/core/` and `src/core/`)

---

## 3. Candidate-by-candidate analysis

### 1. `relationship`
- **Architectural layer**: **DOMAIN**
- **Source files**: `src/domain/relationship/Relationship.ts`, `src/domain/relationship/MemoryLog.ts`
- **Tests**: `tests/domain/RelationshipAndMemory.test.ts`
- **STRUCTURAL TEST PROXY**: 1 test file / 2 source files = **0.50**
- **Direct dependencies**: `RuntimeLogger` (can be replaced or stripped).
- **Legacy-only dependencies**: None.
- **Persistence**: None (pure in-memory domain models).
- **RNG**: None.
- **Clock**: None (accepts `currentTick: number` explicitly).
- **EventStore**: None.
- **Snapshot**: None.
- **Target equivalent**: Partial equivalent in `src/types.ts` (`NobleHouse.opinion` bounded between -3 and +3). Target lacks formal Vow deadline tracking and `MemoryLog` decay evaluation.
- **Gameplay mutation risk**: **GOOD** (pure domain methods `adjustOpinion()`, `recordVow()`, `checkVowsExpired()`, `evaluateDecay()`).
- **Reuse classification**: **A — DIRECT REUSE**
- **Migration complexity**: **LOW**
- **Migration risk**: **LOW**
- **Reuse value**: **HIGH**
- **Recommendation**: **HIGHLY RECOMMENDED FOR IMMEDIATE MIGRATION**

---

### 2. `npc_ai`
- **Architectural layer**: **DOMAIN / APPLICATION** (Deterministic tactical rules engine)
- **Source files**: `src/domain/npc_ai/CommanderAIService.ts`
- **Tests**: `tests/domain/NpcAndVisibility.test.ts`
- **STRUCTURAL TEST PROXY**: 1 test file / 1 source file = **1.00**
- **Direct dependencies**: None.
- **Legacy-only dependencies**: None.
- **Persistence**: None.
- **RNG**: None (pure decision tree based on `CombatContext` and `CommanderProfile`).
- **Clock**: None.
- **EventStore**: None.
- **Snapshot**: None.
- **Target equivalent**: Nothing equivalent exists in target.
- **Gameplay mutation risk**: **GOOD** (pure decision function `selectCombatTactic()`).
- **Reuse classification**: **A — DIRECT REUSE**
- **Migration complexity**: **LOW**
- **Migration risk**: **LOW**
- **Reuse value**: **MEDIUM**
- **Recommendation**: **SUITABLE FOR PILOT OR SECONDARY MIGRATION**

---

### 3. `visibility`
- **Architectural layer**: **APPLICATION / DOMAIN SERVICE**
- **Source files**: `src/domain/visibility/VisibilityService.ts`
- **Tests**: `tests/domain/NpcAndVisibility.test.ts`
- **STRUCTURAL TEST PROXY**: 1 test file / 1 source file = **1.00**
- **Direct dependencies**: None.
- **Legacy-only dependencies**: None.
- **Persistence**: None (in-memory regional distance matrix).
- **RNG**: None.
- **Clock**: None (accepts `currentTick` and `tickOccurred` parameters).
- **EventStore**: None.
- **Snapshot**: None.
- **Target equivalent**: Nothing equivalent exists in target (spatial propagation of event visibility).
- **Gameplay mutation risk**: **GOOD** (pure query `canObserverSeeEvent()`).
- **Reuse classification**: **A — DIRECT REUSE**
- **Migration complexity**: **LOW**
- **Migration risk**: **LOW**
- **Reuse value**: **MEDIUM**
- **Recommendation**: **SUITABLE FOR PILOT OR SECONDARY MIGRATION**

---

### 4. `region`
- **Architectural layer**: **INFRASTRUCTURE / DATA ACCESS**
- **Source files**: `src/domain/region/RegionalResourcesService.ts`
- **Tests**: Tested indirectly via integration suites.
- **STRUCTURAL TEST PROXY**: N/A
- **Direct dependencies**: `fs`, `path`, `js-yaml`, `RuntimeLogger`.
- **Legacy-only dependencies**: Reads legacy file `contracts/regional_resources.yaml` synchronously at startup.
- **Persistence**: Disk YAML files.
- **RNG**: None.
- **Clock**: None.
- **EventStore**: None.
- **Snapshot**: None.
- **Target equivalent**: Target stores regional data in `src/data.ts` in-memory.
- **Gameplay mutation risk**: **GOOD** (read-only query service), but file I/O is incompatible.
- **Reuse classification**: **C — SIGNIFICANT ADAPTATION**
- **Migration complexity**: **MEDIUM**
- **Migration risk**: **MEDIUM**
- **Reuse value**: **LOW**
- **Recommendation**: **DO NOT MIGRATE DIRECTLY** (target `src/data.ts` is superior).

---

### 5. `world`
- **Architectural layer**: **DOMAIN & APPLICATION**
- **Source files**: 
  - `src/domain/world/TravelService.ts`
  - `src/domain/world/WeatherCatalogService.ts`
  - `src/domain/world/services/WeatherService.ts`
  - `src/domain/world/commands/RollWeatherCommand.ts`
  - `src/domain/world/queries/GetRegionalWeatherEffectsQuery.ts`
- **Tests**: `tests/domain/weather.test.ts`, `tests/domain/KingdomAndWorld.test.ts`
- **STRUCTURAL TEST PROXY**: 2 test files / 5 source files = **0.40**
- **Direct dependencies**: `fs`, `path`, `IHoldingRepository`, `IEventStore`.
- **Legacy-only dependencies**: `RollWeatherCommand` couples to legacy `IEventStore` and `IHoldingRepository`. `WeatherCatalogService` reads `docs/compiled/climate.json` from disk.
- **Persistence**: Reads JSON disk tables.
- **RNG**: `RollWeatherCommand` uses seed/dice rolling. `TravelService` has 0 RNG.
- **Clock**: None.
- **Target equivalent**: Target has basic weather strings in `engine.ts` (`currentWeather`), but lacks detailed terrain travel times (`TravelService`).
- **Gameplay mutation risk**: `TravelService` is **GOOD** (pure travel time calculation). `RollWeatherCommand` is **BAD** (couples to legacy EventStore).
- **Reuse classification**: 
  - `TravelService`: **A — DIRECT REUSE**
  - `WeatherService`: **B — MINIMAL ADAPTATION**
  - `RollWeatherCommand`: **F — LEGACY-ONLY**
- **Migration complexity**: **MEDIUM**
- **Migration risk**: **MEDIUM**
- **Reuse value**: **HIGH** (specifically `TravelService`)
- **Recommendation**: **MIGRATE `TravelService` ONLY**; discard legacy command orchestrators.

---

### 6. `adventure`
- **Architectural layer**: **DOMAIN / APPLICATION** (Text adventure dungeon engine)
- **Source files**: `src/domain/adventure/AdventureEngine.ts`, `src/domain/adventure/AdventureGenerator.ts`, `src/domain/adventure/AdventureTypes.ts`
- **Tests**: `tests/domain/AdventureEngine.test.ts`
- **STRUCTURAL TEST PROXY**: 1 test file / 3 source files = **0.33**
- **Direct dependencies**: None.
- **Legacy-only dependencies**: None.
- **Persistence**: None (pure functional state transform).
- **RNG**: None.
- **Clock**: None.
- **EventStore**: None.
- **Snapshot**: None.
- **Target equivalent**: Nothing equivalent exists.
- **Gameplay mutation risk**: **GOOD** (functional state transitions `(state, command) => newState`).
- **Reuse classification**: **A — DIRECT REUSE**
- **Migration complexity**: **LOW**
- **Migration risk**: **LOW**
- **Reuse value**: **MEDIUM** (standalone sub-system)
- **Recommendation**: **EXCELLENT REUSABLE SUB-SYSTEM** (can be migrated as an optional feature).

---

### 7. `commerce`
- **Architectural layer**: **DOMAIN SERVICE**
- **Source files**: `src/domain/commerce/services/MarketService.ts`
- **Tests**: `tests/domain/EconomyWeekly.test.ts`
- **STRUCTURAL TEST PROXY**: 1 test file / 1 source file = **1.00**
- **Direct dependencies**: `MONTH_SEASONS` from `TimeService.ts`.
- **Legacy-only dependencies**: None.
- **Persistence**: None.
- **RNG**: None.
- **Clock**: None.
- **EventStore**: None.
- **Snapshot**: None.
- **Target equivalent**: Partial market calculations in `src/engine.ts`.
- **Gameplay mutation risk**: **GOOD** (pure price calculation `calculatePrice()`).
- **Reuse classification**: **B — MINIMAL ADAPTATION** (depends on `TimeService`).
- **Migration complexity**: **LOW**
- **Migration risk**: **LOW**
- **Reuse value**: **MEDIUM**
- **Recommendation**: **SUITABLE AFTER `TimeService` IS AVAILABLE**

---

### 8. `core`
- **Architectural layer**: **MULTI-LAYER** (`TimeService.ts` = DOMAIN; `RandomService.ts` = INFRASTRUCTURE/RNG; DB interfaces = INFRASTRUCTURE)
- **Source files**: `src/domain/core/TimeService.ts`, `src/core/engine/RandomService.ts`, `src/core/engine/StateAdvancer.ts`, `src/core/engine/MissionService.ts`, database interfaces.
- **Tests**: `tests/domain/CoreAndCharacter.test.ts`
- **STRUCTURAL TEST PROXY**: 1 test file / 5 source files = **0.20**
- **Direct dependencies**: `TimeService.ts` has 0 dependencies.
- **Legacy-only dependencies**: Database interfaces (`ICharacterRepository`, `IEventStore`, etc.) couple to legacy SQLite infrastructure.
- **Target equivalent**: Target already has `globalRNG` (`src/engine.ts`), `CampaignState` (`src/types.ts`), and weekly tick processing in `src/engine.ts`.
- **Reuse classification**:
  - `TimeService.ts`: **A — DIRECT REUSE**
  - Database interfaces: **F — LEGACY-ONLY**
  - `RandomService`: **D — MERGE WITH TARGET** (target already has `globalRNG`).
- **Migration complexity**: **LOW** (for `TimeService`), **HIGH** (for full core).
- **Migration risk**: **LOW** (for `TimeService`), **HIGH** (for DB interfaces).
- **Reuse value**: `TimeService.ts` is **HIGH**.
- **Recommendation**: **MIGRATE `TimeService.ts` AS A UTILITY**

---

## 4. Dependency relationships

```
[TimeService] <─────── [MarketService]
      ▲
      │
[Relationship] ──────> (None)
[MemoryLog] ─────────> (None)
[CommanderAIService] > (None)
[VisibilityService] ─> (None)
[TravelService] ─────> (None)
[AdventureEngine] ───> (None)
```

- `Relationship`, `MemoryLog`, `CommanderAIService`, `VisibilityService`, `TravelService`, and `AdventureEngine` are completely decoupled standalone domain modules with **zero cross-domain dependencies**.
- `MarketService` depends only on `TimeService`.

---

## 5. Candidates explicitly rejected

### 1. `src/domain/narrator/` (REJECTED AS A DOMAIN)
- **Why Rejected**: The previous audit confirmed that Narrator is an Application/AI/Infrastructure orchestration pipeline, not domain logic. Furthermore, its `StateApplicator` attempts two-way LLM-to-disk-state mutation, violating the target's core Golden Rule (*Engine = Single Source of Truth*).

### 2. `src/domain/region/` (REJECTED FOR DIRECT MIGRATION)
- **Why Rejected**: Hardcodes synchronous file reads from disk (`contracts/regional_resources.yaml`). The target repository already manages regional data cleanly in-memory in `src/data.ts`.

### 3. `RollWeatherCommand.ts` (REJECTED FROM `world`)
- **Why Rejected**: Hard-couples to legacy `IEventStore` and `IHoldingRepository`. `TravelService` and `WeatherService` are safe, but legacy command orchestrators are not.

---

## 6. Recommended next migration

### **RECOMMENDED SECOND MIGRATION: relationship**

**Supporting Evidence**:
1. **Genuine Domain Logic**: `Relationship` and `MemoryLog` provide essential campaign rules for noble house opinions (clamped between -3 and +3), diplomatic vow expiration, and memory decay limits over time.
2. **Zero Infrastructure Coupling**: 0 SQLite dependencies, 0 filesystem dependencies, 0 EventStore dependencies, 0 AI/RAG dependencies.
3. **Target Alignment**: The target repository already tracks `NobleHouse.opinion` in `src/types.ts` and `src/data.ts`. `Relationship` provides the exact missing domain logic to encapsulate and validate these opinion adjustments and vows deterministically.
4. **Clean Verification**: Tested by `tests/domain/RelationshipAndMemory.test.ts` which runs synchronously with zero mocks or external state.

---

## 7. Migration boundary
If approved, the exact files to migrate for the second domain migration are:

- `src/domain/relationship/Relationship.ts`
- `src/domain/relationship/MemoryLog.ts`
- `tests/domain/RelationshipAndMemory.test.ts`

*(Optional companions with 0 risk if desired in the same wave: `src/domain/npc_ai/CommanderAIService.ts`, `src/domain/visibility/VisibilityService.ts`, `src/domain/world/TravelService.ts`)*

---

## 8. Preconditions
1. Replace or strip `RuntimeLogger.logRule()` calls in `Relationship.ts` and `MemoryLog.ts` with target-compatible logging or no-op handlers.
2. Verify that `NobleHouse` / `Character` IDs passed to `Relationship` are valid strings matching `CampaignState` entity IDs.
