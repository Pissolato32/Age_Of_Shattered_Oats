import * as assert from 'assert';
import {
  createInitialState,
  getMonthNumberFromName,
  calculateMaterialPrice,
} from '../../src/engine';
import { CampaignState } from '../../src/types';

export function runCommerceEngineIntegrationTests() {
  console.log("🧪 Running Commerce Engine Integration Tests...");

  // 1. Month Name Adapter
  console.log("  - Testing Month Name Adapter...");
  assert.strictEqual(getMonthNumberFromName("Frostwane"), 1);
  assert.strictEqual(getMonthNumberFromName("Deepfrost"), 2);
  assert.strictEqual(getMonthNumberFromName("Thawrise"), 3);
  assert.strictEqual(getMonthNumberFromName("Greening"), 4);
  assert.strictEqual(getMonthNumberFromName("Highsun_1"), 5);
  assert.strictEqual(getMonthNumberFromName("Highsun_2"), 6);
  assert.strictEqual(getMonthNumberFromName("Harvestfall_1"), 7);
  assert.strictEqual(getMonthNumberFromName("Harvestfall_2"), 8);
  assert.strictEqual(getMonthNumberFromName("Ashfall_1"), 9);
  assert.strictEqual(getMonthNumberFromName("Ashfall_2"), 10);
  assert.strictEqual(getMonthNumberFromName("Longdark_1"), 11);
  assert.strictEqual(getMonthNumberFromName("Longdark_2"), 12);

  // 2. Engine Boundary calculateMaterialPrice
  console.log("  - Testing Engine Boundary calculateMaterialPrice...");
  const state: CampaignState = createInitialState("Noble Ruler", "Southern Mountains");
  state.worldLedger.currentDate.month = "Frostwane"; // Winter month (1)

  const initialJson = JSON.stringify(state.worldLedger);

  // Grain in Southern Mountains during Winter (Frostwane):
  // Base 1 * (Demand 2.5 + Season 0.5) * Saturation 1.1 = 3.3
  const winterGrain = calculateMaterialPrice(1, 'grain', state.character.location.region, state.worldLedger.currentDate.month);
  assert.strictEqual(winterGrain.finalPrice, 3.3);

  // Change season to Greening (Spring - month 4)
  state.worldLedger.currentDate.month = "Greening";
  // Grain in Southern Mountains during Spring (Greening):
  // Base 1 * (Demand 2.5 - Season 0.2) * Saturation 1.1 = 2.53
  const springGrain = calculateMaterialPrice(1, 'grain', state.character.location.region, state.worldLedger.currentDate.month);
  assert.strictEqual(springGrain.finalPrice, 2.53);

  // 3. State Immutability
  state.worldLedger.currentDate.month = "Frostwane";
  assert.strictEqual(JSON.stringify(state.worldLedger), initialJson, "calculateMaterialPrice must not mutate CampaignState");

  console.log("  ✅ Commerce Engine Integration Tests Passed Successfully!");
}

runCommerceEngineIntegrationTests();
