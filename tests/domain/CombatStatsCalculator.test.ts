import * as assert from 'assert';
import { CombatStatsCalculator } from '../../src/domain/items/CombatStatsCalculator';

async function runTests() {
  console.log("🧪 Starting CombatStatsCalculator Domain Unit Tests...");

  try {
    // 1. Unarmored Baseline (Cloth)
    console.log("  - Testing Unarmored / Cloth Baseline...");
    const charCloth = { stats: { baseInitiative: 0, armor: 'cloth', shield: 'none', mount: 'none' } };
    assert.strictEqual(CombatStatsCalculator.calculateAC(charCloth), 2);
    assert.strictEqual(CombatStatsCalculator.calculateInitiative(charCloth), 1);

    // 2. Leather Armor
    console.log("  - Testing Leather Armor...");
    const charLeather = { stats: { baseInitiative: 0, armor: 'leather' } };
    assert.strictEqual(CombatStatsCalculator.calculateAC(charLeather), 3);
    assert.strictEqual(CombatStatsCalculator.calculateInitiative(charLeather), 0);

    // 3. Chain Armor
    console.log("  - Testing Chain Armor...");
    const charChain = { stats: { baseInitiative: 0, armor: 'chain' } };
    assert.strictEqual(CombatStatsCalculator.calculateAC(charChain), 4);
    assert.strictEqual(CombatStatsCalculator.calculateInitiative(charChain), -1);

    // 4. Plate Armor
    console.log("  - Testing Plate Armor...");
    const charPlate = { stats: { baseInitiative: 0, armor: 'plate' } };
    assert.strictEqual(CombatStatsCalculator.calculateAC(charPlate), 5);
    assert.strictEqual(CombatStatsCalculator.calculateInitiative(charPlate), -2);

    // 5. Plate + Tower Shield
    console.log("  - Testing Plate + Tower Shield...");
    const charPlateTower = { stats: { baseInitiative: 0, armor: 'plate', shield: 'tower_shield' } };
    assert.strictEqual(CombatStatsCalculator.calculateAC(charPlateTower), 6);
    assert.strictEqual(CombatStatsCalculator.calculateInitiative(charPlateTower), -3);

    // 6. Plate + Tower Shield + Courser Mount (+2 Init)
    console.log("  - Testing Mount Initiative Bonus (Courser)...");
    const charMount = { stats: { baseInitiative: 0, armor: 'plate', shield: 'tower_shield', mount: 'courser' } };
    assert.strictEqual(CombatStatsCalculator.calculateAC(charMount), 6);
    assert.strictEqual(CombatStatsCalculator.calculateInitiative(charMount), -1); // -3 + 2 = -1

    // 7. Plate + Tower Shield + Injured Courser Mount (-1 Penalty)
    console.log("  - Testing Injured Mount Penalty (-1)...");
    const charInjuredMount = { stats: { baseInitiative: 0, armor: 'plate', shield: 'tower_shield', mount: 'courser', mountInjured: true } };
    assert.strictEqual(CombatStatsCalculator.calculateAC(charInjuredMount), 6);
    assert.strictEqual(CombatStatsCalculator.calculateInitiative(charInjuredMount), -2); // -1 - 1 = -2

    // 8. Unknown / Default Equipment Fallback
    console.log("  - Testing Unknown Equipment Fallback...");
    const charUnknown = { stats: { baseInitiative: 0, armor: 'unknown_armor', shield: 'unknown_shield' } };
    assert.strictEqual(CombatStatsCalculator.calculateAC(charUnknown), 2);
    assert.strictEqual(CombatStatsCalculator.calculateInitiative(charUnknown), 1);

    // 9. CombatStatsCalculator.calculateStats
    console.log("  - Testing CombatStatsCalculator.calculateStats helper...");
    const fullStats = CombatStatsCalculator.calculateStats(charPlateTower);
    assert.strictEqual(fullStats.ac, 6);
    assert.strictEqual(fullStats.initiativeBonus, -3);

    console.log("🎉 All CombatStatsCalculator Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ CombatStatsCalculator Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
