# Succession Migration Report (SuccessionService)

## 1. Files Migrated
- `src/domain/kingdom/services/SuccessionService.ts` (Migrated pure dynastic succession sorting algorithm from `legacy/main:src/domain/kingdom/services/SuccessionService.ts`).

---

## 2. Files Adapted
- `src/engine.ts`: Added Engine boundary facades:
  - `calculateSuccessionOrder(relatives: Relative[])`: Pure domain helper for sorting relatives by primogeniture hierarchy.
  - `resolveDynasticSuccession(state, mode)`: Authoritative facade for promoting the highest-ranking heir when a ruler abdicates or dies, updating `state.character`, state children, and recording the major event in `worldLedger`.
- `src/components/ActivePlay.tsx`: Replaced naive UI index array fallback (`s.family.children[0]`) with `resolveDynasticSuccession(s, mode)`.
- `package.json`: Updated `npm test` script to include `tests/domain/SuccessionService.test.ts` and `tests/integration/SuccessionEngineIntegration.test.ts`.

---

## 3. Deliberately Omitted / Rejected Legacy Infrastructure
- **`RuntimeLogger`**: Removed (`import { RuntimeLogger }` stripped).
- **CQRS EventStore Commands & Repositories**: All 9 legacy CQRS commands (`AllocateLaborCommand`, `StartConstructionCommand`, etc.) and SQLite repositories rejected.

---

## 4. Preserved Canonical Rules
- **Rule Reference**: `@rule politics.succession`
- **Primogeniture Hierarchy**:
  1. Eldest legitimate children (`relation === 'child' && isLegitimate`, sorted by age descending).
  2. Legitimate siblings (`relation === 'sibling' && isLegitimate`, sorted by age descending).
  3. Legitimate nephews and nieces (`relation === 'nephew' || 'niece'`, sorted by age descending).
  4. Other blood relatives (legitimate first, then illegitimate, sorted by age descending).

---

## 5. Engine Integration & Single Source of Truth
- `src/engine.ts` owns `resolveDynasticSuccession(state, mode)`.
- UI (`ActivePlay.tsx`) contains 0 succession calculation logic.

---

## 6. Duplicate Logic Audit
- `git grep -n -i -E "succession|heir|inherit|heirship" -- src` returned **0 duplicate calculation algorithms**.

---

## 7. Determinism Audit
- `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- src/domain/kingdom` returned **0 matches**.

---

## 8. Tests
- `tests/domain/SuccessionService.test.ts`: **PASSED (100%)**
- `tests/integration/SuccessionEngineIntegration.test.ts`: **PASSED (100%)**
- `npm test`: **PASSED (100%)**

---

## 9. Build & Replay
- `npm run build`: **PASSED (0 errors)**
- `npx tsx src/tools/ReplayValidator.ts`: **PASSED (10/10 deterministic snapshots)**

---

## 10. Migration Matrix Update
- Status for `kingdom/succession` updated to `MIGRATED & INTEGRATED` in `docs/migration/MIGRATION_MATRIX.md`.
