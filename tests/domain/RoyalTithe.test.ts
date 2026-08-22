import * as assert from 'assert';
import { TreasuryService, ROYAL_TITHE_THRESHOLD, ROYAL_TITHE_RATE } from '../../src/domain/kingdom/services/TreasuryService';
import { createInitialState, resolveWeeklyTurn } from '../../src/engine';
import { CampaignState } from '../../src/types';

export function runRoyalTitheTests() {
  console.log("🧪 Running Royal Tithe / Wealth Friction Domain & Integration Unit Tests (M18.3 - Bloco C)...");

  // 1. Exact canonical constants
  console.log("  - Testing canonical Royal Tithe constants...");
  assert.strictEqual(ROYAL_TITHE_THRESHOLD, 2000, "Royal Tithe threshold must be exactly 2000 SD");
  assert.strictEqual(ROYAL_TITHE_RATE, 0.08, "Royal Tithe rate must be exactly 8% (0.08)");

  // 2. Pure Unit Tests for calculateRoyalTithe
  console.log("  - Testing calculateRoyalTithe formula: 0 tax <= 2000 SD, 8% strictly on excess...");
  {
    // A) Under threshold (1500 SD)
    const under = TreasuryService.calculateRoyalTithe(1500);
    assert.strictEqual(under.titheAmount, 0, "No tithe when under 2000 SD threshold");
    assert.strictEqual(under.remainingSilverdew, 1500, "Full treasury preserved under threshold");

    // B) Exactly at threshold (2000 SD)
    const exact = TreasuryService.calculateRoyalTithe(2000);
    assert.strictEqual(exact.titheAmount, 0, "No tithe when exactly at 2000 SD threshold");
    assert.strictEqual(exact.remainingSilverdew, 2000, "Full treasury preserved at threshold");

    // C) Over threshold (3000 SD -> excess 1000 SD * 0.08 = 80 SD)
    const over1 = TreasuryService.calculateRoyalTithe(3000);
    assert.strictEqual(over1.titheAmount, 80, "Expected 80 SD tithe (8% of 1000 SD excess)");
    assert.strictEqual(over1.remainingSilverdew, 2920, "Expected 2920 SD remaining treasury");

    // D) Large treasury (10000 SD -> excess 8000 SD * 0.08 = 640 SD)
    const over2 = TreasuryService.calculateRoyalTithe(10000);
    assert.strictEqual(over2.titheAmount, 640, "Expected 640 SD tithe (8% of 8000 SD excess)");
    assert.strictEqual(over2.remainingSilverdew, 9360, "Expected 9360 SD remaining treasury");
  }

  // 3. Integration with resolveWeeklyTurn in Engine: Annual Tick Trigger
  console.log("  - Testing annual trigger of Royal Tithe in resolveWeeklyTurn...");
  {
    const state: CampaignState = createInitialState("Landed Knight", "Florestas do Rio");
    state.holdings.type = "Bastion";
    state.weeklyLedger.silverdew = 5000; // 3000 SD excess -> 240 SD tithe
    // Set date to final week of the year (Week 4 of Longdark_2)
    state.worldLedger.currentDate.month = "Longdark_2";
    state.worldLedger.currentDate.week = 4;
    state.worldLedger.currentDate.year = 1;

    const initialSd = state.weeklyLedger.silverdew;
    const { updatedState, turnResult } = resolveWeeklyTurn(state);

    // New year must be Year 2
    assert.strictEqual(updatedState.worldLedger.currentDate.year, 2, "Year must advance to 2");

    // Tithe of 8% on (5000 - 2000) = 240 SD must be recorded in tributePaid
    assert.strictEqual(updatedState.weeklyLedger.expenseDetail.tributePaid, 240, "Tribute paid must record 240 SD tithe");

    // Verify presence in eventLog
    const hasTitheLog = turnResult.eventLog.some(log => log.includes("Dízimo Real da Coroa"));
    assert.ok(hasTitheLog, "Event log must record Royal Tithe collection");
  }

  // 4. Absence of Royal Tithe during regular intra-year weeks
  console.log("  - Testing that Royal Tithe is NOT applied during regular weeks...");
  {
    const state: CampaignState = createInitialState("Landed Knight", "Florestas do Rio");
    state.holdings.type = "Bastion";
    state.weeklyLedger.silverdew = 5000;
    state.worldLedger.currentDate.month = "Greening";
    state.worldLedger.currentDate.week = 2; // Mid-year week

    const { updatedState } = resolveWeeklyTurn(state);
    assert.strictEqual(updatedState.weeklyLedger.expenseDetail.tributePaid, 0, "No tithe should be charged in regular week");
  }

  console.log("  ✅ All Royal Tithe Domain & Integration Unit Tests Passed Successfully!\n");
}

runRoyalTitheTests();
