import { Relationship } from '../../src/domain/relationship/Relationship';
import { MemoryLog } from '../../src/domain/relationship/MemoryLog';
import * as assert from 'assert';

/**
 * Domain tests for relationships, vows, and memory decay systems.
 * 
 * @rule-test relationship.opinion
 * @rule-test relationship.vows
 * @rule-test relationship.memory
 */
async function runTests() {
  console.log("🧪 Starting Relationship & Memory Domain Unit Tests...");

  try {
    // 1. Test Opinion Clamping
    console.log("  - Testing Opinion Clamping bounds...");
    const rel = new Relationship({
      sourceId: "char-abc",
      targetId: "char-xyz",
      opinion: 0,
      relationshipType: "Neutral"
    });

    rel.adjustOpinion(2);
    assert.strictEqual(rel.opinion, 2);

    rel.adjustOpinion(2); // 2 + 2 = 4 -> Clamped to 3
    assert.strictEqual(rel.opinion, 3);

    rel.adjustOpinion(-10); // 3 - 10 = -7 -> Clamped to -3
    assert.strictEqual(rel.opinion, -3);
    console.log("    ✅ Opinion clamping validated.");

    // 2. Test Vows Deadlines
    console.log("  - Testing Vow Deadlines and Expirations...");
    const relVow = new Relationship({
      sourceId: "char-abc",
      targetId: "char-xyz",
      opinion: 1,
      relationshipType: "Ally"
    });

    // Record a vow expiring at tick 120
    relVow.recordVow("TradeAgreement", 120);
    assert.strictEqual(relVow.stateJson.vows.length, 1);
    assert.strictEqual(relVow.stateJson.vows[0].type, "TradeAgreement");
    assert.strictEqual(relVow.stateJson.vows[0].active, true);

    // Check expiration at tick 119 (should remain active)
    const expired119 = relVow.checkVowsExpired(119);
    assert.strictEqual(expired119.length, 0);
    assert.strictEqual(relVow.stateJson.vows[0].active, true);

    // Check expiration at tick 120 (should expire)
    const expired120 = relVow.checkVowsExpired(120);
    assert.strictEqual(expired120.length, 1);
    assert.strictEqual(expired120[0].type, "TradeAgreement");
    assert.strictEqual(relVow.stateJson.vows[0].active, false);
    console.log("    ✅ Vow expirations validated.");

    // 3. Test Memory Decays
    console.log("  - Testing Memory decay limits...");
    // Memory with importance 2 (should decay after 2 * 30 = 60 ticks)
    const mem = new MemoryLog({
      id: "mem-001",
      ownerId: "char-abc",
      subjectId: "char-xyz",
      description: "Lended 50 SD coins",
      importance: 2,
      tickRegistered: 100
    });

    // At tick 159 (elapsed = 59 ticks, below limit 60)
    const decayed159 = mem.evaluateDecay(159);
    assert.strictEqual(decayed159, false);
    assert.strictEqual(mem.decayed, false);

    // At tick 160 (elapsed = 60 ticks, hits limit)
    const decayed160 = mem.evaluateDecay(160);
    assert.strictEqual(decayed160, true);
    assert.strictEqual(mem.decayed, true);
    console.log("    ✅ Memory decays validated.");

    console.log("🎉 All Relationship & Memory Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Relationship & Memory Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
