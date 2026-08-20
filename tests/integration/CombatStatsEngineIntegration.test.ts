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

  // 2. Test recalculateCharacterStats on CampaignState
  console.log("  - Testing recalculateCharacterStats on CampaignState...");
  const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
  state.character.stats.armor = 'chain';
  state.character.stats.shield = 'heater_shield';
  state.character.stats.mount = 'warhorse';
  state.character.stats.mountInjured = true;

  recalculateCharacterStats(state);

  // Chain (4) + Heater Shield (+1) = AC 5
  assert.strictEqual(state.character.stats.ac, 5, "Chain (4) + Heater (+1) = AC 5");
  // Base (0) + Chain (-1) + Heater (0) + Warhorse (+2) - Injured (-1) = 0
  assert.strictEqual(state.character.stats.initiativeBonus, 0, "Chain (-1) + Warhorse (+2) - Injured (-1) = 0");

  console.log("  ✅ CombatStats Engine Integration Tests Passed Successfully!");
}

runCombatStatsEngineIntegrationTests();
