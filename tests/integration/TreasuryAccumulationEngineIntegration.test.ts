import * as assert from 'assert';
import { createInitialState, resolveWeeklyTurn } from '../../src/engine';
import { CampaignState } from '../../src/types';

export function runTreasuryAccumulationEngineIntegrationTests() {
  console.log("🧪 Running Treasury & Food Accumulation Engine Integration Tests...");

  // 1. Single Week Balance Test: treasury_next = treasury_current + income - expenses
  console.log("  - Testing 1-week treasury accumulation accounting formula...");
  {
    const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
    state.weeklyLedger.silverdew = 500;
    state.weeklyLedger.food = 200;
    state.army.units = [
      { id: "u1", name: "Infantry", type: "Infantry", size: 50, maxSize: 50, tier: 1, ac: 10, weapon: "Spear", mount: "None", morale: 5 }
    ];
    state.holdings.garrison = 20; // total military = 70 soldiers

    // Total wages for 70 soldiers @ 0.5 SD/soldier = 35 SD
    // Total food consumption for 70 soldiers @ 1 FSU / 100 soldiers = 0.7 FSU
    const startingSd = state.weeklyLedger.silverdew;
    const { updatedState, turnResult } = resolveWeeklyTurn(state);

    const holdingIncome = turnResult.incomeChanges.holdings;
    const patchIncome = turnResult.incomeChanges.patches;
    const totalIncome = holdingIncome + patchIncome;
    const wagesPaid = turnResult.militaryChanges.wagesPaid;

    const expectedSd = startingSd + totalIncome - wagesPaid;
    assert.strictEqual(
      updatedState.weeklyLedger.silverdew,
      expectedSd,
      `Expected treasury to be ${expectedSd} SD, but got ${updatedState.weeklyLedger.silverdew} SD`
    );
    assert.ok(updatedState.weeklyLedger.silverdew > startingSd || totalIncome < wagesPaid);
  }

  // 2. Multi-Week Accumulation Test: 10 consecutive weeks showing growth
  console.log("  - Testing 10-week consecutive treasury growth (no collapse to wages)...");
  {
    let state: CampaignState = createInitialState("Merchant Sovereign", "Central Plains");
    state.weeklyLedger.silverdew = 300;
    state.weeklyLedger.food = 500;
    state.army.units = [
      { id: "u1", name: "Infantry", type: "Infantry", size: 20, maxSize: 20, tier: 1, ac: 10, weapon: "Spear", mount: "None", morale: 5 }
    ];
    state.holdings.garrison = 10; // total military = 30 soldiers (wages = 15 SD/week)

    const initialSd = state.weeklyLedger.silverdew;
    let accumulatedIncome = 0;
    let accumulatedWages = 0;

    for (let week = 1; week <= 10; week++) {
      const turn = resolveWeeklyTurn(state);
      state = turn.updatedState;
      accumulatedIncome += turn.turnResult.incomeChanges.holdings + turn.turnResult.incomeChanges.patches;
      accumulatedWages += turn.turnResult.militaryChanges.wagesPaid;
    }

    const expectedFinalSd = initialSd + accumulatedIncome - accumulatedWages;
    assert.strictEqual(
      state.weeklyLedger.silverdew,
      expectedFinalSd,
      `Multi-week treasury mismatch: expected ${expectedFinalSd}, got ${state.weeklyLedger.silverdew}`
    );
    // Crucial check: treasury must NOT collapse to ~15 SD
    assert.ok(
      state.weeklyLedger.silverdew > 300,
      `Treasury should have accumulated above starting 300 SD, actual: ${state.weeklyLedger.silverdew}`
    );
  }

  // 3. Default / Deficit Test: expenses exceed treasury
  console.log("  - Testing treasury default when expenses exceed balance...");
  {
    const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
    state.weeklyLedger.silverdew = 5; // very low treasury
    state.weeklyLedger.food = 100;
    state.holdings.type = "Hamlet"; // low income (25 / 4 = 6.25 -> 6.25 SD)
    state.holdings.resourcePatches = []; // 0 patch income
    state.army.units = [
      { id: "u1", name: "Infantry", type: "Infantry", size: 200, maxSize: 200, tier: 1, ac: 10, weapon: "Spear", mount: "None", morale: 5 }
    ];
    state.holdings.garrison = 100; // total military = 300 soldiers -> 150 SD wages

    const { updatedState } = resolveWeeklyTurn(state);

    // Should default: treasury reaches 0, unpaid wages ticks increment
    assert.strictEqual(updatedState.weeklyLedger.silverdew, 0);
    assert.strictEqual(updatedState.weeklyLedger.unpaidWagesTicks, 1);
  }

  // 4. Multi-Week Food Accumulation and Consumption Test
  console.log("  - Testing multi-week food reserve deduction and accumulation...");
  {
    let state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
    state.weeklyLedger.food = 100;
    state.weeklyLedger.silverdew = 1000;
    state.army.units = [
      { id: "u1", name: "Infantry", type: "Infantry", size: 100, maxSize: 100, tier: 1, ac: 10, weapon: "Spear", mount: "None", morale: 5 }
    ];
    state.holdings.garrison = 0; // 100 soldiers = 1.0 FSU/week
    state.holdings.resourcePatches = []; // no food production

    const initialFood = state.weeklyLedger.food;
    for (let week = 1; week <= 5; week++) {
      const turn = resolveWeeklyTurn(state);
      state = turn.updatedState;
    }

    // 5 weeks * 1.0 FSU = 5.0 FSU consumed
    assert.strictEqual(state.weeklyLedger.food, initialFood - 5.0);
    assert.strictEqual(state.weeklyLedger.famineTicks, 0);
  }

  console.log("  ✅ Treasury & Food Accumulation Integration Tests Passed Successfully!");
}

runTreasuryAccumulationEngineIntegrationTests();
