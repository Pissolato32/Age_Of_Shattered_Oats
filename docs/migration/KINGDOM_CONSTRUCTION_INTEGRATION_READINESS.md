# Kingdom Construction Integration Readiness Audit

## 1. Current Repository State

- **Branch**: `integration/legacy-consolidation`
- **Current HEAD Commit**: `b8affdc` (`feat: integrate kingdom production domain into engine`)
- **Working Tree**: Clean (`.agent/` untracked directory).
- **Target `src/domain/` Structure**:
  1. `character/Character.ts`
  2. `relationship/Relationship.ts`, `MemoryLog.ts`
  3. `npc_ai/CommanderAIService.ts`
  4. `visibility/VisibilityService.ts`
  5. `commerce/services/MarketService.ts`
  6. `items/CombatStatsCalculator.ts`
  7. `kingdom/services/SuccessionService.ts`
  8. `kingdom/services/ProductionService.ts`, `FoodService.ts`, `LaborService.ts`, `TreasuryService.ts`
  9. `adventure/AdventureEngine.ts` (Pre-existing target domain)

---

## 2. Legacy Domain Inventory (`legacy/main:src/domain/kingdom/services/ConstructionService.ts`)

| Component | Purity | Dependencies | Target Equivalent | Duplication Status | Consumer in Target | Classification |
|---|---|---|---|---|---|---|
| **`ConstructionService.ts`** | Pure (with PRNG) | `RandomService` | Inline math / missing facade | **MISSING FORMULA** | `src/engine.ts` & `ActivePlay.tsx` | **A — DIRECT REUSE / B — MINIMAL ADAPTATION** |
| **`UpgradeResourcePatchCommand.ts`** | 0% Pure | `IHoldingRepository`, `IEventStore`, `SQLite` | Engine facade actions | **REJECTED INFRASTRUCTURE** | N/A | **E — REJECTED INFRASTRUCTURE** |
| **`StartConstructionCommand.ts`** | 0% Pure | `IHoldingRepository`, `IEventStore`, `SQLite` | Engine facade actions | **REJECTED INFRASTRUCTURE** | N/A | **E — REJECTED INFRASTRUCTURE** |

---

## 3. Construction Gameplay Formulas Audit

### 3.1 Demolition / Cancellation Resource Refund
- **Rule Reference**: `@rule holdings.buildings`, `@rule holdings.patches`
- **Formula**:
  $$\text{RefundSD} = \lfloor \text{CostSD} \times 0.5 \rfloor$$
  $$\text{RefundTimber} = \lfloor \text{CostTimber} \times 0.5 \rfloor$$
  $$\text{RefundStone} = \lfloor \text{CostStone} \times 0.5 \rfloor$$
- **Legacy Source**: `ConstructionService.calculateRefund(costSd, costTimber, costStone)`
- **Target Status**: **MISSING FORMULA** (currently unmapped in target Engine).

### 3.2 Resource Patch Completion Quality Resolution (1d6 Roll)
- **Rule Reference**: Rule G.3 (`@rule holdings.patches`)
- **Roll Logic**: 1d6 roll using PRNG instance (`prng.nextInt(1, 6)`).
- **Outcomes**:
  - Roll `1–3`: `'Common'`
  - Roll `4–5`: `'High-Grade'`
  - Roll `6`: `'Superb'`
- **Legacy Source**: `ConstructionService.resolvePatchQuality(prng)`
- **Target Status**: **MISSING FORMULA** (resource patches in target default to `'Common'` or static spec quality).

---

## 4. PRNG & Determinism Analysis (Critical Verification)

- **Randomness Source**: `resolvePatchQuality` calls `prng.nextInt(1, 6)`.
- **Global RNG Audit**: In the target architecture, `globalRNG` (`src/core/RandomService.ts`) is the authoritative deterministic PRNG instance.
- **Purity & Replay Preservation**:
  - `calculateRefund` is 100% mathematically pure (0 dependencies).
  - `resolvePatchQuality` receives an explicit PRNG interface (`prng: { nextInt(min: number, max: number): number }`).
  - By injecting `globalRNG` at the Engine facade boundary, replay determinism (`ReplayValidator.ts`) is **100% preserved**.
- **Determinism Verdict**: **SAFE FOR DETERMINISTIC REPLAY** when PRNG is explicitly injected from `globalRNG`.

---

## 5. Target State & Data Compatibility

- **`CampaignState` (`src/types.ts`)**:
  - `ResourcePatch` already contains `quality: 'Common' | 'High-Grade' | 'Superb'`, `tier`, `yieldPerDay`, `incomePerDay`.
  - `WeeklyLedger.expenseDetail.construction` tracks construction expenditure.
  - `Holdings.granaryUpgrade` tracks building state.
- **Target Catalogs (`src/data.ts`)**:
  - Static specifications for holding types (`Bastion`, `Castle`, `Fortified Town`, `Walled City`) and resource patches (`Grain Field`, `Iron Mine`, `Timber Camp`, `Stone Quarry`) exist in `src/data.ts`.

---

## 6. Infrastructure Coupling Audit

- `git grep` on `ConstructionService.ts` confirms **0 SQLite, 0 EventStore, 0 File I/O, 0 HTTP** dependencies.
- CQRS commands (`UpgradeResourcePatchCommand`, `StartConstructionCommand`) contain SQLite/EventStore repositories and are **REJECTED**.

---

## 7. Proposed Minimal Migration Scope

### Components to Migrate:
1. **`src/domain/kingdom/services/ConstructionService.ts`**: Pure calculation service for refund math and PRNG patch quality determination.

### Engine Integration (`src/engine.ts`):
- Export facade functions:
  - `calculateConstructionRefund(costSd, costTimber, costStone)`
  - `resolveResourcePatchQuality(prng?: { nextInt(min: number, max: number): number })`

### Components to Exclude:
- CQRS commands, repositories, and disk catalog readers.

---

## 8. Risk Assessment

- **Determinism Risk**: **LOW** (explicit PRNG injection via `globalRNG`).
- **Replay Risk**: **LOW** (no unseeded PRNG or hidden state).
- **Integration Risk**: **LOW** (pure calculation service with 2 small methods).

---

## 9. Architectural Classification

**CLASSIFICATION: B — MINIMAL ADAPTATION** (Pure domain service requiring explicit PRNG dependency injection for determinism).

---

## 10. Final Readiness Verdict

**STATUS: READY WITH CONDITIONS**

**Condition**: `resolvePatchQuality` must receive deterministic PRNG injection (`globalRNG`) from the Engine boundary to preserve 100% snapshot replayability.

Kingdom Construction is READY for explicit human approval before implementation.
