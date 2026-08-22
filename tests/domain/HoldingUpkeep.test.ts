import * as assert from 'assert';
import { ProductionService, HOLDING_UPKEEP_PER_WEEK } from '../../src/domain/kingdom/services/ProductionService';
import { createInitialState, resolveWeeklyTurn } from '../../src/engine';
import { CampaignState } from '../../src/types';

export function runHoldingUpkeepTests() {
  console.log("🧪 Running Holding Upkeep Domain & Integration Unit Tests (M18.3 - Bloco A)...");

  // 1. Exact canonical upkeep constants per tier
  console.log("  - Testing exact canonical holding upkeep values per tier...");
  assert.strictEqual(ProductionService.getHoldingUpkeepPerWeek('Bastion'), 70, "Bastion upkeep must be exactly 70 SD");
  assert.strictEqual(ProductionService.getHoldingUpkeepPerWeek('Fortified Town'), 130, "Fortified Town upkeep must be exactly 130 SD");
  assert.strictEqual(ProductionService.getHoldingUpkeepPerWeek('Castle'), 190, "Castle upkeep must be exactly 190 SD");
  assert.strictEqual(ProductionService.getHoldingUpkeepPerWeek('Walled City'), 300, "Walled City upkeep must be exactly 300 SD");
  assert.strictEqual(ProductionService.getHoldingUpkeepPerWeek('NonExistentHolding'), 0, "Unknown holding must have 0 SD upkeep");

  // 2. Integration with Weekly Turn: verify exact deduction and expenses logging for each tier
  const tiers: Array<{ type: 'Bastion' | 'Fortified Town' | 'Castle' | 'Walled City'; expectedIncome: number; expectedUpkeep: number }> = [
    { type: 'Bastion', expectedIncome: 75, expectedUpkeep: 70 },
    { type: 'Fortified Town', expectedIncome: 150, expectedUpkeep: 130 },
    { type: 'Castle', expectedIncome: 225, expectedUpkeep: 190 },
    { type: 'Walled City', expectedIncome: 375, expectedUpkeep: 300 }
  ];

  for (const t of tiers) {
    console.log(`  - Testing weekly turn deduction for ${t.type}...`);
    const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
    state.holdings.type = t.type;
    state.holdings.resourcePatches = []; // 0 patch income
    state.army.units = []; // 0 troops
    state.holdings.garrison = 0; // 0 garrison
    state.weeklyLedger.silverdew = 500;

    const startingSd = state.weeklyLedger.silverdew;
    const { updatedState, turnResult } = resolveWeeklyTurn(state);

    const holdingIncome = turnResult.incomeChanges.holdings;
    const holdingMaintenance = updatedState.weeklyLedger.expenseDetail.holdingMaintenance;

    assert.strictEqual(holdingIncome, t.expectedIncome, `Holding income for ${t.type} must match expected`);
    assert.strictEqual(holdingMaintenance, t.expectedUpkeep, `Holding upkeep in expenses ledger must be exactly ${t.expectedUpkeep}`);

    const expectedFinalSd = startingSd + holdingIncome - holdingMaintenance;
    assert.strictEqual(
      updatedState.weeklyLedger.silverdew,
      expectedFinalSd,
      `Final treasury for ${t.type} must equal starting (${startingSd}) + income (${holdingIncome}) - upkeep (${holdingMaintenance})`
    );
  }

  // 3. Exact M18.3 Baseline Test: Component-by-Component Net +22 SD/week validation
  console.log("  - Testing M18.3 baseline: Bastion + 2 patches + 4 SD military - 70 SD upkeep = +22 SD/week net...");
  {
    const state: CampaignState = createInitialState("Landed Knight", "Florestas do Rio");
    state.holdings.type = "Bastion";
    state.holdings.population = 400;
    state.holdings.resourcePatches = [
      { id: "p1", name: "Campos de Trigo", type: "Grain Field", tier: 1, quality: "Common", incomePerDay: 2, yieldPerDay: 0.5, laborRequired: 20 },
      { id: "p2", name: "Acampamento Madeireiro", type: "Timber Camp", tier: 1, quality: "Common", incomePerDay: 1, yieldPerDay: 2, laborRequired: 20 }
    ];
    state.army.units = [
      { id: "u1", name: "Garrison Retinue", size: 20, maxSize: 20, tier: 1, ac: 3, weapon: "Spears", mount: "None", morale: 5, type: "Levy" }
    ];
    state.holdings.garrison = 40; // 40 garrison guard @ 0.05 SD = 2 SD + 20 army levy @ 0.1 SD = 2 SD -> total = 4 SD
    state.weeklyLedger.silverdew = 300;

    const initialSilverdew = state.weeklyLedger.silverdew;
    const { updatedState, turnResult } = resolveWeeklyTurn(state);

    // Component-by-component extraction
    const holdingProduction = turnResult.incomeChanges.holdings; // 75 SD
    const patchProduction = turnResult.incomeChanges.patches;     // 21 SD (14 + 7)
    const militaryPayroll = turnResult.militaryChanges.wagesPaid; // 4 SD
    const holdingMaintenance = updatedState.weeklyLedger.expenseDetail.holdingMaintenance; // 70 SD
    const otherExistingExpenses = 0;

    assert.strictEqual(holdingProduction, 75, "Bastion holding production must be 75 SD");
    assert.strictEqual(patchProduction, 21, "2 patches production must be 21 SD");
    assert.strictEqual(militaryPayroll, 4, "40 troops/garrison wages must be 4 SD");
    assert.strictEqual(holdingMaintenance, 70, "Holding maintenance must be 70 SD");

    const netWeeklyDelta = holdingProduction + patchProduction - militaryPayroll - holdingMaintenance - otherExistingExpenses;
    assert.strictEqual(netWeeklyDelta, 22, "Net weekly delta MUST be exactly +22 SD/week");

    const expectedFinalSilverdew = initialSilverdew + netWeeklyDelta;
    assert.strictEqual(
      updatedState.weeklyLedger.silverdew,
      expectedFinalSilverdew,
      `Treasury must be exactly initial (300) + net delta (+22) = 322 SD. Got ${updatedState.weeklyLedger.silverdew} SD`
    );
  }

  // 4. No Double Charging Test: Upkeep is applied exactly once per weekly turn
  console.log("  - Testing no double charging across multiple consecutive turns...");
  {
    let state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
    state.holdings.type = "Bastion";
    state.holdings.resourcePatches = [];
    state.army.units = [];
    state.holdings.garrison = 0;
    state.weeklyLedger.silverdew = 500;

    for (let w = 1; w <= 4; w++) {
      const startSd = state.weeklyLedger.silverdew;
      const turn = resolveWeeklyTurn(state);
      state = turn.updatedState;
      const expectedEndSd = startSd + 75 - 70; // +5 SD net per week without patches
      assert.strictEqual(state.weeklyLedger.silverdew, expectedEndSd, `Turn ${w} must only deduct 70 SD upkeep once`);
    }
  }

  console.log("  ✅ All Holding Upkeep Domain & Integration Unit Tests Passed Successfully!\n");
}

runHoldingUpkeepTests();
