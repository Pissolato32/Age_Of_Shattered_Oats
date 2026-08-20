# RELATIONSHIP_MIGRATION_REPORT.md

## 1. Files migrated
- `src/domain/relationship/Relationship.ts` (Pure domain model representing house/character opinion bounds and vows)
- `src/domain/relationship/MemoryLog.ts` (Pure domain model representing memory decay logic)

---

## 2. Files intentionally NOT migrated
- `src/domain/narrator/*` (Narrator domain / state applicator - rejected due to two-way disk state mutation architectural violation)
- Legacy database repositories and infrastructure files (`SqliteCharacterRepository`, `IEventStore`, etc.)

---

## 3. Import adaptations
- Removed legacy `import { RuntimeLogger }` from `Relationship.ts` and `MemoryLog.ts`.
- Removed `RuntimeLogger.logRule(...)` diagnostic calls.
- Introduced **zero** legacy infrastructure or database imports.

---

## 4. Target integration point
- `Relationship` and `MemoryLog` integrate directly with `CampaignState.worldLedger.nobleHouses` (`NobleHouse.opinion` bounded between -3 and +3) in `src/types.ts` and `src/engine.ts`.
- Encapsulates opinion clamping and provides pure functional vow checking and memory decay formulas.

---

## 5. Duplicate-state analysis
- **Result: ZERO DUPLICATE STATE CREATED.**
- `Relationship` operates on existing entity identifiers (`sourceId`, `targetId`) and aligns with `NobleHouse.opinion` without introducing parallel state trees or database stores.

---

## 6. Tests migrated
- `tests/domain/RelationshipAndMemory.test.ts` (Unit test suite validating opinion bounds clamping, vow expiration, and memory decay).

---

## 7. New integration tests
- `tests/integration/RelationshipTargetIntegration.test.ts` (Target integration test validating deterministic interaction with `createInitialState()`, `NobleHouse`, `CampaignState`, and state copy replay determinism).

---

## 8. Determinism result
- `npm test`: **PASSED (100%)**
- `npx tsx src/tools/ReplayValidator.ts`: **PASSED (10/10 snapshots deterministic)**
- `npm run build`: **PASSED (0 build errors)**

---

## 9. Architecture compliance
- **Architectural Audit Search**: `git grep -n -E "sqlite|typeorm|Math\.random|globalRNG|RandomService|Date\.now|new Date|EventStore|SnapshotStore|fs\." -- src/domain/relationship` returned **0 matches**.
- **Rule Compliance**: `GAME ENGINE = SINGLE SOURCE OF TRUTH` strictly preserved.

---

## 10. Remaining concerns
- None. The Relationship domain migration is fully isolated, deterministic, and clean.

---

## 11. Engine Integration
- **Engine Integration Point**: `src/engine.ts` exports `adjustHouseOpinion(house, delta, sourceId)` and `setHouseOpinion(house, targetOpinion, sourceId)`, encapsulating canonical `Relationship` domain rules.
- **Relationship Methods Used**: `new Relationship(...)` constructor and `rel.adjustOpinion(delta)` for clamping `-3..+3`.
- **Opinion Mutations Consolidated**: All 11 inline opinion mutations in `src/engine.ts` (weekly drift & exposure events) and `src/components/ActivePlay.tsx` (smudging rituals, horns, marriage, espionage, lineage exposure, siege surrender/assault) were refactored to delegate to `adjustHouseOpinion` and `setHouseOpinion`.
- **ActivePlay Changes**: Removed all direct authoritative `h.opinion = ...` UI-level mutations. UI components now invoke Engine-owned domain functions (`adjustHouseOpinion`/`setHouseOpinion`).
- **MemoryLog Status**: `MemoryLog` is migrated and fully tested in `src/domain/relationship/MemoryLog.ts`. Per architectural directive, no unvalidated `memories` array was added to `CampaignState`; `MemoryLog` remains an available pure domain utility.
- **Tests Added**: Created `tests/integration/RelationshipEngineIntegration.test.ts` proving Engine-level execution, opinion bounds enforcement (-3..+3), and deterministic replay across weekly turns.
- **Validation Results**:
  - `npm test`: **PASSED (100%)** (GoldenScenarios, RelationshipAndMemory, RelationshipTargetIntegration, RelationshipEngineIntegration, ReplayValidator).
  - `npm run build`: **PASSED (0 errors)**.
  - `npm run replay:validate`: **PASSED (10/10 snapshots deterministic)**.

