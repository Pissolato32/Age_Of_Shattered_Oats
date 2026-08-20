import * as assert from 'assert';
import {
  createInitialState,
  calculateSuccessionOrder,
  resolveDynasticSuccession,
} from '../../src/engine';
import { CampaignState } from '../../src/types';
import { Relative } from '../../src/domain/kingdom/services/SuccessionService';

export function runSuccessionEngineIntegrationTests() {
  console.log("🧪 Running Succession Engine Integration Tests...");

  // 1. Test calculateSuccessionOrder adapter
  console.log("  - Testing calculateSuccessionOrder adapter...");
  const relatives: Relative[] = [
    { id: 'c1', name: 'Younger Son', relation: 'child', age: 14, isLegitimate: true },
    { id: 'c2', name: 'Eldest Daughter', relation: 'child', age: 20, isLegitimate: true },
  ];

  const sorted = calculateSuccessionOrder(relatives);
  assert.strictEqual(sorted[0].name, 'Eldest Daughter');
  assert.strictEqual(sorted[1].name, 'Younger Son');

  // 2. Test resolveDynasticSuccession on CampaignState
  console.log("  - Testing resolveDynasticSuccession on CampaignState...");
  const state: CampaignState = createInitialState("Noble Ruler", "Central Plains");
  const oldLordName = state.character.name;

  // Setup children in family
  state.family.children = [
    { name: 'Youngest Heir', age: 10, gender: 'Male', isHeir: false, alive: true },
    { name: 'Eldest Heir', age: 22, gender: 'Male', isHeir: true, alive: true },
    { name: 'Middle Heir', age: 16, gender: 'Female', isHeir: false, alive: true },
  ];

  const result = resolveDynasticSuccession(state, 'abdicate');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.oldLordName, oldLordName);
  assert.strictEqual(result.primaryHeirName, 'Eldest Heir');

  // Verify CampaignState character state update
  assert.strictEqual(state.character.name, 'Eldest Heir');
  assert.strictEqual(state.character.age, 22);
  assert.strictEqual(state.family.children.length, 2);

  // Verify remaining children appoint next heir dynamically
  const remainingHeir = state.family.children.find(c => c.isHeir);
  assert.ok(remainingHeir);
  assert.strictEqual(remainingHeir?.name, 'Middle Heir'); // Middle Heir is 16, Youngest is 10

  // 3. Test No Living Heirs Fallback
  console.log("  - Testing No Living Heirs fallback...");
  const emptyState: CampaignState = createInitialState("Noble Ruler", "Central Plains");
  emptyState.family.children = [];
  const emptyResult = resolveDynasticSuccession(emptyState, 'death');
  assert.strictEqual(emptyResult.success, false);

  console.log("  ✅ Succession Engine Integration Tests Passed Successfully!");
}

runSuccessionEngineIntegrationTests();
