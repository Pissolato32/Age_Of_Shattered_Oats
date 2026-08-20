# Post-Consolidation Architecture Audit (5 Migrated Domains)

## 1. Executive Summary
This audit evaluates the architectural health, domain purity, Engine boundary compliance, and documentation organization of `Age_Of_Shattered_Oats` following the successful migration and integration of five core domain models (`character`, `relationship`, `npc_ai`, `visibility`, `commerce`).

---

## 2. Status of Migrated Domains

| Domain | Files in `src/domain/` | Engine Boundary in `src/engine.ts` | UI Consumer in `ActivePlay.tsx` | Pure & Deterministic |
|---|---|---|---|---|
| **`character`** | `src/domain/character/Character.ts` | Initial state & state mutations | Character sheet & stat renders | Yes (100%) |
| **`relationship`** | `src/domain/relationship/Relationship.ts`, `MemoryLog.ts` | `adjustHouseOpinion()`, `setHouseOpinion()` | Opinion updates & council lobbying | Yes (100%) |
| **`npc_ai`** | `src/domain/npc_ai/CommanderAIService.ts` | `resolveNpcCombatAction()`, `buildCombatContext()` | Dynamic NPC tactical choices in combat | Yes (100%) |
| **`visibility`** | `src/domain/visibility/VisibilityService.ts` | `isEventVisibleToObserver()`, `getVisibleWorldSecrets()` | Secret & rumor fog-of-war filtering | Yes (100%) |
| **`commerce`** | `src/domain/commerce/services/MarketService.ts` | `calculateMaterialPrice()`, `getMonthNumberFromName()` | Supply caravan trade pricing & returns | Yes (100%) |

---

## 3. Key Architectural Findings

### A. Engine Boundary & Facade Architecture (`src/engine.ts`)
- **Current State**: `src/engine.ts` stands at 1,195 lines.
- **Evaluation**: The Golden Rule (*GAME ENGINE = SINGLE SOURCE OF TRUTH*) is strictly preserved. All UI actions in `ActivePlay.tsx` route through `src/engine.ts` entrypoints.
- **Observation**: Domain adapter helpers (`normalizeLocationToHub`, `getMonthNumberFromName`, `getAbsoluteCampaignTurn`) are currently collocated at the top of `src/engine.ts`.
- **Recommendation**: Keep `engine.ts` as the single public API facade. If file size grows past 1,500 lines, extract helper adapters into internal modules (`src/engine/adapters/`) without changing the public exported function signatures.

### B. UI Layer Decoupling (`src/components/ActivePlay.tsx`)
- **Current State**: `ActivePlay.tsx` stands at 2,915 lines.
- **Evaluation**: Zero domain calculation logic remains in `ActivePlay.tsx`. It relies exclusively on Engine functions (`adjustHouseOpinion`, `resolveNpcCombatAction`, `getVisibleWorldSecrets`, `calculateMaterialPrice`).
- **Recommendation**: 100% compliant with sensory post-processing design principles.

### C. Domain Model Purity & Determinism Audit
- **Audit Result**: `git grep` on `src/domain/` for `Math.random`, `globalRNG`, `Date.now`, `new Date`, `performance.now`, `fs.`, `sqlite`, `typeorm`, `EventStore`, `SnapshotStore` returned **0 violations**.
- **Replay Validator**: `npx tsx src/tools/ReplayValidator.ts` passes 10/10 snapshot checkpoints deterministically.

### D. Documentation Promotion Candidates
The process documents in `docs/migration/` are currently serving as supporting evidence. Upon completion of the consolidation phase, the following migration reports are recommended for promotion to permanent domain documentation:
- `docs/migration/RELATIONSHIP_MIGRATION_REPORT.md` $\rightarrow$ Proposed for `docs/domains/RELATIONSHIP.md`
- `docs/migration/NPC_AI_MIGRATION_REPORT.md` $\rightarrow$ Proposed for `docs/domains/NPC_AI.md`
- `docs/migration/VISIBILITY_MIGRATION_REPORT.md` $\rightarrow$ Proposed for `docs/domains/VISIBILITY.md`
- `docs/migration/COMMERCE_MIGRATION_REPORT.md` $\rightarrow$ Proposed for `docs/domains/COMMERCE.md`

> [!NOTE]
> All process documents remain in `docs/migration/` during active consolidation and are not moved automatically.

---

## 4. Next Domain Strategy Recommendations
1. **Defer `core/TimeService` Standalone Migration**: The target's inline calendar representation and `getMonthNumberFromName()` adapter in `src/engine.ts` already cover time translation requirements cleanly without needing to load legacy `TimeService` infrastructure.
2. **Target Domain candidates for Next Phase**:
   - `items` (`CombatStatsCalculator.ts` pure stat derivation formulas)
   - `crime` (Ransom and escape difficulty calculators)
   - `holdings` (Pure holding production models)
