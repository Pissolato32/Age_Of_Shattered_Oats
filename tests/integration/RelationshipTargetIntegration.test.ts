import * as assert from 'assert';
import { createInitialState } from '../../src/engine';
import { Relationship } from '../../src/domain/relationship/Relationship';
import { MemoryLog } from '../../src/domain/relationship/MemoryLog';
import { CampaignState, NobleHouse } from '../../src/types';

export function runRelationshipTargetIntegrationTests() {
  console.log("🧪 Running Target Relationship Integration Tests...");

  const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
  const targetHouse = state.worldLedger.nobleHouses[0];
  assert.ok(targetHouse, "Initial noble house should exist");

  // 1. Verify opinion bounds clamping (-3 to +3) with target NobleHouse data
  const rel = new Relationship({
    sourceId: state.character.name,
    targetId: targetHouse.name,
    opinion: targetHouse.opinion,
    relationshipType: "Vassal"
  });

  // Clamping upper bound (+3)
  rel.adjustOpinion(10);
  assert.strictEqual(rel.opinion, 3);
  targetHouse.opinion = rel.opinion;
  assert.strictEqual(targetHouse.opinion, 3);

  // Clamping lower bound (-3)
  rel.adjustOpinion(-10);
  assert.strictEqual(rel.opinion, -3);
  targetHouse.opinion = rel.opinion;
  assert.strictEqual(targetHouse.opinion, -3);

  // Reset to neutral
  rel.adjustOpinion(3);
  assert.strictEqual(rel.opinion, 0);

  // 2. Verify Vow expiration behavior
  rel.recordVow("AlliancePact", 50);
  const activeVowsBefore = rel.checkVowsExpired(49);
  assert.strictEqual(activeVowsBefore.length, 0);

  const expiredVowsAt50 = rel.checkVowsExpired(50);
  assert.strictEqual(expiredVowsAt50.length, 1);
  assert.strictEqual(expiredVowsAt50[0].type, "AlliancePact");
  assert.strictEqual(expiredVowsAt50[0].active, false);

  // 3. Verify Memory Log decay behavior over time
  const memory = new MemoryLog({
    id: "mem_target_001",
    ownerId: state.character.name,
    subjectId: targetHouse.name,
    description: "Formed diplomatic pact at Highsun",
    importance: 3, // 3 * 30 = 90 ticks limit
    tickRegistered: 10
  });

  assert.strictEqual(memory.evaluateDecay(99), false);
  assert.strictEqual(memory.evaluateDecay(100), true);

  // 4. Deterministic repeated execution check
  const stateCopy1 = JSON.parse(JSON.stringify(state));
  const stateCopy2 = JSON.parse(JSON.stringify(state));
  
  const rel1 = new Relationship({ sourceId: "A", targetId: "B", opinion: stateCopy1.worldLedger.nobleHouses[0].opinion, relationshipType: "Ally" });
  const rel2 = new Relationship({ sourceId: "A", targetId: "B", opinion: stateCopy2.worldLedger.nobleHouses[0].opinion, relationshipType: "Ally" });

  rel1.adjustOpinion(2);
  rel2.adjustOpinion(2);

  assert.strictEqual(rel1.opinion, rel2.opinion);
  assert.strictEqual(JSON.stringify(rel1), JSON.stringify(rel2));

  console.log("  ✅ Target Relationship Integration Tests Passed!");
}

runRelationshipTargetIntegrationTests();

