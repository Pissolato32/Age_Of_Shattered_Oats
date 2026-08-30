# Relationship Post-Migration Audit

## 1. Migration status
- **Files Migrated**: `src/domain/relationship/Relationship.ts`, `src/domain/relationship/MemoryLog.ts`.
- **Tests Migrated**: `tests/domain/RelationshipAndMemory.test.ts`.
- **Integration Tests Added**: `tests/integration/RelationshipTargetIntegration.test.ts`.
- **Status**: The pure domain models and test suites have been successfully copied, adapted (legacy `RuntimeLogger` stripped), build-verified, and committed to `integration/legacy-consolidation`.

---

## 2. Actual Engine integration
- **Current Finding**: `Relationship` is currently available in `src/domain/relationship/`, verified by unit tests and integration tests, but is **NOT yet directly invoked by `engine.ts`** or action handlers during weekly turn resolution.
- `engine.ts` currently performs inline manual opinion modifications (e.g. `house.opinion = Math.max(-3, house.opinion - 1)`).

---

## 3. CampaignState integration
- `Relationship` operates using `sourceId` and `targetId` matching `NobleHouse.name` / `Character.name` in `CampaignState.worldLedger.nobleHouses`.
- `NobleHouse.opinion` in `src/types.ts` is the canonical state representation (bounded between -3 and +3).
- **Duplicate State**: Zero duplicate state stores were added.

---

## 4. MemoryLog integration
- `MemoryLog` is isolated as a pure domain utility in `src/domain/relationship/MemoryLog.ts`.
- It is verified by unit and integration tests, but is **NOT yet stored in `CampaignState`** (e.g. `worldLedger` does not yet contain a `memories: MemoryLog[]` array).

---

## 5. Duplicate logic found
Inline manual opinion clamping and adjustment exist in:
- `src/engine.ts` (lines 613, 624, 670–671): manual drift adjustment `Math.max(-3, house.opinion - 1)` / `Math.min(3, house.opinion + 1)`.
- `src/components/ActivePlay.tsx` (lines 582, 667, 673, 703, 1036, 1052, 1155, 1351, 1382): inline opinion increments/decrements.
- **Recommendation**: In a future refactoring step, route these inline mutations through `Relationship.adjustOpinion()` or a dedicated `RelationshipService` helper.

---

## 6. Determinism verification
- All operations in `Relationship.ts` and `MemoryLog.ts` are 100% deterministic pure functions.
- Replay validator confirms 10/10 snapshot checkpoints remain deterministic.

---

## 7. Test/build/replay results
- `npm test`: **PASSED (100%)**
- `npm run build`: **PASSED (0 errors)**
- `npm run replay:validate`: **PASSED (10/10 snapshots)**

---

## 8. Git state
- **Current Branch**: `integration/legacy-consolidation`
- **Working Tree**: Clean (tracked files), untracked audit markdown reports present.
- **Commit**: `89b949c feat: integrate relationship domain from legacy`
- **Main Branch**: Unmodified.

---

## 9. Required follow-up work
1. Connect `Relationship.adjustOpinion()` to `engine.ts` weekly turn house drift and action handling.
2. Optional: Add a `memories: MemoryLog[]` collection to `CampaignState` if memory decay tracking across weeks is desired in future mechanics.

---

## 10. Final classification

### **MIGRATED / NEEDS INTEGRATION**

*(Classified as A — MIGRATED BUT NOT YET USED BY ENGINE. Code is pure, clean, and tested, awaiting wiring into `engine.ts` turn handlers).*
