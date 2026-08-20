import * as assert from 'assert';
import {
  createInitialState,
  calculateCharacterCombatStats,
  recalculateCharacterStats,
} from '../../src/engine';
import { CampaignState } from '../../src/types';

export function runCombatStatsEngineIntegrationTests() {
  console.log("🧪 Running CombatStats Engine Integration Tests...");

  // 1. Test calculateCharacterCombatStats helper
  console.log("  - Testing calculateCharacterCombatStats helper...");
  const char = {
    stats: {
      baseInitiative: 0,
      armor: 'plate',
      shield: 'tower_shield',
      mount: 'courser',
      mountInjured: false,
    }
  };

  const derived = calculateCharacterCombatStats(char);
  assert.strictEqual(derived.ac, 6, "Plate (5) + Tower Shield (+1) = AC 6");
  assert.strictEqual(derived.initiativeBonus, -1, "Base (0) + Plate (-2) + Tower (-1) + Courser (+2) = -1");

  // 2. Test recalculateCharacterStats on CampaignState full equipment lifecycle
  console.log("  - Testing full equipment lifecycle transitions on CampaignState...");
  const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
  // Default initial state: cloth armor, standard shield, riding horse (+1 init)
  recalculateCharacterStats(state);
  assert.strictEqual(state.character.stats.ac, 3, "Initial: Cloth (2) + Standard Shield (+1) = AC 3");
  assert.strictEqual(state.character.stats.initiativeBonus, 2, "Initial: Base (0) + Cloth (+1) + Riding Horse (+1) = 2");

  // Step A: Upgrade to Leather
  state.character.stats.armor = 'leather';
  recalculateCharacterStats(state);
  assert.strictEqual(state.character.stats.ac, 4, "Leather (3) + Standard Shield (+1) = AC 4");
  assert.strictEqual(state.character.stats.initiativeBonus, 1, "Leather (0) + Riding Horse (+1) = 1");

  // Step B: Upgrade to Chain
  state.character.stats.armor = 'chain';
  recalculateCharacterStats(state);
  assert.strictEqual(state.character.stats.ac, 5, "Chain (4) + Standard Shield (+1) = AC 5");
  assert.strictEqual(state.character.stats.initiativeBonus, 0, "Chain (-1) + Riding Horse (+1) = 0");

  // Step C: Upgrade to Plate
  state.character.stats.armor = 'plate';
  recalculateCharacterStats(state);
  assert.strictEqual(state.character.stats.ac, 6, "Plate (5) + Standard Shield (+1) = AC 6");
  assert.strictEqual(state.character.stats.initiativeBonus, -1, "Plate (-2) + Riding Horse (+1) = -1");

  // Step D: Change to Tower Shield
  state.character.stats.shield = 'tower_shield';
  recalculateCharacterStats(state);
  assert.strictEqual(state.character.stats.ac, 6, "Plate (5) + Tower Shield (+1) = AC 6");
  assert.strictEqual(state.character.stats.initiativeBonus, -2, "Plate (-2) + Tower Shield (-1) + Riding Horse (+1) = -2");

  // Step E: Upgrade Mount to Courser (+2 init)
  state.character.stats.mount = 'courser';
  recalculateCharacterStats(state);
  assert.strictEqual(state.character.stats.ac, 6, "Plate (5) + Tower Shield (+1) = AC 6");
  assert.strictEqual(state.character.stats.initiativeBonus, -1, "Plate (-2) + Tower Shield (-1) + Courser (+2) = -1");

  // Step F: Mount injured (-1 penalty)
  state.character.stats.mountInjured = true;
  recalculateCharacterStats(state);
  assert.strictEqual(state.character.stats.initiativeBonus, -2, "Mount Injured penalty (-1) applied = -2");

  // Step G: Mount recovers
  state.character.stats.mountInjured = false;
  recalculateCharacterStats(state);
  assert.strictEqual(state.character.stats.initiativeBonus, -1, "Mount Recovered penalty removed = -1");

  console.log("  ✅ CombatStats Engine Integration Tests Passed Successfully!");
}

runCombatStatsEngineIntegrationTests();
