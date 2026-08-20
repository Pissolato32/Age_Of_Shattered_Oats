# Third Domain Selection Audit

## Current Architecture State
- **Repository Branch**: `integration/legacy-consolidation` (Commit `5a345bc`).
- **Engine Rule**: `GAME ENGINE = SINGLE SOURCE OF TRUTH`.
- **Status of Previous Migrations**:
  - `character`: Migrated and consolidated in `src/domain/character/`.
  - `relationship`: Migrated (`Relationship.ts`, `MemoryLog.ts`), integrated into `src/engine.ts` (`adjustHouseOpinion`/`setHouseOpinion`), and 100% verified via unit, integration, and replay tests.
  - `narrator`: Explicitly **REJECTED** as a domain due to two-way disk state mutation architectural violations (`StateApplicator`).
  - `adventure`: Already present in target repository (`src/domain/adventure/AdventureEngine.ts` committed in `f05d668`).

---

## Candidates

### 1. `npc_ai` (`src/domain/npc_ai/`)
- **Responsibility**: Deterministic tactical combat decision resolution for NPC commanders based on temperament (Aggressive, Disciplined, Cunning, Loyal, Proud, Wary), priority, fear triggers, morale, and unit strength.
- **Architectural Layer**: **DOMAIN / APPLICATION**
- **Source Files**: `src/domain/npc_ai/CommanderAIService.ts`
- **Tests**: `tests/domain/NpcAndVisibility.test.ts`
- **Dependencies**: 0 external, 0 DB, 0 filesystem, 0 EventStore, 0 AI/RAG.
- **Persistence**: None.
- **RNG**: None (pure deterministic rules engine: `(CombatContext, CommanderProfile) => CombatTactic`).
- **Clock**: None.
- **EventStore / Snapshot**: None.
- **Legacy Coupling**: None.
- **Target Equivalent**: None. Target `simulateCombatRound()` in `src/engine.ts` handles numerical dice rounds, but lacks tactical commander decision logic based on temperament and morale thresholds.
- **Duplicate Logic**: None.
- **Migration Complexity**: **LOW**
- **Migration Risk**: **LOW**
- **Architectural Value**: **HIGH** (Adds deterministic, personality-driven tactical AI for NPC armies and encounters).
- **Reuse Classification**: **A — DIRECT REUSE**

---

### 2. `visibility` (`src/domain/visibility/`)
- **Responsibility**: Spatial propagation and fog-of-war delay calculations for events between campaign hubs based on distance matrices and elapsed ticks.
- **Architectural Layer**: **APPLICATION / DOMAIN SERVICE**
- **Source Files**: `src/domain/visibility/VisibilityService.ts`
- **Tests**: `tests/domain/NpcAndVisibility.test.ts`
- **Dependencies**: None.
- **Persistence**: None.
- **RNG**: None.
- **Clock**: None (accepts `currentTick` and `tickOccurred` parameters).
- **EventStore / Snapshot**: None.
- **Legacy Coupling**: None.
- **Target Equivalent**: None. Target `src/data.ts` has landmark definitions, but lacks spatial event propagation delay rules.
- **Duplicate Logic**: None.
- **Migration Complexity**: **LOW**
- **Migration Risk**: **LOW**
- **Architectural Value**: **MEDIUM**
- **Reuse Classification**: **A — DIRECT REUSE**

---

### 3. `adventure` (`src/domain/adventure/`)
- **Responsibility**: Text adventure dungeon exploration engine.
- **Architectural Layer**: **DOMAIN / APPLICATION**
- **Source Files**: Already present in target repository (`src/domain/adventure/AdventureEngine.ts`, `AdventureTypes.ts`).
- **Status**: **ALREADY MIGRATED** (Committed in `f05d668`).

---

### 4. `world` (`src/domain/world/`)
- **Responsibility**: Travel duration calculations, climate/weather tables, weather rolling, and regional weather combat effects.
- **Architectural Layer**: **DOMAIN & APPLICATION**
- **Source Files**: `TravelService.ts`, `WeatherCatalogService.ts`, `services/WeatherService.ts`, `commands/RollWeatherCommand.ts`, `queries/GetRegionalWeatherEffectsQuery.ts`.
- **Tests**: `tests/domain/weather.test.ts`, `tests/domain/KingdomAndWorld.test.ts`.
- **Target Equivalent / Duplication**: **HIGH DUPLICATION**. Target `src/engine.ts` ALREADY contains `calculateTravelTime()` (lines 372–408), `rollWeather()` (lines 418–451), and `WEATHER_EFFECTS_BY_REGION_AND_SEASON` in `src/data.ts`.
- **Migration Complexity**: **HIGH**
- **Migration Risk**: **HIGH** (Risk of breaking existing travel/weather mechanics in `src/engine.ts`).
- **Architectural Value**: **LOW** (Target implementation is already active and superior).
- **Reuse Classification**: **D — REJECTED / DUPLICATED**

---

### 5. `commerce` (`src/domain/commerce/`)
- **Responsibility**: Dynamic commodity market price calculator (`MarketService.ts`).
- **Architectural Layer**: **DOMAIN SERVICE**
- **Source Files**: `src/domain/commerce/services/MarketService.ts`
- **Tests**: `tests/domain/EconomyWeekly.test.ts`
- **Dependencies**: `MONTH_SEASONS` from `TimeService.ts`.
- **Target Equivalent / Duplication**: **PARTIAL**. Target `src/data.ts` has static `marketConditions`. `MarketService` provides dynamic pricing formulas based on seasonal scarcity and market saturation.
- **Migration Complexity**: **LOW**
- **Migration Risk**: **LOW**
- **Architectural Value**: **MEDIUM**
- **Reuse Classification**: **B — MINIMAL ADAPTATION** (Can be integrated after `TimeService` or `MONTHS` alignment).

---

### 6. `region` (`src/domain/region/`)
- **Responsibility**: Reads regional resources (ships, horses, militia, food) from disk YAML (`contracts/regional_resources.yaml`).
- **Architectural Layer**: **INFRASTRUCTURE / DATA ACCESS**
- **Source Files**: `src/domain/region/RegionalResourcesService.ts`
- **Dependencies**: Synchronous file I/O (`fs.readFileSync`), `js-yaml`, `path`.
- **Target Equivalent**: Target stores regional data cleanly in-memory in `src/data.ts`.
- **Reuse Classification**: **E — REJECTED** (Incompatible disk file I/O; target `src/data.ts` is superior).

---

### 7. `core` (`src/domain/core/` and `src/core/`)
- **Responsibility**: Calendar time translation (`TimeService.ts`), RNG (`RandomService.ts`), state advancement (`StateAdvancer.ts`), and database repository interfaces.
- **Architectural Layer**: **MULTI-LAYER**
- **Target Equivalent**: Target already has `globalRNG` (`src/engine.ts`), `CampaignState` (`src/types.ts`), and weekly turn processing in `src/engine.ts`. `TimeService.ts` is a pure calendar calculator.
- **Reuse Classification**: `TimeService.ts` = **A — DIRECT REUSE**; DB interfaces = **F — LEGACY-ONLY**.

---

## Comparison Table

| Domain | Layer | Files | Tests | Persistence | RNG | Target Duplication | Complexity | Risk | Value | Recommendation |
|--------|-------|-------|-------|-------------|-----|--------------------|------------|------|-------|----------------|
| **`npc_ai`** | DOMAIN / APP | 1 | 1 | None | None | None | Low | Low | **High** | **RECOMMENDED THIRD DOMAIN** |
| **`visibility`** | APP / SERVICE | 1 | 1 | None | None | None | Low | Low | Medium | Suitable Secondary Candidate |
| **`adventure`** | DOMAIN / APP | 2 | 1 | None | None | Already Migrated | Low | Low | Medium | Already Migrated (`f05d668`) |
| **`world`** | DOMAIN / APP | 5 | 2 | Disk JSON | Yes | High (`engine.ts`) | High | High | Low | Rejected (Duplicated in Engine) |
| **`commerce`** | DOMAIN SERVICE | 1 | 1 | None | None | Partial (`data.ts`) | Low | Low | Medium | Suitable Future Candidate |
| **`region`** | INFRASTRUCTURE | 1 | 0 | Disk YAML | None | High (`data.ts`) | Medium | Medium | Low | Rejected (Disk YAML I/O) |
| **`core`** | MULTI-LAYER | 5 | 1 | SQLite DB | Yes | High (`engine.ts`) | High | High | Medium | Selective (`TimeService` only) |

---

## Rejected Candidates
- **`world`**: Rejected because travel time (`calculateTravelTime`) and weather rolling (`rollWeather`) are already implemented directly in target `src/engine.ts` and `src/data.ts`. Copying `src/domain/world` would create redundant, conflicting weather engines.
- **`region`**: Rejected because it relies on synchronous disk I/O (`fs.readFileSync`) to read legacy YAML files, whereas target manages regional data in-memory in `src/data.ts`.
- **`narrator`**: Previously rejected due to two-way disk state mutation (`StateApplicator`) violating the Golden Rule (*Engine = Single Source of Truth*).
- **`adventure`**: Already present in target repository (`src/domain/adventure/AdventureEngine.ts`).

---

## Recommended Third Domain

### **RECOMMENDED THIRD DOMAIN: npc_ai**

**Technical Justification**:
1. **High Architectural Value**: `CommanderAIService.ts` adds deterministic tactical intelligence (`selectCombatTactic`) for NPC army commanders based on temperament (Aggressive, Disciplined, Cunning, Loyal, Proud, Wary), priority, fear triggers, morale, and unit strength thresholds. This fills a distinct functional gap in target's combat simulation where NPC commanders currently lack personality-driven combat AI.
2. **Zero Infrastructure & Persistence Coupling**: 0 SQLite DB dependencies, 0 filesystem dependencies, 0 EventStore/SnapshotStore dependencies, 0 AI/LLM gateway dependencies.
3. **Pure Determinism**: 0 RNG or Clock calls. It is a pure deterministic decision function `(CombatContext, CommanderProfile) => CombatTactic`.
4. **Zero Target Duplication**: Target `simulateCombatRound()` handles numerical dice rolls, but has no equivalent `CommanderAIService`.
5. **Existing Test Coverage**: Covered by `tests/domain/NpcAndVisibility.test.ts`, which runs in <5ms with zero external mocks or database setup.
