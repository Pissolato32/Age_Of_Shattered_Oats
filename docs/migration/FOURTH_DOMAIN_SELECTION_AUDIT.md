# Fourth Domain Selection Audit

## Current Architecture State
- **Repository Branch**: `integration/legacy-consolidation` (Commit `370f91b`).
- **Engine Rule**: `GAME ENGINE = SINGLE SOURCE OF TRUTH`.
- **Status of Previous Migrations**:
  - `character`: Migrated and consolidated in `src/domain/character/`.
  - `relationship`: Migrated (`Relationship.ts`, `MemoryLog.ts`), integrated into `src/engine.ts` (`adjustHouseOpinion`/`setHouseOpinion`), and 100% verified.
  - `npc_ai`: Migrated (`CommanderAIService.ts`), integrated into `src/engine.ts` (`resolveNpcCombatAction`), and 100% verified.
  - `narrator`: Explicitly **REJECTED** as a domain due to two-way disk state mutation architectural violations (`StateApplicator`).
  - `adventure`: Already present in target repository (`src/domain/adventure/AdventureEngine.ts` committed in `f05d668`).
  - `world`: Explicitly **REJECTED** due to high duplication with existing `src/engine.ts` travel and weather functions (`calculateTravelTime`, `rollWeather`).
  - `region`: Explicitly **REJECTED** due to synchronous disk YAML I/O (`fs.readFileSync`).

---

## Candidates Audit

### 1. `visibility` (`src/domain/visibility/`)
- **Responsibility**: Spatial propagation and fog-of-war event delay calculations between major campaign hubs (`valenfort`, `blackmoor`, `harvel`, `capital`) based on distance matrices and elapsed ticks.
- **Architectural Layer**: **APPLICATION / DOMAIN SERVICE**
- **Source Files**: `src/domain/visibility/VisibilityService.ts`
- **Tests**: `tests/domain/NpcAndVisibility.test.ts` (Visibility portion)
- **Dependencies**: 0 external, 0 DB, 0 filesystem, 0 EventStore, 0 AI/RAG.
- **Persistence**: None.
- **RNG**: None (pure deterministic rule evaluation: `canObserverSeeEvent(observerLoc, eventLoc, currentTick, tickOccurred)`).
- **Clock**: None (accepts `currentTick` and `tickOccurred` parameters).
- **EventStore / Snapshot**: None.
- **Legacy Coupling**: None.
- **Target Equivalent**: Target `src/data.ts` defines landmarks, but lacks a spatial event propagation delay / fog-of-war mechanism.
- **Duplicate Logic**: None.
- **Migration Complexity**: **LOW**
- **Migration Risk**: **LOW**
- **Architectural Value**: **HIGH** (Provides clean spatial event visibility rules for rumors, secrets, and world events).
- **Reuse Classification**: **A — DIRECT REUSE**

---

### 2. `core/TimeService` (`src/domain/core/`)
- **Responsibility**: Calendar date translation from absolute ticks into `CalendarDate` objects (`day`, `monthNumber`, `monthName`, `season`, `year`).
- **Architectural Layer**: **DOMAIN**
- **Source Files**: `src/domain/core/TimeService.ts`
- **Tests**: `tests/domain/CoreAndCharacter.test.ts`
- **Dependencies**: None.
- **Target Equivalent / Duplication**: **PARTIAL DUPLICATION**. Target `src/engine.ts` calculates weekly dates inline in `resolveWeeklyTurn()`.
- **Migration Complexity**: **LOW**
- **Migration Risk**: **LOW**
- **Architectural Value**: **MEDIUM**
- **Reuse Classification**: **A — DIRECT REUSE** (Can serve as calendar utility).

---

### 3. `commerce` (`src/domain/commerce/`)
- **Responsibility**: Dynamic commodity market price calculator (`MarketService.ts`).
- **Architectural Layer**: **DOMAIN SERVICE**
- **Source Files**: `src/domain/commerce/services/MarketService.ts`
- **Tests**: `tests/domain/EconomyWeekly.test.ts`
- **Dependencies**: Requires `MONTH_SEASONS` alignment.
- **Target Equivalent**: Target `src/data.ts` has static `marketConditions`.
- **Migration Complexity**: **LOW**
- **Migration Risk**: **LOW**
- **Architectural Value**: **MEDIUM**
- **Reuse Classification**: **B — MINIMAL ADAPTATION**

---

### 4. `crime`, `holdings`, `items`, `kingdom`, `military`
- **Responsibility**: Legacy CQRS commands, construction services, item catalogs, and mount breeding services.
- **Architectural Layer**: **MIXED / INFRASTRUCTURE**
- **Legacy Coupling**: Heavy coupling to disk JSON files (`docs/compiled/items.json`, `docs/compiled/mounts.json`), legacy `IEventStore`, `ISnapshotStore`, and SQLite repositories (`IHoldingRepository`).
- **Target Equivalent**: Target manages economy, holdings, items, and army units cleanly in `CampaignState`, `src/engine.ts`, and `src/data.ts`.
- **Migration Complexity**: **HIGH**
- **Migration Risk**: **HIGH**
- **Architectural Value**: **LOW** (Requires extensive refactoring to strip legacy CQRS/EventStore dependencies).
- **Reuse Classification**: **D / E — REJECTED**

---

## Comparison Table

| Domain | Layer | Files | Tests | Persistence | RNG | Target Duplication | Complexity | Risk | Value | Recommendation |
|--------|-------|-------|-------|-------------|-----|--------------------|------------|------|-------|----------------|
| **`visibility`** | APP / DOMAIN | 1 | 1 | None | None | None | Low | Low | **High** | **RECOMMENDED FOURTH DOMAIN** |
| **`core/TimeService`** | DOMAIN | 1 | 1 | None | None | Partial (`engine.ts`) | Low | Low | Medium | Suitable Future Utility |
| **`commerce`** | DOMAIN SERVICE | 1 | 1 | None | None | Partial (`data.ts`) | Low | Low | Medium | Suitable Future Candidate |
| **`items`** | INFRASTRUCTURE | 7 | 2 | Disk JSON | Yes | High (`data.ts`) | High | High | Low | Rejected (Disk JSON I/O) |
| **`kingdom`** | INFRASTRUCTURE | 12 | 3 | SQLite DB | Yes | High (`engine.ts`) | High | High | Low | Rejected (CQRS / EventStore) |
| **`military`** | INFRASTRUCTURE | 15 | 3 | Disk JSON / EventStore | Yes | High (`engine.ts`) | High | High | Low | Rejected (CQRS / EventStore) |

---

## Rejected Candidates
- **`world`**: Rejected due to high duplication with `src/engine.ts` travel and weather functions.
- **`region`**: Rejected due to synchronous disk YAML file I/O (`fs.readFileSync`).
- **`items` / `kingdom` / `military`**: Rejected due to heavy coupling to legacy disk JSON files, SQLite repositories, `IEventStore`, and `ISnapshotStore`.
- **`narrator`**: Rejected due to two-way disk state mutation (`StateApplicator`) violating the Golden Rule (*Engine = Single Source of Truth*).

---

## Recommended Fourth Domain

### **RECOMMENDED FOURTH DOMAIN: visibility**

**Technical Justification**:
1. **High Architectural Value**: `VisibilityService.ts` introduces spatial event propagation delay rules between major campaign hubs (`valenfort`, `blackmoor`, `harvel`, `capital`), enabling fog-of-war distance delays for secrets, rumors, and news propagation.
2. **Zero Infrastructure & Persistence Coupling**: 0 SQLite DB dependencies, 0 filesystem dependencies, 0 EventStore/SnapshotStore dependencies, 0 AI/LLM dependencies.
3. **Pure Determinism**: 0 RNG calls, 0 Clock calls. It evaluates `canObserverSeeEvent(observerLoc, eventLoc, currentTick, tickOccurred)` with 100% determinism.
4. **Zero Target Duplication**: Target `src/data.ts` defines landmarks, but has no spatial event visibility propagation logic.
5. **Existing Test Coverage**: Covered by `tests/domain/NpcAndVisibility.test.ts` (Visibility section), which runs in <5ms with zero external mocks.
6. **Low Risk / High Safety**: Operates as a pure query service (`canObserverSeeEvent`).
