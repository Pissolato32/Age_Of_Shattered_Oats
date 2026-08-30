import * as assert from 'assert';
import {
  createInitialState,
  resolveWeeklyTurn,
  calculateWeeklyProduction,
  calculateFoodConsumption,
  calculateLaborCapacity,
} from '../../src/engine';
import { CampaignState } from '../../src/types';

export function runKingdomProductionEngineIntegrationTests() {
  console.log("🧪 Running Kingdom Production Engine Integration Tests...");

  // 1. Test calculateWeeklyProduction facade
  console.log("  - Testing calculateWeeklyProduction facade...");
  const holdingSpec = {
    holdingTier: 2, // Large Village (15 SD/day)
    fortificationTier: 1, // Watchtower (2.5 SD/day)
    resourcePatches: [{ type: 'grain_field', tier: 1 }], // 2.5 SD/day
    tradeIncomePerDay: 5
  };

  const productionSummer = calculateWeeklyProduction(holdingSpec, false);
  assert.strictEqual(productionSummer.holdingIncomeSD, 105); // 15 * 7
  assert.strictEqual(productionSummer.fortificationIncomeSD, 17.5); // 2.5 * 7
  assert.strictEqual(productionSummer.totalIncomeSD, 175); // (15 + 2.5 + 2.5 + 5) * 7 = 25 * 7 = 175

  // 2. Test calculateFoodConsumption facade
  console.log("  - Testing calculateFoodConsumption facade...");
  const foodDetails = calculateFoodConsumption(2000, 300);
  assert.strictEqual(foodDetails.civilianFsu, 2.0); // 2000 / 1000 = 2 FSU
  assert.strictEqual(foodDetails.militaryFsu, 3.0); // 300 / 100 = 3 FSU
  assert.strictEqual(foodDetails.totalFsu, 5.0);

  // 3. Test calculateLaborCapacity facade
  console.log("  - Testing calculateLaborCapacity facade...");
  const patches = [{ laborAllocated: 100 }, { laborAllocated: 150 }];
  const laborDetails = calculateLaborCapacity(1000, patches);
  assert.strictEqual(laborDetails.totalPool, 400); // 40% of 1000
  assert.strictEqual(laborDetails.allocated, 250);
  assert.strictEqual(laborDetails.available, 150);

  // 4. Test resolveWeeklyTurn integrated execution on CampaignState
  console.log("  - Testing resolveWeeklyTurn integrated execution on CampaignState...");
  const state: CampaignState = createInitialState("Merchant Sovereign", "Central Plains");
  const initialSilverdew = state.weeklyLedger.silverdew;
  const initialFood = state.weeklyLedger.food;

  const { updatedState, turnResult } = resolveWeeklyTurn(state);

  // Verify turnResult log and ledger modifications
  assert.ok(turnResult.eventLog.some(log => log.includes("Produção:")));
  assert.ok(typeof updatedState.weeklyLedger.silverdew === 'number');
  assert.ok(typeof updatedState.weeklyLedger.food === 'number');

  console.log("  ✅ Kingdom Production Engine Integration Tests Passed Successfully!");
}

runKingdomProductionEngineIntegrationTests();
