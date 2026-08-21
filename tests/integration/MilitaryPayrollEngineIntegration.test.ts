import * as assert from 'assert';
import { calculateMilitaryWages, resolveTroopDesertion, resolveWeeklyTurn, createInitialState } from '../../src/engine';

async function runTests() {
  console.log("🧪 Running Military Payroll Engine Integration Tests...");

  try {
    // 1. Engine Facade calculateMilitaryWages
    console.log("  - Testing calculateMilitaryWages Engine facade...");
    const facadeResult = calculateMilitaryWages([{ size: 50 }, { size: 30 }], 100);
    assert.strictEqual(facadeResult.armyWages, 8);
    assert.strictEqual(facadeResult.garrisonWages, 5);
    assert.strictEqual(facadeResult.totalWages, 13);

    // 2. Engine Facade resolveTroopDesertion with globalRNG
    console.log("  - Testing resolveTroopDesertion Engine facade with globalRNG...");
    const facadeDesertion0 = resolveTroopDesertion(0);
    assert.strictEqual(facadeDesertion0.deserted, false);

    const facadeDesertion1 = resolveTroopDesertion(1);
    assert.strictEqual(typeof facadeDesertion1.deserted, 'boolean');
    assert.strictEqual(typeof facadeDesertion1.deserterCount, 'number');

    // 3. Integrated resolveWeeklyTurn execution
    console.log("  - Testing resolveWeeklyTurn integrated execution on CampaignState...");
    const state = createInitialState(null, 'Oakhaven');
    state.weeklyLedger.silverdew = 1000;
    state.weeklyLedger.food = 1000;
    state.army.units = [
      { id: "u1", name: "Infantry", type: "Infantry", size: 50, maxSize: 50, tier: 1, ac: 10, weapon: "Spear", mount: "None", morale: 5 },
      { id: "u2", name: "Archers", type: "Archers", size: 50, maxSize: 50, tier: 1, ac: 10, weapon: "Bow", mount: "None", morale: 5 }
    ];
    state.holdings.garrison = 100;

    const initialSd = state.weeklyLedger.silverdew;
    const { updatedState, turnResult } = resolveWeeklyTurn(state);

    assert.ok(turnResult.militaryChanges.wagesPaid > 0);
    assert.strictEqual(updatedState.weeklyLedger.unpaidWagesTicks, 0);
    const totalIncome = turnResult.incomeChanges.holdings + turnResult.incomeChanges.patches;
    assert.strictEqual(
      updatedState.weeklyLedger.silverdew,
      initialSd + totalIncome - turnResult.militaryChanges.wagesPaid
    );

    console.log("  ✅ Military Payroll Engine Integration Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Military Payroll Integration Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
