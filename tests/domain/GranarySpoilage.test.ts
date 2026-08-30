import * as assert from 'assert';
import { FoodService, GRANARY_CAPACITY } from '../../src/domain/kingdom/services/FoodService';
import { createInitialState, resolveWeeklyTurn } from '../../src/engine';
import { CampaignState } from '../../src/types';

export function runGranarySpoilageTests() {
  console.log("🧪 Running Granary Capacity & Spoilage Domain & Integration Unit Tests (M18.3 - Bloco B)...");

  // 1. Exact canonical granary capacities per tier
  console.log("  - Testing exact canonical granary capacities per tier...");
  assert.strictEqual(FoodService.getGranaryCapacity('Bastion'), 50.0, "Bastion granary capacity must be 50.0 FSU");
  assert.strictEqual(FoodService.getGranaryCapacity('Fortified Town'), 100.0, "Fortified Town granary capacity must be 100.0 FSU");
  assert.strictEqual(FoodService.getGranaryCapacity('Castle'), 150.0, "Castle granary capacity must be 150.0 FSU");
  assert.strictEqual(FoodService.getGranaryCapacity('Walled City'), 300.0, "Walled City granary capacity must be 300.0 FSU");
  assert.strictEqual(FoodService.getGranaryCapacity('UnknownHolding'), 50.0, "Unknown holding default capacity must be 50.0 FSU");

  // 2. Pure Unit Spoilage Formula Tests
  console.log("  - Testing excess spoilage calculation: 0 loss when under capacity, 25% loss on excess...");
  {
    // A) Under capacity (40 FSU in 50 FSU capacity)
    const underRes = FoodService.calculateExcessSpoilage(40.0, 50.0);
    assert.strictEqual(underRes.spoiledFsu, 0, "No food should spoil when under capacity");
    assert.strictEqual(underRes.preservedFsu, 40.0, "100% food preserved when under capacity");

    // B) Exactly at capacity (50 FSU in 50 FSU capacity)
    const exactRes = FoodService.calculateExcessSpoilage(50.0, 50.0);
    assert.strictEqual(exactRes.spoiledFsu, 0, "No food should spoil when exactly at capacity");
    assert.strictEqual(exactRes.preservedFsu, 50.0, "100% food preserved when exactly at capacity");

    // C) Over capacity (90 FSU in 50 FSU capacity -> excess 40 FSU * 0.25 = 10 FSU spoiled)
    const overRes = FoodService.calculateExcessSpoilage(90.0, 50.0);
    assert.strictEqual(overRes.spoiledFsu, 10.0, "Expected 10.0 FSU spoiled (25% of 40 FSU excess)");
    assert.strictEqual(overRes.preservedFsu, 80.0, "Expected 80.0 FSU preserved (90 - 10)");
  }

  // 3. Integration with resolveWeeklyTurn in Engine
  console.log("  - Testing resolveWeeklyTurn granary spoilage execution on CampaignState...");
  {
    const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
    state.holdings.type = "Bastion"; // 50 FSU capacity
    state.holdings.resourcePatches = []; // 0 food yield
    state.army.units = []; // 0 consumption
    state.holdings.garrison = 0;
    state.weeklyLedger.food = 90.0; // 40 FSU excess

    const { updatedState } = resolveWeeklyTurn(state);

    // Initial 90 FSU -> 0 production - 0 consumption -> 40 excess -> 10 spoiled -> final 80.0 FSU
    assert.strictEqual(updatedState.weeklyLedger.food, 80.0, `Food should be 80.0 FSU after 25% excess spoilage, got ${updatedState.weeklyLedger.food}`);
  }

  // 4. Multi-Week Spoilage Convergence Test: Food converges gracefully toward capacity
  console.log("  - Testing 20-week convergence towards granary capacity ceiling...");
  {
    let state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
    state.holdings.type = "Bastion"; // 50 FSU capacity
    state.holdings.resourcePatches = [
      { id: "p1", name: "Campos de Trigo", type: "Grain Field", tier: 1, quality: "Common", incomePerDay: 2, yieldPerDay: 0.5, laborRequired: 20 }
    ]; // +3.5 FSU/week
    state.army.units = [
      { id: "u1", name: "Retinue", size: 20, maxSize: 20, tier: 1, ac: 3, weapon: "Spear", mount: "None", morale: 5, type: "Levy" }
    ]; // -0.2 FSU/week consumption
    state.holdings.garrison = 0;
    state.weeklyLedger.food = 100.0; // Starts over capacity

    for (let w = 1; w <= 20; w++) {
      const turn = resolveWeeklyTurn(state);
      state = turn.updatedState;
    }

    // After 20 weeks with +3.3 net production/week and 25% excess decay, food must stabilize near ~60 FSU
    assert.ok(
      state.weeklyLedger.food >= 50.0 && state.weeklyLedger.food <= 65.0,
      `Food reserve should stabilize in 50-65 FSU range, actual: ${state.weeklyLedger.food}`
    );
  }

  console.log("  ✅ All Granary Capacity & Spoilage Domain & Integration Unit Tests Passed Successfully!\n");
}

runGranarySpoilageTests();
