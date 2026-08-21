import assert from 'node:assert/strict';
import { buildObserverProjection } from '../src/engine';
import { createSecretState, PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';
import { NARRATIVE_CONTRACT_VERSION } from '../src/lib/narrativeContracts';

{
  const state = createSecretState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);

  assert.equal(projection.contractVersion, NARRATIVE_CONTRACT_VERSION);
  assert.equal(projection.observer.kind, 'PLAYER');
  assert.equal(projection.actors.length, 1);
  assert.equal(projection.actors[0].name, state.character.name);
  // Unrevealed secret must NOT be in knownFacts
  assert.ok(!projection.knownFacts.some(f => f.statement.includes('conspira')));
  // Revealed secret must be in knownFacts
  assert.ok(projection.knownFacts.some(f => f.statement.includes('bloqueadas por bandidos')));
  console.log('NarrativeProjection.test.ts: PASS');
}
