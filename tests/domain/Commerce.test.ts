import * as assert from 'assert';
import { MarketService } from '../../src/domain/commerce/services/MarketService';

async function runTests() {
  console.log("🧪 Starting Commerce Domain Unit Tests...");

  try {
    const market = new MarketService();

    // 1. Regional Demand Multipliers
    console.log("  - Testing Regional Demand Multipliers...");
    // southern_mountains: grain base demand mod +1.5 -> demandMultiplier = 2.5
    // Month 5 (Greening = Primavera): season mod = -0.2
    // Stock 0 / Capacity 150 = ratio 0 -> saturationMod = 1.1
    // Final: Base 1 * (2.5 - 0.2) * 1.1 = 1 * 2.3 * 1.1 = 2.53
    const resGrainSummer = market.calculatePrice(1, 'grain', 'southern_mountains', 5, 0, 150);
    assert.strictEqual(resGrainSummer.demandMultiplier, 2.5);
    assert.strictEqual(resGrainSummer.seasonalModifier, -0.2);
    assert.strictEqual(resGrainSummer.saturationModifier, 1.1);
    assert.strictEqual(resGrainSummer.finalPrice, 2.53);

    // 2. Winter Scarcity
    console.log("  - Testing Winter Scarcity (+50% grain)...");
    // Month 1 (Frostwane = Inverno): season mod = +0.5
    // Final: Base 1 * (2.5 + 0.5) * 1.1 = 1 * 3.0 * 1.1 = 3.3
    const resGrainWinter = market.calculatePrice(1, 'grain', 'southern_mountains', 1, 0, 150);
    assert.strictEqual(resGrainWinter.seasonalModifier, 0.5);
    assert.strictEqual(resGrainWinter.finalPrice, 3.3);

    // 3. Saturation Levels
    console.log("  - Testing Saturation Modifiers (Glut vs Scarcity)...");
    // Stock 200 / 150 = ratio 1.33 (> 1.00) -> saturationMod = 0.4
    // Base 5 * (iron demand mod -0.2 -> demandMultiplier 0.8) * 0.4 = 5 * 0.8 * 0.4 = 1.6
    const resIronGlut = market.calculatePrice(5, 'iron', 'southern_mountains', 5, 200, 150);
    assert.strictEqual(resIronGlut.saturationModifier, 0.4);
    assert.strictEqual(resIronGlut.finalPrice, 1.6);

    // Stock 50 / 150 = ratio 0.33 (<= 0.50) -> saturationMod = 1.0
    // Base 15 * (furs demand mod +0.75 -> demandMultiplier 1.75) * 1.0 = 15 * 1.75 * 1.0 = 26.25
    const resFursNormal = market.calculatePrice(15, 'furs', 'southern_mountains', 5, 50, 150);
    assert.strictEqual(resFursNormal.saturationModifier, 1.0);
    assert.strictEqual(resFursNormal.finalPrice, 26.25);

    // 4. Minimum Price Floor Clamp (0.1 SD)
    console.log("  - Testing Minimum Price Floor Clamp (0.1 SD)...");
    const resTiny = market.calculatePrice(0.01, 'grain', 'western_rivers', 5, 500, 150);
    assert.strictEqual(resTiny.finalPrice, 0.1);

    // 5. Unknown Region & Material Fallback
    console.log("  - Testing Unknown Fallbacks...");
    const resUnknown = market.calculatePrice(10, 'unknown_item', 'unknown_region', 5, 0, 150);
    assert.strictEqual(resUnknown.demandMultiplier, 1.0);
    assert.strictEqual(resUnknown.seasonalModifier, 0.0);
    assert.strictEqual(resUnknown.finalPrice, 11.0); // 10 * (1 + 0) * 1.1 = 11.0

    console.log("🎉 All Commerce Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Commerce Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
