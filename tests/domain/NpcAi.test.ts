import * as assert from 'assert';
import { CommanderAIService, CombatContext, CommanderProfile } from '../../src/domain/npc_ai/CommanderAIService';

async function runTests() {
  console.log("🧪 Starting NPC Commander AI Unit Tests...");

  try {
    const ai = new CommanderAIService();

    const normalContext: CombatContext = {
      hpPercent: 100,
      morale: 80,
      isOutnumbered: false,
      isHalfStrength: false,
      isAllyRetreating: false,
      terrainAdvantage: false,
      fearTriggered: false
    };

    // 1. Aggressive Temperament
    console.log("  - Testing Aggressive Temperament...");
    const aggressive: CommanderProfile = { temperament: 'Aggressive', priority: 'Glory', fear: 'Cavalry' };
    assert.strictEqual(ai.selectCombatTactic(normalContext, aggressive), 'Charge');

    const aggressiveOutnumbered: CombatContext = { ...normalContext, isOutnumbered: true };
    assert.strictEqual(ai.selectCombatTactic(aggressiveOutnumbered, aggressive), 'Attack');

    // 2. Disciplined Temperament
    console.log("  - Testing Disciplined Temperament...");
    const disciplined: CommanderProfile = { temperament: 'Disciplined', priority: 'Orders', fear: 'Fire' };
    assert.strictEqual(ai.selectCombatTactic(normalContext, disciplined), 'Defend');

    // 3. Cunning Temperament
    console.log("  - Testing Cunning Temperament...");
    const cunning: CommanderProfile = { temperament: 'Cunning', priority: 'Victory', fear: 'Encirclement' };
    assert.strictEqual(ai.selectCombatTactic(normalContext, cunning), 'Attack');
    const cunningTerrain: CombatContext = { ...normalContext, terrainAdvantage: true };
    assert.strictEqual(ai.selectCombatTactic(cunningTerrain, cunning), 'Traps');

    // 4. Loyal Temperament
    console.log("  - Testing Loyal Temperament...");
    const loyal: CommanderProfile = { temperament: 'Loyal', priority: 'Orders', fear: 'Loss' };
    assert.strictEqual(ai.selectCombatTactic(normalContext, loyal), 'Attack');
    const loyalRetreating: CombatContext = { ...normalContext, isAllyRetreating: true };
    assert.strictEqual(ai.selectCombatTactic(loyalRetreating, loyal), 'Retreat');

    // 5. Proud Temperament
    console.log("  - Testing Proud Temperament...");
    const proud: CommanderProfile = { temperament: 'Proud', priority: 'Glory', fear: 'Darkness' };
    assert.strictEqual(ai.selectCombatTactic(normalContext, proud), 'Attack');
    assert.strictEqual(ai.selectCombatTactic(aggressiveOutnumbered, proud), 'Charge');

    // Proud resists retreat at low morale (<=25) until morale <= 10
    const proudLowMorale: CombatContext = { ...normalContext, morale: 20 };
    assert.strictEqual(ai.selectCombatTactic(proudLowMorale, proud), 'Defend');
    const proudCriticalMorale: CombatContext = { ...normalContext, morale: 10 };
    assert.strictEqual(ai.selectCombatTactic(proudCriticalMorale, proud), 'Retreat');

    // 6. Wary Temperament
    console.log("  - Testing Wary Temperament...");
    const wary: CommanderProfile = { temperament: 'Wary', priority: 'Survival', fear: 'Darkness' };
    assert.strictEqual(ai.selectCombatTactic(normalContext, wary), 'Defend');
    const waryEndangered: CombatContext = { ...normalContext, isHalfStrength: true, isOutnumbered: true };
    assert.strictEqual(ai.selectCombatTactic(waryEndangered, wary), 'Rearguard');

    // 7. Low Morale Triggers
    console.log("  - Testing Low Morale Triggers...");
    const lowMoraleContext: CombatContext = { ...normalContext, morale: 20 };
    assert.strictEqual(ai.selectCombatTactic(lowMoraleContext, aggressive), 'Retreat');

    // 8. Fear Triggers
    console.log("  - Testing Fear Triggers...");
    const fearContext: CombatContext = { ...normalContext, isOutnumbered: true, fearTriggered: true };
    const fearProfile: CommanderProfile = { temperament: 'Cunning', priority: 'Victory', fear: 'Encirclement' };
    assert.strictEqual(ai.selectCombatTactic(fearContext, fearProfile), 'Retreat');

    const lossFearContext: CombatContext = { ...normalContext, isAllyRetreating: true, fearTriggered: true };
    const lossFearProfile: CommanderProfile = { temperament: 'Disciplined', priority: 'Orders', fear: 'Loss' };
    assert.strictEqual(ai.selectCombatTactic(lossFearContext, lossFearProfile), 'Retreat');

    const panicFearContext: CombatContext = { ...normalContext, morale: 35, fearTriggered: true };
    assert.strictEqual(ai.selectCombatTactic(panicFearContext, aggressive), 'Retreat');

    console.log("🎉 All NPC Commander AI Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ NPC Commander AI Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
