import * as assert from 'assert';
import { calculateMountBreedingSuccessRate } from '../../src/engine';

async function runTests() {
  console.log("🧪 Running Military Breeding Engine Integration Tests...");

  try {
    // 1. Engine Facade calculateMountBreedingSuccessRate
    console.log("  - Testing calculateMountBreedingSuccessRate Engine facade...");
    const nativeRate = calculateMountBreedingSuccessRate(0.80, "Southern Mountains", "courser", "Southern Mountains", 3);
    assert.strictEqual(nativeRate, 0.80);

    const nonNativeRate = calculateMountBreedingSuccessRate(0.80, "Southern Mountains", "courser", "Central Plains", 3);
    assert.strictEqual(nonNativeRate, 0.55);

    const destrierCapitalRate = calculateMountBreedingSuccessRate(0.80, "Great Lords, Capitals", "destrier", "Central Plains", 5);
    assert.strictEqual(destrierCapitalRate, 0.80);

    // Deterministic repeatability test
    const repeatRate = calculateMountBreedingSuccessRate(0.80, "Southern Mountains", "courser", "Central Plains", 3);
    assert.strictEqual(repeatRate, nonNativeRate);

    console.log("  ✅ Military Breeding Engine Integration Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Military Breeding Integration Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
