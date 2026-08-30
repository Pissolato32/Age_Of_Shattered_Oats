# NPC AI Migration Report

## 1. Migrated Files
- `src/domain/npc_ai/CommanderAIService.ts` (Pure domain model copied directly from `legacy/main` resolving NPC tactical combat decisions).

---

## 2. Adapted Files
- `src/engine.ts`: Added NPC AI integration helpers:
  - `getEffectiveCommanderProfile(enemyUnit, customProfile?)`: Derives effective commander profiles deterministically.
  - `buildCombatContext(enemyUnit, playerUnit, options?)`: Assembles `CombatContext` from `ArmyUnit` size, maxSize, and morale (scaled 1..10 to 0..100).
  - `mapTacticToEngineAction(tactic)`: Maps legacy `CombatTactic` (`Charge`, `Attack`, `Defend`, `Traps`, `Rearguard`, `Retreat`) to target Engine actions (`Charge`, `Keep Attacking`, `Defend`).
  - `resolveNpcCombatAction(enemyUnit, playerUnit, customProfile?, options?)`: Primary Engine entrypoint for NPC combat tactical decisions.
- `src/components/ActivePlay.tsx`: Refactored combat round handler to delegate `aiAction` selection to `resolveNpcCombatAction(e, p)` instead of unconditioned `globalRNG.pick()`.
- `package.json`: Updated `npm test` script to include `tests/domain/NpcAi.test.ts` and `tests/integration/NpcAiEngineIntegration.test.ts`.

---

## 3. Legacy Logic Preserved
- `CommanderAIService.ts` internal rule evaluation logic preserved 100% without modification.
- Morale triggers (`morale <= 25` / `morale <= 10`), fear triggers (`Encirclement`, `Loss`, general panic `morale <= 40`), half-strength fallback, and temperament strategies (`Aggressive`, `Disciplined`, `Cunning`, `Loyal`, `Proud`, `Wary`) remain intact.

---

## 4. Engine Integration
- **Engine Authority**: `resolveNpcCombatAction()` in `src/engine.ts` owns the tactical resolution pipeline (`buildCombatContext` -> `CommanderAIService.selectCombatTactic` -> `mapTacticToEngineAction`).
- **State Mutability**: `CommanderAIService` and `resolveNpcCombatAction` are 100% read-only and pure. Engine applies tactical results to `simulateCombatRound()` and `CampaignState`.

---

## 5. ActivePlay Integration
- Unconditioned `globalRNG.pick(['Keep Attacking', 'Defend', 'Charge'])` removed from `src/components/ActivePlay.tsx`.
- UI invokes `resolveNpcCombatAction(e, p)` through Engine boundary. 0 tactical decision logic remains in UI.

---

## 6. Tactical Mapping
- `Charge` -> `Charge` (+2 attack dice in `simulateCombatRound`).
- `Attack` -> `Keep Attacking` (Standard attack dice in `simulateCombatRound`).
- `Defend` -> `Defend` (Reduces opponent attack dice by 1 in `simulateCombatRound`).
- `Traps` -> `Defend` (Mapped defensively; tactical traps feature reserved for future engine extension).
- `Rearguard` -> `Defend` (Mapped defensively; rearguard feature reserved for future engine extension).
- `Retreat` -> `Defend` (Mapped defensively; full army withdrawal feature reserved for future engine extension).

---

## 7. Determinism
- `git grep -n -E "Math\.random|globalRNG|RandomService|Date\.now|new Date|performance\.now|randomUUID|fs\.|sqlite|typeorm|EventStore|SnapshotStore" -- src/domain/npc_ai` returned **0 matches**.
- `CommanderAIService` and `resolveNpcCombatAction` execute with 100% determinism.

---

## 8. Behavioral Change
- **Before**: NPC commanders chose combat actions completely at random (33.3% Charge, 33.3% Keep Attacking, 33.3% Defend).
- **After**: NPC commanders make personality- and context-aware tactical choices (e.g. Levy/low morale forces defend/withdraw; aggressive swordsmen charge; cunning commanders attack or setup traps).
- **Preserved Engine Math**: `simulateCombatRound()` formulas, casualty calculations, AC checks, dice pools, and global RNG rolls remain 100% unchanged.

---

## 9. Tests
- `tests/domain/NpcAi.test.ts` (Unit test suite validating all 6 temperaments, low morale triggers, fear triggers, and situational priorities).
- `tests/integration/NpcAiEngineIntegration.test.ts` (Engine integration suite validating context assembly, profile derivation, tactical mapping, deterministic execution, and state immutability).
- `npm test`: **PASSED (100%)** (GoldenScenarios, RelationshipAndMemory, RelationshipTargetIntegration, RelationshipEngineIntegration, NpcAi, NpcAiEngineIntegration, ReplayValidator).

---

## 10. Build & Replay
- `npm run build`: **PASSED (0 build errors)**.
- `npx tsx src/tools/ReplayValidator.ts`: **PASSED (10/10 snapshots deterministic)**.

---

## 11. Known Limitations
- `Retreat`, `Traps`, and `Rearguard` legacy tactics currently map to `Defend` in `simulateCombatRound()` because target engine mass combat currently supports 3 core actions (`Keep Attacking`, `Defend`, `Charge`). Full tactical maneuvers (e.g. battlefield traps or strategic retreat) can be expanded in `simulateCombatRound()` in future milestones.
