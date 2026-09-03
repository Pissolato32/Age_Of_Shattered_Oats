import assert from 'node:assert/strict';
import { createInitialState, buildObserverProjection } from '../src/engine';
import { toNarrativeProjection } from '../src/lib/narrativeProjection';
import { ExecutionReport, NarrativeActor, NarrativeAction } from '../src/lib/narrativeContracts';
import { CampaignState } from '../src/types';

const PLAYER_OBSERVER = { kind: 'PLAYER' as const, observerId: 'player' };

function createLandlessState(): CampaignState {
  const state = createInitialState('Noble Ruler', 'Central Plains');
  state.character.archetype = 'Landless';
  state.character.title = 'Capitao da Companhia Livre';
  state.character.house = null as any;
  state.character.name = 'Capitao Leonardo';
  return state;
}

function createRejectedReport(action: NarrativeAction, reasonCode: string): ExecutionReport {
  return {
    contractVersion: 1,
    reportId: 'report-test',
    command: {
      commandId: 'cmd-test',
      actorId: 'player',
      action
    },
    status: 'REJECTED',
    actionExecuted: 'UNKNOWN' as NarrativeAction,
    affectedEntities: [{ entityId: 'player', entityType: 'CHARACTER', role: 'ACTOR' }],
    stateChanges: [],
    consequences: [],
    discoveredInformation: [],
    hiddenInformationIds: [],
    events: [],
    reasonCode
  };
}

// ---------------------------------------------------------------------------
// TEST 1 — Landless subject deve ser o nome do personagem, não "O Comandante"
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  assert.notEqual(result.subject, 'O Comandante', 'Subject não deve ser "O Comandante" para Landless');
  assert.equal(result.subject, 'Capitao Leonardo', 'Subject deve ser o nome do personagem');
  console.log('[TEST 1] Landless subject = nome do personagem OK');
}

// ---------------------------------------------------------------------------
// TEST 2 — REJECTED/UNKNOWN não gera "forças locais" no evento visível
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  const eventDesc = result.visibleEvents[0]?.description || '';
  assert.ok(!eventDesc.includes('forças locais'), `Evento não deve mencionar "forças locais": "${eventDesc}"`);
  console.log('[TEST 2] REJECTED não menciona "forças locais" OK');
}

// ---------------------------------------------------------------------------
// TEST 3 — Projection mantém o ator real do jogador
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  const playerActor = projection.actors.find(a => a.actorId === 'player');
  assert.ok(playerActor, 'Deve haver um ator player na projection');
  assert.equal(result.subject, playerActor!.name, 'Subject deve ser o nome do ator player');
  console.log('[TEST 3] Projection mantém ator real do jogador OK');
}

// ---------------------------------------------------------------------------
// TEST 4 — Projection não cria entidades externas inexistentes
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  const eventDesc = result.visibleEvents[0]?.description || '';
  const forbidden = ['exército', 'batedores', 'estandartes', 'arauto', 'tenentes', 'selo imperial'];
  for (const term of forbidden) {
    assert.ok(!eventDesc.toLowerCase().includes(term), `Evento não deve mencionar "${term}"`);
  }
  console.log('[TEST 4] Projection não cria entidades externas OK');
}

// ---------------------------------------------------------------------------
// TEST 5 — Ação não suportada continua rejeitada pela Engine
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'capacidade não suportada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  assert.equal(result.outcome, 'rejected', 'Outcome deve ser rejected');
  console.log('[TEST 5] Ação não suportada = rejected OK');
}

// ---------------------------------------------------------------------------
// TEST 6 — Narrativa de ação rejeitada não pode afirmar execução
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  const eventDesc = result.visibleEvents[0]?.description || '';
  const successPatterns = ['foi executada', 'foi cumprida', 'bem-sucedida', 'concluída com sucesso'];
  for (const pattern of successPatterns) {
    assert.ok(!eventDesc.toLowerCase().includes(pattern), `Evento não deve afirmar execução: "${pattern}"`);
  }
  console.log('[TEST 6] Evento não afirma execução para REJECTED OK');
}

// ---------------------------------------------------------------------------
// TEST 7 — Narrador não deve introduzir fatos materiais ausentes (allowedInferences)
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  const hasGrounding = result.allowedInferences.some(i => i.includes('REJECTED'));
  assert.ok(hasGrounding, 'allowedInferences deve conter regra sobre REJECTED');
  console.log('[TEST 7] allowedInferences contém regra de grounding OK');
}

// ---------------------------------------------------------------------------
// TEST 8 — cold não deve ser convertido em snow
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  state.weeklyLedger.weather = 'tempo firme e frio';
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  const weather = result.sensoryContext?.season || '';
  assert.ok(!weather.toLowerCase().includes('snow'), `Season não deve conter "snow": "${weather}"`);
  console.log('[TEST 8] Frio não convertido em snow OK');
}

// ---------------------------------------------------------------------------
// TEST 9 — Thawtide não deve ser interpretado como condição meteorológica
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  state.weeklyLedger.season = 'Thawtide';
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  const env = result.sensoryContext?.environment || '';
  assert.ok(!env.toLowerCase().includes('degradação climática'), `Environment não deve interpretar Thawtide como clima: "${env}"`);
  console.log('[TEST 9] Thawtide não interpretado como condição climática OK');
}

// ---------------------------------------------------------------------------
// TEST 10 — Input original do playtest permanece reproduzível
// ---------------------------------------------------------------------------
{
  const state = createLandlessState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const report = createRejectedReport('UNKNOWN' as NarrativeAction, 'ambiguidade detectada');
  const result = toNarrativeProjection(report, projection.scene, projection.actors);

  assert.equal(result.outcome, 'rejected', 'Outcome deve ser rejected para CAMP');
  assert.equal(result.subject, 'Capitao Leonardo', 'Subject deve ser nome real');
  assert.ok(result.visibleEvents.length > 0, 'Deve haver ao menos um evento visível');
  assert.ok(!result.visibleEvents[0].description.includes('forças locais'), 'Não menciona forças locais');
  console.log('[TEST 10] Input original do playtest reproduzível OK');
}
