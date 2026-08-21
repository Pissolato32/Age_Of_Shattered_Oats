import * as assert from 'assert';
import {
  createInitialState,
  getAbsoluteCampaignTurn,
  normalizeLocationToHub,
  isEventVisibleToObserver,
  getVisibleWorldSecrets,
} from '../../src/engine';
import { CampaignState } from '../../src/types';

export function runVisibilityEngineIntegrationTests() {
  console.log("🧪 Running Visibility Engine Integration Tests...");

  // 1. Test Absolute Campaign Turn Calculation
  console.log("  - Testing Campaign Turn Conversion...");
  assert.strictEqual(getAbsoluteCampaignTurn(342, 1), 1);
  assert.strictEqual(getAbsoluteCampaignTurn(342, 52), 52);
  assert.strictEqual(getAbsoluteCampaignTurn(343, 1), 53);

  // 2. Test Location Normalization
  console.log("  - Testing Landmark Location Normalization...");
  assert.strictEqual(normalizeLocationToHub("Valenfort Citadel"), "valenfort");
  assert.strictEqual(normalizeLocationToHub("Blackmoor Keep"), "blackmoor");
  assert.strictEqual(normalizeLocationToHub("Harvel Pass"), "harvel");
  assert.strictEqual(normalizeLocationToHub("Royal Capital"), "capital");

  // 3. Test Event Visibility Checks
  console.log("  - Testing Event Visibility Propagation...");
  // Local event (Valenfort to Valenfort, turn 1, eventTurn 1) -> immediately visible
  assert.strictEqual(isEventVisibleToObserver("Valenfort Citadel", "Valenfort Citadel", 1, 1), true);

  // Distant event (Valenfort to Harvel Pass delay = 2 turns)
  // At turn 1 -> false
  assert.strictEqual(isEventVisibleToObserver("Valenfort Citadel", "Harvel Pass", 1, 1), false);
  // At turn 2 -> false
  assert.strictEqual(isEventVisibleToObserver("Valenfort Citadel", "Harvel Pass", 2, 1), false);
  // At turn 3 (1 + 2 = 3) -> true
  assert.strictEqual(isEventVisibleToObserver("Valenfort Citadel", "Harvel Pass", 3, 1), true);

  // 4. Test WorldSecrets Filtering via getVisibleWorldSecrets
  console.log("  - Testing WorldSecrets Fog-of-War Filtering...");
  const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
  state.character.location.landmark = "Valenfort Citadel";
  state.worldLedger.currentDate.year = 342;
  state.worldLedger.currentDate.week = 1;

  const initialJson = JSON.stringify(state.worldLedger);

  // Secret 3 is origin Valenfort Citadel (local -> visible at week 1)
  // Secret 1 is origin Harvel Pass (delay 2 -> invisible at week 1)
  const visibleWeek1 = getVisibleWorldSecrets(state);
  const secret1VisibleW1 = visibleWeek1.some(s => s.id === 'secret_1');
  const secret3VisibleW1 = visibleWeek1.some(s => s.id === 'secret_3');

  assert.strictEqual(secret3VisibleW1, true, "Local Valenfort secret must be visible at week 1");
  assert.strictEqual(secret1VisibleW1, false, "Distant Harvel secret must be hidden by fog-of-war at week 1");

  // Advance player time to week 3 (turn 3)
  state.worldLedger.currentDate.week = 3;
  const visibleWeek3 = getVisibleWorldSecrets(state);
  const secret1VisibleW3 = visibleWeek3.some(s => s.id === 'secret_1');
  assert.strictEqual(secret1VisibleW3, true, "Distant Harvel secret must become visible after turn delay (turn 3)");

  // 5. Verify State Immutability
  state.worldLedger.currentDate.week = 1;
  assert.strictEqual(JSON.stringify(state.worldLedger), initialJson, "getVisibleWorldSecrets must not mutate CampaignState");

  console.log("  ✅ Visibility Engine Integration Tests Passed Successfully!");
}

runVisibilityEngineIntegrationTests();
