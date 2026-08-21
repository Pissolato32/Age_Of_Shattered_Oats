import assert from 'node:assert/strict';
import { createInitialState } from '../src/engine';
import { CampaignState } from '../src/types';
import { NARRATIVE_CONTRACT_VERSION, NarrativeCommand } from '../src/lib/narrativeContracts';
import { classifyNarrativeCommand } from '../src/lib/actionClassifier';
import { resolveNarrativeCommand } from '../src/lib/narrativeExecution';
import { RandomService } from '../src/core/RandomService';

const baseState: CampaignState = createInitialState('Noble Ruler', 'Central Plains');
baseState.weeklyLedger.silverdew = 500;
baseState.holdings.laborPool = 200;

function freshState(): CampaignState {
  return JSON.parse(JSON.stringify(baseState));
}

function makeCommand(action: NarrativeCommand['action'], overrides: Partial<NarrativeCommand> = {}): NarrativeCommand {
  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'cmd_test_class',
    actorId: 'player',
    action,
    constraints: [],
    confidence: 0.95,
    ambiguity: [],
    requiresClarification: false,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// 1. Matriz de Classificação Canônica
// ---------------------------------------------------------------------------
{
  const state = freshState();

  const recruit = classifyNarrativeCommand(makeCommand('RECRUIT'), state);
  assert.equal(recruit.type, 'CANONICAL');
  assert.equal(recruit.pipeline, 'RULE_ENGINE');

  const build = classifyNarrativeCommand(makeCommand('BUILD', { objectId: 'palisade' }), state);
  assert.equal(build.type, 'CANONICAL');
  assert.equal(build.pipeline, 'RULE_ENGINE');

  const travel = classifyNarrativeCommand(makeCommand('TRAVEL', { locationId: 'Stormcrest' }), state);
  assert.equal(travel.type, 'CANONICAL');
  assert.equal(travel.pipeline, 'RULE_ENGINE');

  const trade = classifyNarrativeCommand(makeCommand('TRADE', { objectId: 'grain' }), state);
  assert.equal(trade.type, 'CANONICAL');
  assert.equal(trade.pipeline, 'RULE_ENGINE');

  const craft = classifyNarrativeCommand(makeCommand('CRAFT'), state);
  assert.equal(craft.type, 'CANONICAL');
  assert.equal(craft.pipeline, 'RULE_ENGINE');

  const info = classifyNarrativeCommand(makeCommand('INFORMATION'), state);
  assert.equal(info.type, 'CANONICAL');
  assert.equal(info.pipeline, 'RULE_ENGINE');

  const flavor = classifyNarrativeCommand(makeCommand('FLAVOR_QUERY'), state);
  assert.equal(flavor.type, 'CANONICAL');
  assert.equal(flavor.pipeline, 'RULE_ENGINE');

  console.log('[CANONICAL] Todas as 7 ações canônicas classificadas como CANONICAL -> OK');
}

// ---------------------------------------------------------------------------
// 2. Ambiguidade e Parâmetros Obrigatórios
// ---------------------------------------------------------------------------
{
  const state = freshState();

  // BUILD sem objectId nem targetId
  const emptyBuild = classifyNarrativeCommand(makeCommand('BUILD'), state);
  assert.equal(emptyBuild.type, 'AMBIGUOUS');
  assert.equal(emptyBuild.pipeline, 'CLARIFICATION_PIPELINE');

  // TRAVEL sem locationId nem targetId
  const emptyTravel = classifyNarrativeCommand(makeCommand('TRAVEL'), state);
  assert.equal(emptyTravel.type, 'AMBIGUOUS');
  assert.equal(emptyTravel.pipeline, 'CLARIFICATION_PIPELINE');

  // Comando com requiresClarification ativo
  const clarReq = classifyNarrativeCommand(makeCommand('RECRUIT', { requiresClarification: true }), state);
  assert.equal(clarReq.type, 'AMBIGUOUS');
  assert.equal(clarReq.pipeline, 'CLARIFICATION_PIPELINE');

  console.log('[AMBIGUOUS] Ações incompletas ou com flag de esclarecimento classificadas como AMBIGUOUS -> OK');
}

// ---------------------------------------------------------------------------
// 3. Impossibilidade Estrutural
// ---------------------------------------------------------------------------
{
  const state = freshState();

  const resurrect = classifyNarrativeCommand(makeCommand('UNKNOWN', { motivation: 'Ressuscitar morto com necromancia' }), state);
  assert.equal(resurrect.type, 'IMPOSSIBLE');
  assert.equal(resurrect.pipeline, 'REJECTION_PIPELINE');

  const flying = classifyNarrativeCommand(makeCommand('UNKNOWN', { desiredOutcome: 'Voar sem asas até a capital' }), state);
  assert.equal(flying.type, 'IMPOSSIBLE');
  assert.equal(flying.pipeline, 'REJECTION_PIPELINE');

  console.log('[IMPOSSIBLE] Violações das leis físicas e do cenário classificadas como IMPOSSIBLE -> OK');
}

// ---------------------------------------------------------------------------
// 4. Plausible Unmodeled Routing
// ---------------------------------------------------------------------------
{
  const state = freshState();

  const threat = classifyNarrativeCommand(makeCommand('THREAT', { targetId: 'vassal_1' }), state);
  assert.equal(threat.type, 'PLAUSIBLE_UNMODELED');
  assert.equal(threat.pipeline, 'GENERIC_RESOLVER');

  const investigate = classifyNarrativeCommand(makeCommand('INVESTIGATE', { targetId: 'northern_border' }), state);
  assert.equal(investigate.type, 'PLAUSIBLE_UNMODELED');
  assert.equal(investigate.pipeline, 'GENERIC_RESOLVER');

  console.log('[PLAUSIBLE_UNMODELED] Ações plausíveis não-canônicas roteadas para GENERIC_RESOLVER -> OK');
}

// ---------------------------------------------------------------------------
// 5. Integração com resolveNarrativeCommand
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const rng = new RandomService(4242);

  // Ação canônica viável
  const canRes = resolveNarrativeCommand(makeCommand('RECRUIT', { magnitude: { mode: 'FIXED', value: 10 } }), state, rng);
  assert.equal(canRes.report.status, 'ACCEPTED');
  assert.equal(canRes.mutated, true);

  // Ação ambígua (BUILD sem target)
  const ambRes = resolveNarrativeCommand(makeCommand('BUILD'), state, rng);
  assert.equal(ambRes.report.status, 'REJECTED');
  assert.equal(ambRes.mutated, false);

  // Ação impossível
  const impRes = resolveNarrativeCommand(makeCommand('UNKNOWN', { motivation: 'Ressuscitar o rei morto' }), state, rng);
  assert.equal(impRes.report.status, 'REJECTED');
  assert.equal(impRes.mutated, false);

  // Ação plausível unmodeled (THREAT com alvo)
  const threatRes = resolveNarrativeCommand(makeCommand('THREAT', { targetId: 'vassal_1' }), state, rng);
  assert.ok(threatRes.report.status === 'ACCEPTED' || threatRes.report.status === 'REJECTED');

  console.log('[INTEGRATION] resolveNarrativeCommand respeita classificação sem fallback silencioso -> OK');
}

console.log('ActionClassification test suite passed successfully.');
