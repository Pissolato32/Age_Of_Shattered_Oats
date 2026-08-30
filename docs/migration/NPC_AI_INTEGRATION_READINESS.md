# NPC AI Integration Readiness

## 1. Legacy Service
`src/domain/npc_ai/CommanderAIService.ts` is a pure, deterministic rules engine that resolves tactical combat decisions for NPC commanders based on battlefield state and commander personality profiles.

### Core Signature
```ts
public selectCombatTactic(context: CombatContext, profile: CommanderProfile): CombatTactic
```

- **Input Types**:
  - `CombatContext`: `hpPercent` (0-100), `morale` (0-100), `isOutnumbered` (boolean), `isHalfStrength` (boolean), `isAllyRetreating` (boolean), `terrainAdvantage` (boolean), `fearTriggered` (boolean).
  - `CommanderProfile`: `temperament` ('Aggressive' | 'Disciplined' | 'Cunning' | 'Loyal' | 'Proud' | 'Wary'), `priority` ('Glory' | 'Survival' | 'Victory' | 'Orders'), `fear` ('Fire' | 'Cavalry' | 'Encirclement' | 'Loss' | 'Darkness').
- **Output Type**:
  - `CombatTactic`: `'Charge' | 'Attack' | 'Defend' | 'Traps' | 'Rearguard' | 'Retreat'`.
- **State & Side Effects**:
  - Zero mutable state, zero side effects, zero async operations, zero external imports.

---

## 2. Target Combat Architecture
- **Current Combat Flow in Target**:
  - `src/components/ActivePlay.tsx` manages combat round execution in `handleExecuteCombatRound`.
  - `simulateCombatRound(playerUnit, enemyUnit, playerAction, enemyAction)` in `src/engine.ts` executes dice rolls and casualty distribution.
  - Currently, `ActivePlay.tsx` selects `enemyAction` using **unconditioned random pick**:
    ```ts
    const actions: Array<'Keep Attacking' | 'Defend' | 'Charge'> = ['Keep Attacking', 'Defend', 'Charge'];
    const aiAction = globalRNG.pick(actions);
    ```
- **Architectural Deficiency in Target**: NPC actions are chosen randomly, completely ignoring unit morale, strength ratio, commander temperament, or tactical context.

---

## 3. Legacy → Target Mapping

| Legacy Concept | Target Equivalent | Current Status | Integration Action |
|---|---|---|---|
| `CommanderProfile` | `commanderTier` in `types.ts` (numeric tier 1–3) | Missing temperament, priority, and fear attributes | Export `CommanderProfile` interface in `types.ts` / `CommanderAIService.ts`. Provide `getDefaultCommanderProfile(unit)` helper in `engine.ts`. |
| `CombatContext` | `ArmyUnit` properties (`size`, `maxSize`, `morale`) | Properties exist on `ArmyUnit`, but no context assembler | Export `buildCombatContext(unit, opponentUnit, options)` helper in `engine.ts` translating `ArmyUnit` into `CombatContext`. |
| `CombatTactic` | `'Keep Attacking' \| 'Defend' \| 'Charge'` in `simulateCombatRound` | Partial overlap | Add `mapTacticToCombatAction(tactic)` helper in `engine.ts` mapping `'Charge' -> 'Charge'`, `'Attack' -> 'Keep Attacking'`, `'Defend' -> 'Defend'`, `'Traps' -> 'Defend'`, `'Rearguard' -> 'Defend'`, `'Retreat' -> 'Defend'`. |
| `selectCombatTactic()` | `globalRNG.pick(['Keep Attacking', 'Defend', 'Charge'])` in `ActivePlay.tsx` | Currently unconditioned RNG pick | Replace `globalRNG.pick` with Engine-owned `resolveNpcCombatAction(enemyUnit, playerUnit, profile?)`. |
| `morale` | `ArmyUnit.morale` (1..10 scale) | Present | Scale to 0–100 (`unit.morale * 10`) for `CombatContext`. |
| `hpPercent` / Strength | `ArmyUnit.size` / `ArmyUnit.maxSize` | Present | Calculate `Math.round((unit.size / unit.maxSize) * 100)`. |

---

## 4. Compatibility Analysis
- **`src/domain/npc_ai/CommanderAIService.ts`**: **100% Compatible (A — DIRECT REUSE)**. Pure TypeScript class with 0 external dependencies.
- **`tests/domain/NpcAndVisibility.test.ts` (NPC AI section)**: **100% Compatible (A — DIRECT REUSE)**. Validates tactical decision rules (Aggressive, Wary, Low Morale Retreat, Encirclement Fear).
- **`src/engine.ts`**: **B — MINIMAL ADAPTATION**. Add helper functions `buildCombatContext`, `mapTacticToCombatAction`, and `resolveNpcCombatAction`.
- **`src/components/ActivePlay.tsx`**: **B — MINIMAL ADAPTATION**. Replace `globalRNG.pick` call with Engine's `resolveNpcCombatAction`.

---

## 5. Exact Integration Point

### Primary Engine Integration Function (`src/engine.ts`)
```ts
export function resolveNpcCombatAction(
  enemyUnit: ArmyUnit,
  playerUnit: ArmyUnit,
  customProfile?: Partial<CommanderProfile>
): 'Keep Attacking' | 'Defend' | 'Charge' {
  const context = buildCombatContext(enemyUnit, playerUnit);
  const profile = getEffectiveCommanderProfile(enemyUnit, customProfile);
  const aiService = new CommanderAIService();
  const tactic = aiService.selectCombatTactic(context, profile);
  return mapTacticToEngineAction(tactic);
}
```

### Flow Diagram
```
ActivePlay (handleExecuteCombatRound)
        ↓
resolveNpcCombatAction(enemyUnit, playerUnit) [src/engine.ts]
        ↓
CommanderAIService.selectCombatTactic(context, profile) [src/domain/npc_ai]
        ↓
mapTacticToEngineAction() -> 'Keep Attacking' | 'Defend' | 'Charge'
        ↓
simulateCombatRound(playerUnit, enemyUnit, playerAction, enemyAction)
        ↓
CampaignState mutation & combat log update
```

---

## 6. Determinism Audit
- **`Math.random()`**: NONE
- **`Date.now()` / `new Date()`**: NONE
- **`randomUUID()`**: NONE
- **Filesystem I/O**: NONE
- **Database / Network**: NONE
- **Global State Mutations**: NONE

`CommanderAIService` is 100% deterministic and pure.

---

## 7. Required Changes for Migration

1. **New Files to Add**:
   - `src/domain/npc_ai/CommanderAIService.ts` (Copied from `legacy/main`)
   - `tests/domain/NpcAi.test.ts` (Isolated NPC AI unit test copied from `legacy/main:tests/domain/NpcAndVisibility.test.ts`)
   - `tests/integration/NpcAiEngineIntegration.test.ts` (New Engine-level integration test)

2. **Files to Adapt**:
   - `src/engine.ts`: Import `CommanderAIService` and export `resolveNpcCombatAction`, `buildCombatContext`, `mapTacticToEngineAction`.
   - `src/components/ActivePlay.tsx`: Import `resolveNpcCombatAction` from `../engine` and replace `globalRNG.pick(actions)` at line 417.
   - `package.json`: Include `NpcAi.test.ts` and `NpcAiEngineIntegration.test.ts` in `npm test`.

---

## 8. Migration Classification

| Component | Classification | Justification |
|---|---|---|
| `CommanderAIService.ts` | **A — DIRECT REUSE** | Pure domain class, 0 dependencies, 100% deterministic |
| NPC AI Unit Test | **A — DIRECT REUSE** | Pure unit test suite, runs in <5ms |
| Engine Combat Helper | **B — MINIMAL ADAPTATION** | Bridge function adapting `ArmyUnit` to `CombatContext` |
| ActivePlay Invocation | **B — MINIMAL ADAPTATION** | Replaces unconditioned `globalRNG.pick` with Engine decision call |

---

## 9. Risk
**LOW RISK**  
- Does not change engine combat dice math (`simulateCombatRound`).
- Replaces unconditioned random NPC picks with deterministic tactical decision making.
- Maintains single source of truth (`CampaignState` owned by Engine).

---

## 10. Recommendation
**NPC AI INTEGRATION: READY**  
Proceed with the controlled migration and engine integration of `CommanderAIService`.
