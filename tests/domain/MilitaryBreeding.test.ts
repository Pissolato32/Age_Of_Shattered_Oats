import * as assert from 'assert';
import { BreedingService } from '../../src/domain/military/services/BreedingService';

async function runTests() {
  console.log("🧪 Starting Military Breeding Domain Unit Tests...");

  try {
    // 1. Region Normalization
    console.log("  - Testing normalizeRegionName...");
    assert.strictEqual(BreedingService.normalizeRegionName("Valenfort"), "southern mountains");
    assert.strictEqual(BreedingService.normalizeRegionName("Southern Mountains"), "southern mountains");
    assert.strictEqual(BreedingService.normalizeRegionName("Western Rivers"), "western rivers");
    assert.strictEqual(BreedingService.normalizeRegionName("Nomad Steppe"), "nomad steppe");
    assert.strictEqual(BreedingService.normalizeRegionName("Central Plains"), "central plains");

    // 2. Native Region Breeding (no penalty)
    console.log("  - Testing native region breeding (no penalty)...");
    const nativeRate = BreedingService.calculateSuccessRate(0.80, "Southern Mountains", "courser", "Southern Mountains", 3);
    assert.strictEqual(nativeRate, 0.80);

    // 3. Any Region Specs
    console.log("  - Testing wildcard primary regions...");
    const wildcard1 = BreedingService.calculateSuccessRate(0.75, "Any settled region", "riding_horse", "Western Rivers", 2);
    assert.strictEqual(wildcard1, 0.75);

    // 4. Non-Native Region Penalty (-25%)
    console.log("  - Testing non-native region penalty (-25%)...");
    const nonNativeRate = BreedingService.calculateSuccessRate(0.80, "Southern Mountains", "courser", "Central Plains", 3);
    assert.strictEqual(nonNativeRate, 0.55); // 0.80 - 0.25 = 0.55

    // 5. Destrier Capital Penalty (holdingTier < 5)
    console.log("  - Testing Destrier capital penalty (tier < 5)...");
    const destrierSmallHolding = BreedingService.calculateSuccessRate(0.80, "Great Lords, Capitals", "destrier", "Central Plains", 3);
    assert.strictEqual(destrierSmallHolding, 0.60); // 0.80 - 0.20 = 0.60

    const destrierCapitalHolding = BreedingService.calculateSuccessRate(0.80, "Great Lords, Capitals", "destrier", "Central Plains", 5);
    assert.strictEqual(destrierCapitalHolding, 0.80); // Tier 5: no penalty

    // 6. Combined Penalties & Clamping (min 0.10)
    console.log("  - Testing combined penalties and clamping (min 0.10)...");
    const clampedRate = BreedingService.calculateSuccessRate(0.30, "Southern Mountains", "destrier", "Central Plains", 2);
    // base 0.30 - 0.25 (non-native) = 0.05 -> clamped to 0.10, then - 0.20 = -0.10 -> clamped to 0.10
    assert.strictEqual(clampedRate, 0.10);

    console.log("🎉 All Military Breeding Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Military Breeding Unit Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
