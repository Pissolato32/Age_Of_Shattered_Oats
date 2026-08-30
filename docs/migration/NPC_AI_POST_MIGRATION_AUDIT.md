# NPC AI Post-Migration Audit

## 1. Git State
- **Branch**: `integration/legacy-consolidation`
- **Commit**: `370f91b` (`feat: integrate npc commander AI into combat`)
- **Status**: Clean working tree. Remote `origin/integration/legacy-consolidation` up-to-date. `main` untouched.

---

## 2. Integrity of Migrated Code
- **`src/domain/npc_ai/CommanderAIService.ts`**: Byte-for-byte identical (`0 diff`) to `legacy/main:src/domain/npc_ai/CommanderAIService.ts`.
- **Preserved Rule Evaluation**: Morale thresholds (<=25, <=10, <=40), fear triggers (`Encirclement`, `Loss`), half-strength fallbacks, and temperament rules (`Aggressive`, `Disciplined`, `Cunning`, `Loyal`, `Proud`, `Wary`) remain 100% intact.

---

## 3. Engine Integration & Boundary
- **Engine Authority**: `resolveNpcCombatAction(enemyUnit, playerUnit, customProfile?, options?)` in `src/engine.ts` owns the tactical decision lifecycle.
- **UI Boundary**: `ActivePlay.tsx` calls `resolveNpcCombatAction(e, p)` across the Engine boundary. Zero NPC decision rules exist in UI.

---

## 4. Tactical Mapping
- `Charge` → `'Charge'` (Engine applies +2 attack dice).
- `Attack` → `'Keep Attacking'` (Engine standard attack pool).
- `Defend` → `'Defend'` (Engine reduces enemy attack pool by 1).
- `Traps` → `'Defend'` (Mapped defensively; safe fallback for current engine combat).
- `Rearguard` → `'Defend'` (Mapped defensively; safe fallback for current engine combat).
- `Retreat` → `'Defend'` (Mapped defensively; safe fallback for current engine combat).
- **Classification**: **LOW RISK / KNOWN LIMITATION**. Full tactical maneuvers (e.g. battlefield traps or strategic withdrawal) can be added to `simulateCombatRound()` in future engine releases.

---

## 5. Randomness & Determinism Audit
- **`src/domain/npc_ai`**: **0 RNG calls**. 100% deterministic decision layer.
- **UI Action Choice**: Unconditioned `globalRNG.pick` removed from `ActivePlay.tsx`.
- **Combat Resolution**: Dice rolling in `simulateCombatRound()` continues using Engine's `globalRNG` deterministically.

---

## 6. Duplicate Logic Audit
- **`git grep` search**: `CommanderAIService` is the sole source of NPC tactical decisions across the codebase. Zero duplicate implementation exists.

---

## 7. Context & Profile Derivation
- `buildCombatContext(enemyUnit, playerUnit)` safely calculates `hpPercent` (0..100) and scales `unit.morale` (1..10 -> 0..100).
- `getEffectiveCommanderProfile(enemyUnit, customProfile?)` derives effective commander profiles deterministically based on unit attributes without polluting `CampaignState`.

---

## 8. Test, Build & Replay Results
- `npm test`: **PASSED (100%)**
- `npm run build`: **PASSED (0 errors)**
- `npx tsx src/tools/ReplayValidator.ts`: **PASSED (10/10 snapshots deterministic)**
- `npx tsx tests/domain/NpcAi.test.ts`: **PASSED (100%)**
- `npx tsx tests/integration/NpcAiEngineIntegration.test.ts`: **PASSED (100%)**

---

## 9. Limitations & Severity
- `Retreat` / `Traps` / `Rearguard` → `'Defend'` mapping: **LOW SEVERITY / KNOWN LIMITATION**. Safe, non-breaking fallback.

---

## 10. Audit Conclusion

**NPC AI POST-MIGRATION STATUS**: **PASS WITH LIMITATIONS**

**SAFE TO SELECT FOURTH DOMAIN**: **YES**
