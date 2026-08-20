# Kingdom Construction Migration Report

## 1. Repository State
- **Branch**: `integration/legacy-consolidation`
- **Head Commit Before Migration**: `b8affdc` (`feat: integrate kingdom production domain into engine`)
- **Migrated Module**: `src/domain/kingdom/services/ConstructionService.ts`

---

## 2. Legacy Source
- Canonical implementation: `legacy/main:src/domain/kingdom/services/ConstructionService.ts`
- Rules preserved: `@rule holdings.buildings`, `@rule holdings.patches`, Rule G.3.

---

## 3. Migrated Components
- `src/domain/kingdom/services/ConstructionService.ts`: Pure domain service implementing:
  - `calculateRefund(costSd, costTimber, costStone)`: Returns 50% refund using exact `Math.floor` rounding behavior.
  - `resolvePatchQuality(prng)`: Resolves 1d6 patch quality roll (1-3: `'Common'`, 4-5: `'High-Grade'`, 6: `'Superb'`).

---

## 4. Rejected Infrastructure Components
- CQRS commands (`UpgradeResourcePatchCommand.ts`, `StartConstructionCommand.ts`): Rejected due to SQLite and EventStore repository coupling.

---

## 5. Construction Refund Rule
- **Formula**:
  $$\text{RefundSD} = \lfloor \text{CostSD} \times 0.5 \rfloor$$
  $$\text{RefundTimber} = \lfloor \text{CostTimber} \times 0.5 \rfloor$$
  $$\text{RefundStone} = \lfloor \text{CostStone} \times 0.5 \rfloor$$
- Preserved exact canonical legacy behavior.

---

## 6. Resource Patch Quality Rule & Deterministic RNG Integration
- **Rule G.3**: 1d6 roll.
- **Engine PRNG Boundary**: `resolveResourcePatchQuality(prng = globalRNG)` in `src/engine.ts` injects the deterministic `globalRNG` instance (`src/core/RandomService.ts`).
- **Replay Preservation**: `ReplayValidator.ts` remains 100% deterministic (10/10 snapshots verified).

---

## 7. Engine Integration Facades (`src/engine.ts`)
- `calculateConstructionRefund(costSd, costTimber, costStone)`
- `resolveResourcePatchQuality(prng = globalRNG)`

---

## 8. Test Coverage
- **Unit Tests**: `tests/domain/KingdomConstruction.test.ts` (**PASSED 100%**)
- **Integration Tests**: `tests/integration/KingdomConstructionEngineIntegration.test.ts` (**PASSED 100%**)
- **Full Test Suite (`npm test`)**: **PASSED 100%**
- **Build (`npm run build`)**: **PASSED 0 errors**
- **Replay Validator (`ReplayValidator.ts`)**: **PASSED 10/10 snapshots**

---

## 9. Purity & Duplication Audits
- **Purity Scan**: 0 forbidden dependencies in `src/domain/kingdom/`.
- **Duplication Scan**: Single authoritative facade in `src/engine.ts`.

---

## 10. Migration Matrix Status
Updated `docs/migration/MIGRATION_MATRIX.md`:
- `kingdom/construction`: **MIGRATED & INTEGRATED** (Evidence: `KINGDOM_CONSTRUCTION_MIGRATION_REPORT.md`).

---

## 11. Final Verdict

**MIGRATION COMPLETE**
