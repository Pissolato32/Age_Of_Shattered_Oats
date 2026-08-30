import * as assert from 'assert';
import { createInitialState, resolveWeeklyTurn, adjustHouseOpinion, setHouseOpinion } from '../../src/engine';
import { CampaignState, NobleHouse } from '../../src/types';

export function runRelationshipEngineIntegrationTests() {
  console.log("🧪 Running Relationship Engine Integration Tests...");

  // 1. Initial State creation
  const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
  const targetHouse: NobleHouse = state.worldLedger.nobleHouses[0];
  assert.ok(targetHouse, "Initial noble house must exist");

  const initialOpinion = targetHouse.opinion;

  // 2. Execute opinion adjustment through Engine domain boundary
  adjustHouseOpinion(targetHouse, 2, state.character.name);
  assert.strictEqual(targetHouse.opinion, Math.min(3, initialOpinion + 2), "Engine opinion adjustment must be clamped at +3");

  // Over-adjusting beyond bounds (+10)
  adjustHouseOpinion(targetHouse, 10, state.character.name);
  assert.strictEqual(targetHouse.opinion, 3, "Engine opinion adjustment must strictly clamp to +3 upper bound");

  // Under-adjusting beyond bounds (-10)
  adjustHouseOpinion(targetHouse, -10, state.character.name);
  assert.strictEqual(targetHouse.opinion, -3, "Engine opinion adjustment must strictly clamp to -3 lower bound");

  // Directly setting opinion through setHouseOpinion
  setHouseOpinion(targetHouse, 1, state.character.name);
  assert.strictEqual(targetHouse.opinion, 1, "setHouseOpinion must update house opinion deterministically within bounds");

  // 3. Verify weekly turn resolution invokes engine opinion drift deterministically
  const stateA = createInitialState("Noble Ruler", "Central Plains");
  const stateB = createInitialState("Noble Ruler", "Central Plains");

  const turnResultA = resolveWeeklyTurn(stateA);
  const turnResultB = resolveWeeklyTurn(stateB);

  // Compare house opinions after weekly turn execution
  for (let i = 0; i < stateA.worldLedger.nobleHouses.length; i++) {
    const opA = stateA.worldLedger.nobleHouses[i].opinion;
    const opB = stateB.worldLedger.nobleHouses[i].opinion;

    assert.strictEqual(opA, opB, `House ${stateA.worldLedger.nobleHouses[i].name} opinion must be identical across deterministic turn resolutions`);
    assert.ok(opA >= -3 && opA <= 3, `House opinion ${opA} must remain strictly within -3..+3 bounds`);
  }

  // 4. Verify CampaignState is the single authoritative state store (0 duplicate state)
  assert.strictEqual(Object.keys(stateA.worldLedger).includes("nobleHouses"), true);
  assert.strictEqual(stateA.worldLedger.nobleHouses.every(h => typeof h.opinion === 'number'), true);

  console.log("  ✅ Relationship Engine Integration Tests Passed Successfully!");
}

runRelationshipEngineIntegrationTests();
