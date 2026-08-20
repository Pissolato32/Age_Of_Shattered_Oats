import * as assert from 'assert';
import { calculateConstructionRefund, resolveResourcePatchQuality } from '../../src/engine';
import { globalRNG } from '../../src/core/RandomService';

export function runKingdomConstructionEngineIntegrationTests() {
  console.log("🧪 Running Kingdom Construction Engine Integration Tests...");

  // 1. Test calculateConstructionRefund facade
  console.log("  - Testing calculateConstructionRefund Engine facade...");
  const refund = calculateConstructionRefund(200, 100, 50);
  assert.strictEqual(refund.refundSd, 100);
  assert.strictEqual(refund.refundTimber, 50);
  assert.strictEqual(refund.refundStone, 25);

  // 2. Test resolveResourcePatchQuality facade with globalRNG
  console.log("  - Testing resolveResourcePatchQuality Engine facade with globalRNG...");
  const quality = resolveResourcePatchQuality(globalRNG);
  assert.ok(['Common', 'High-Grade', 'Superb'].includes(quality));

  console.log("  ✅ Kingdom Construction Engine Integration Tests Passed Successfully!");
}

runKingdomConstructionEngineIntegrationTests();
