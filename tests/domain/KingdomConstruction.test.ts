import * as assert from 'assert';
import { ConstructionService, PRNGProvider } from '../../src/domain/kingdom/services/ConstructionService';

async function runTests() {
  console.log("🧪 Starting Kingdom Construction Domain Unit Tests...");

  try {
    // 1. Construction Refund Tests
    console.log("  - Testing 50% construction refund calculation & Math.floor rounding...");
    const refundEven = ConstructionService.calculateRefund(100, 50, 40);
    assert.strictEqual(refundEven.refundSd, 50);
    assert.strictEqual(refundEven.refundTimber, 25);
    assert.strictEqual(refundEven.refundStone, 20);

    const refundOdd = ConstructionService.calculateRefund(15, 7, 1);
    assert.strictEqual(refundOdd.refundSd, 7); // Math.floor(7.5)
    assert.strictEqual(refundOdd.refundTimber, 3); // Math.floor(3.5)
    assert.strictEqual(refundOdd.refundStone, 0); // Math.floor(0.5)

    const refundZero = ConstructionService.calculateRefund(0, 0, 0);
    assert.strictEqual(refundZero.refundSd, 0);
    assert.strictEqual(refundZero.refundTimber, 0);
    assert.strictEqual(refundZero.refundStone, 0);

    // 2. Resource Patch Quality Roll Tests (Rule G.3)
    console.log("  - Testing resource patch quality 1d6 rolls (Rule G.3)...");

    const createMockPrng = (fixedRoll: number): PRNGProvider => ({
      nextInt: (_min: number, _max: number) => fixedRoll,
    });

    // Roll 1..3 => Common
    assert.strictEqual(ConstructionService.resolvePatchQuality(createMockPrng(1)), 'Common');
    assert.strictEqual(ConstructionService.resolvePatchQuality(createMockPrng(2)), 'Common');
    assert.strictEqual(ConstructionService.resolvePatchQuality(createMockPrng(3)), 'Common');

    // Roll 4..5 => High-Grade
    assert.strictEqual(ConstructionService.resolvePatchQuality(createMockPrng(4)), 'High-Grade');
    assert.strictEqual(ConstructionService.resolvePatchQuality(createMockPrng(5)), 'High-Grade');

    // Roll 6 => Superb
    assert.strictEqual(ConstructionService.resolvePatchQuality(createMockPrng(6)), 'Superb');

    // Instance method compatibility test
    const instance = new ConstructionService();
    assert.strictEqual(instance.resolvePatchQuality(createMockPrng(6)), 'Superb');
    assert.deepStrictEqual(instance.calculateRefund(10, 10, 10), { refundSd: 5, refundTimber: 5, refundStone: 5 });

    console.log("🎉 All Kingdom Construction Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Kingdom Construction Unit Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
