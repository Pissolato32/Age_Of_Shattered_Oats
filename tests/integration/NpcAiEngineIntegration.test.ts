import * as assert from 'assert';
import {
  createInitialState,
  resolveNpcCombatAction,
  buildCombatContext,
  mapTacticToEngineAction,
  getEffectiveCommanderProfile,
} from '../../src/engine';
import { ArmyUnit, CampaignState } from '../../src/types';

export function runNpcAiEngineIntegrationTests() {
  console.log("🧪 Running NPC AI Engine Integration Tests...");

  const playerUnit: ArmyUnit = {
    id: "p1",
    name: "Landed Retinue",
    size: 50,
    maxSize: 60,
    tier: 1,
    ac: 3,
    weapon: "Spear",
    mount: "None",
    morale: 8,
  };

  const enemyAggressive: ArmyUnit = {
    id: "e1",
    name: "Free Company Swords",
    size: 60,
    maxSize: 60,
    tier: 2,
    ac: 3,
    weapon: "Swords",
    mount: "None",
    morale: 8,
  };

  // A. Aggressive profile in favorable condition -> Charge
  const actionAggressive = resolveNpcCombatAction(enemyAggressive, playerUnit, { temperament: 'Aggressive' });
  assert.strictEqual(actionAggressive, 'Charge', "Aggressive commander in favorable conditions should choose Charge");

  // B. Low morale (morale <= 2.5 on 1..10 scale) -> Defend (mapped from Retreat)
  const enemyLowMorale: ArmyUnit = { ...enemyAggressive, morale: 2 };
  const actionLowMorale = resolveNpcCombatAction(enemyLowMorale, playerUnit, { temperament: 'Aggressive' });
  assert.strictEqual(actionLowMorale, 'Defend', "Low morale enemy commander should resolve to Defend (Retreat mapping)");

  // C. Numerical disadvantage with Wary profile -> Defend (mapped from Rearguard)
  const enemyWaryOutnumbered: ArmyUnit = { ...enemyAggressive, size: 20 };
  const actionWaryOutnumbered = resolveNpcCombatAction(enemyWaryOutnumbered, playerUnit, { temperament: 'Wary' });
  assert.strictEqual(actionWaryOutnumbered, 'Defend', "Wary outnumbered commander should resolve to Defend (Rearguard mapping)");

  // D. Fear trigger (Encirclement fear when outnumbered) -> Defend (mapped from Retreat)
  const fearAction = resolveNpcCombatAction(
    enemyWaryOutnumbered,
    playerUnit,
    { temperament: 'Cunning', fear: 'Encirclement' },
    { fearTriggered: true }
  );
  assert.strictEqual(fearAction, 'Defend', "Fear of encirclement when outnumbered should trigger defensive withdrawal");

  // E. Deterministic consistency: same context + same profile -> exact same result across executions
  const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
  const initialHouseJson = JSON.stringify(state.worldLedger.nobleHouses);

  for (let i = 0; i < 10; i++) {
    const act1 = resolveNpcCombatAction(enemyAggressive, playerUnit, { temperament: 'Disciplined' });
    const act2 = resolveNpcCombatAction(enemyAggressive, playerUnit, { temperament: 'Disciplined' });
    assert.strictEqual(act1, 'Defend');
    assert.strictEqual(act1, act2, "NPC AI decision must be 100% deterministic across repeated calls");
  }

  // F. Confirm state immutability: resolveNpcCombatAction must NOT mutate CampaignState
  assert.strictEqual(JSON.stringify(state.worldLedger.nobleHouses), initialHouseJson, "resolveNpcCombatAction must not mutate CampaignState");

  console.log("  ✅ NPC AI Engine Integration Tests Passed Successfully!");
}

runNpcAiEngineIntegrationTests();
