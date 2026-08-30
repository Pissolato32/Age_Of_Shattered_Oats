import assert from 'node:assert/strict';
import { buildObserverProjection } from '../src/engine';
import { createSecretState, PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';
import { NARRATIVE_CONTRACT_VERSION, NarrativeObserver } from '../src/lib/narrativeContracts';

// ---------------------------------------------------------------------------
// TEST A — Secret Isolation (Unrevealed secrets MUST NOT leak)
// ---------------------------------------------------------------------------
{
  const state = createSecretState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);

  assert.equal(projection.contractVersion, NARRATIVE_CONTRACT_VERSION);
  assert.equal(projection.observer.kind, 'PLAYER');
  assert.ok(projection.actors.length >= 1);
  assert.equal(projection.actors[0].name, state.character.name);

  // Unrevealed secret must NOT be anywhere in knownFacts, scene, or actors
  assert.ok(!projection.knownFacts.some(f => f.statement.includes('conspira')));
  assert.ok(!JSON.stringify(projection).includes('conspira'));

  // Revealed secret must be in knownFacts
  assert.ok(projection.knownFacts.some(f => f.statement.includes('bloqueadas por bandidos')));
  console.log('[TEST A] Segredos não revelados isolados estruturalmente -> OK');
}

// ---------------------------------------------------------------------------
// TEST B — Hidden Treasury / Economic Leakage Protection
// ---------------------------------------------------------------------------
{
  const state = createSecretState();
  state.weeklyLedger.silverdew = 1234567;
  state.holdings.laborPool = 987654;

  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const serialized = JSON.stringify(projection);

  // Raw ledger values must not be present in the projection
  assert.ok(!serialized.includes('1234567'));
  assert.ok(!serialized.includes('987654'));
  assert.ok(!('silverdew' in projection));
  assert.ok(!('laborPool' in projection));

  console.log('[TEST B] Tesouro bruto e mão de obra não vazam para a projeção -> OK');
}

// ---------------------------------------------------------------------------
// TEST C — Foreign Observer Scoping
// ---------------------------------------------------------------------------
{
  const state = createSecretState();
  const foreignObserver: NarrativeObserver = {
    kind: 'NPC',
    observerId: 'Lord_Vane'
  };

  const projection = buildObserverProjection(state, foreignObserver);

  assert.equal(projection.observer.kind, 'NPC');
  assert.equal(projection.observer.observerId, 'Lord_Vane');
  assert.equal(projection.scene.locationId, 'unknown');
  assert.equal(projection.actors.length, 0);
  assert.equal(projection.knownFacts.length, 0);

  console.log('[TEST C] Observador externo recebe apenas projeção restrita ao seu escopo -> OK');
}

// ---------------------------------------------------------------------------
// TEST D — Strict Allow-List & Determinism Audit
// ---------------------------------------------------------------------------
{
  const state = createSecretState();
  const proj1 = buildObserverProjection(state, PLAYER_OBSERVER);
  const proj2 = buildObserverProjection(state, PLAYER_OBSERVER);

  assert.deepEqual(proj1, proj2, 'A projeção do observador é determinística e pura');

  const serialized = JSON.stringify(proj1);
  const forbiddenKeys = ['rng', 'seed', 'formula', 'weight', 'coefficients', 'worldSecrets', 'turnLog'];
  for (const key of forbiddenKeys) {
    assert.ok(!serialized.includes(`"${key}"`), `Chave proibida "${key}" detectada na projeção!`);
  }

  console.log('[TEST D] Auditoria de allow-list restrita e determinismo concluída -> OK');
}

// ---------------------------------------------------------------------------
// TEST E — Pending Consequences Visibility & Trigger Protection
// ---------------------------------------------------------------------------
{
  const state = createSecretState();
  state.sessionLog = {
    lastSessionDate: 'Greening Day 1, Year 342',
    lastThingHappened: 'Iniciou a campanha.',
    activeMissions: [],
    pendingDecisions: [],
    pendingConsequences: [
      {
        id: 'c_pending_1',
        kind: 'PENDING',
        description: 'Mercadores relataram contrabandistas em fuga nas colinas.',
        triggerTurn: 15,
        originAction: 'TRADE',
        resolved: false
      },
      {
        id: 'c_resolved_1',
        kind: 'PENDING',
        description: 'Antiga disputa de pasto resolvida.',
        triggerTurn: 5,
        originAction: 'DIPLOMACY',
        resolved: true
      }
    ]
  };

  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const circumstances = projection.scene.immediateCircumstances ?? [];

  assert.ok(circumstances.length >= 1, 'Circunstâncias devem conter a consequência não resolvida');
  assert.ok(circumstances.some(c => c.includes('contrabandistas em fuga')), 'Consequência pendente deve ser projetada');
  assert.ok(!circumstances.some(c => c.includes('Antiga disputa de pasto')), 'Consequência já resolvida não deve constar como pendente');

  // Internal triggerTurn must NOT leak to the projection
  const serialized = JSON.stringify(projection);
  assert.ok(!serialized.includes('"triggerTurn"'));
  assert.ok(!serialized.includes(':15'));

  console.log('[TEST E] Consequências pendentes projetadas sem vazamento de triggerTurn -> OK');
}

console.log('NarrativeProjection.test.ts: PASS');
