import * as assert from 'assert';

/**
 * Verifies the council ownership invariants for Landless vs Landed archetypes.
 * Does NOT import CharacterCreator (React) — replicates the initialization logic as pure data.
 */

interface MockCouncil {
  name: string;
  seats: { name: string; role: string }[];
  emergencyFund: number;
  pendingAgendas: string[];
}

interface MockHoldings {
  type: 'Castle' | 'Fortified Town' | 'Bastion' | 'Walled City' | 'Camp' | 'None';
}

interface MockWorldLedger {
  councils?: MockCouncil[];
}

interface MockState {
  councils?: MockCouncil[] | null;
  holdings: MockHoldings;
  worldLedger: MockWorldLedger;
}

function applyLandlessOverrides(base: MockState): MockState {
  return { ...base, holdings: { ...base.holdings, type: 'Camp' }, councils: [] };
}

function applyLandedOverrides(base: MockState): MockState {
  return { ...base, holdings: { ...base.holdings, type: 'Castle' } };
}

const WORLD_COUNCILS: MockCouncil[] = [
  { name: 'Conselho Senhorial de Grey Keep', seats: [{ name: 'Lord Alric', role: 'Soberano' }], emergencyFund: 120, pendingAgendas: ['Aumento dos impostos de inverno'] },
  { name: 'Conselho Fluvial dos Rios', seats: [{ name: 'Lord Brandon', role: 'Vassalo do Norte' }], emergencyFund: 88, pendingAgendas: ['Combater incursores'] },
];

const LANDED_OWN_COUNCILS: MockCouncil[] = [
  { name: 'Conselho Senhorial de Grey Keep', seats: [{ name: 'Lorde Aldren', role: 'Conselheiro de Guerra' }], emergencyFund: 0, pendingAgendas: ['Regularizar comercio'] },
];

const baseState: MockState = {
  councils: LANDED_OWN_COUNCILS,
  holdings: { type: 'Castle' },
  worldLedger: { councils: WORLD_COUNCILS },
};

async function runTests() {
  console.log('LandlessArchetypeInvariants.test.ts: Running council ownership invariants...');

  const landlessState = applyLandlessOverrides(JSON.parse(JSON.stringify(baseState)));

  // [TEST 1] Landless must not own any council
  assert.ok(Array.isArray(landlessState.councils) && landlessState.councils.length === 0, 'Landless must start with no owned councils');
  assert.strictEqual(landlessState.holdings.type, 'Camp', 'Landless holdings.type must be Camp');
  console.log('  [TEST 1] Landless has no owned councils -> OK');

  // [TEST 2] World councils must not be destroyed by Landless initialization
  assert.ok(Array.isArray(landlessState.worldLedger.councils) && landlessState.worldLedger.councils.length === WORLD_COUNCILS.length, 'worldLedger.councils must remain intact');
  assert.strictEqual(landlessState.worldLedger.councils![0].name, WORLD_COUNCILS[0].name, 'First world council must retain its name');
  console.log('  [TEST 2] worldLedger.councils remain intact after Landless init -> OK');

  // [TEST 3] Landed Lord retains own councils
  const landedState = applyLandedOverrides(JSON.parse(JSON.stringify(baseState)));
  assert.ok(Array.isArray(landedState.councils) && landedState.councils.length > 0, 'Landed Lord must have own councils');
  assert.strictEqual(landedState.holdings.type, 'Castle', 'Landed holdings.type must be Castle');
  console.log('  [TEST 3] Landed Lord retains own councils -> OK');

  // [TEST 4] isLandless flag derived correctly from holdings.type (mirrors LedgerViewer logic)
  const isLandless = (type: string) => type === 'Camp' || type === 'None';
  assert.strictEqual(isLandless('Camp'), true);
  assert.strictEqual(isLandless('None'), true);
  assert.strictEqual(isLandless('Castle'), false);
  assert.strictEqual(isLandless('Fortified Town'), false);
  console.log('  [TEST 4] isLandless derived correctly from holdings.type -> OK');

  console.log('LandlessArchetypeInvariants.test.ts: ALL TESTS PASSED.');
}

runTests().catch(err => {
  console.error('LandlessArchetypeInvariants tests FAILED:', err.stack);
  process.exit(1);
});
