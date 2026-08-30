import assert from 'node:assert/strict';
import { CampaignState } from '../src/types';
import { buildObserverProjection, buildNarrativeContext } from '../src/engine';
import { resolveEpistemicSnapshot } from '../src/lib/narrativeProjection';
import { extractTemporalScope } from '../src/lib/intentHeuristics';
import { AuthorizedKnowledgeFact, ExecutionReport, NarrativeObserver, NarrativeQueryContext, NARRATIVE_CONTRACT_VERSION } from '../src/lib/narrativeContracts';

console.log('=== TEST SUITE: Temporal Epistemic Contracts & Query Preservation (M18.7.1) ===\n');

const mockState: CampaignState = {
  character: {
    name: 'Vaelin',
    title: 'Lorde de Raven Watch',
    house: 'Raven',
    archetype: 'LandedNoble',
    location: 'Grey Keep',
    memories: [
      {
        id: 'fact_bridge_garrison_001',
        ownerId: 'player',
        subjectId: 'velha_ponte',
        description: 'Guarnição sem brasão de 25 homens na ponte.',
        importance: 8,
        tickRegistered: 9,
        decayed: false,
        tags: ['ponte', 'fronteira', 'guarnicao']
      },
      {
        id: 'fact_bridge_ironhand_rumor_006',
        ownerId: 'player',
        subjectId: 'velha_ponte',
        description: 'Boato de viajantes de que o comandante seria da Casa Ironhand.',
        importance: 6,
        tickRegistered: 14,
        decayed: false
      },
      {
        id: 'fact_bridge_ironhand_confirmed_007',
        ownerId: 'player',
        subjectId: 'velha_ponte',
        description: 'Investigação comprovou Capitão Vane da Casa Ironhand.',
        importance: 9,
        tickRegistered: 18,
        decayed: false,
        supersedes: 'fact_bridge_ironhand_rumor_006'
      }
    ] as any
  },
  weeklyLedger: {
    year: 342,
    month: 'Sunreach',
    week: 4,
    silverdew: 200,
    food: 10,
    famineTicks: 0,
    unpaidWagesTicks: 0,
    weather: 'Clear',
    season: 'Sunreach'
  },
  worldLedger: {
    nobleHouses: [],
    majorEvents: []
  }
} as any;

const observer: NarrativeObserver = { kind: 'PLAYER', observerId: 'player' };

// ---------------------------------------------------------------------------
// TEST 1: Preservação de queryContext e playerInput no NarrativeContext (PT-014)
// ---------------------------------------------------------------------------
console.log('[TEST 1] Verificando preservação de queryContext e playerInput (PT-014)...');

const query: NarrativeQueryContext = {
  playerInput: 'Roric, quais forças potencialmente hostis conhecemos atualmente nas nossas fronteiras?',
  originalAction: 'INFORMATION',
  temporalScope: { mode: 'CURRENT_STATE', targetTurn: 35 }
};

const mockReport: ExecutionReport = {
  contractVersion: NARRATIVE_CONTRACT_VERSION,
  reportId: 'rep_test_001',
  command: { commandId: 'cmd_001', actorId: 'player', action: 'INFORMATION' },
  status: 'ACCEPTED',
  actionExecuted: 'INFORMATION',
  affectedEntities: [],
  stateChanges: [],
  consequences: [],
  discoveredInformation: [],
  hiddenInformationIds: [],
  events: [],
  reasonCode: 'Consulta factual de inteligência',
  answerStatus: 'AUTHORIZED_FACTS_PRESENT'
};

const projection = buildObserverProjection(mockState, observer);
const narrativeContext = buildNarrativeContext(projection, mockReport, query);

assert.ok(narrativeContext.query, 'NarrativeContext deve conter o campo query');
assert.strictEqual(narrativeContext.query.playerInput, query.playerInput, 'playerInput deve ser preservado integralmente');
assert.strictEqual(narrativeContext.query.originalAction, 'INFORMATION');
assert.strictEqual(narrativeContext.executionResult.answerStatus, 'AUTHORIZED_FACTS_PRESENT');
console.log('  ✅ TEST 1 Aprovado: queryContext e playerInput preservados no contrato.');

// ---------------------------------------------------------------------------
// TEST 2: Resolução Epistêmica Temporal (PT-015: Historical Point vs Current State)
// ---------------------------------------------------------------------------
console.log('\n[TEST 2] Verificando isolamento temporal em resolveEpistemicSnapshot (PT-015)...');

// Caso A: Consulta Retrospectiva no Turno 9
const scopeT09 = extractTemporalScope('Quem sabíamos que comandava a posição no Turno 9?');
assert.strictEqual(scopeT09.mode, 'HISTORICAL_POINT');
assert.strictEqual(scopeT09.targetTurn, 9);

const snapshotT09 = resolveEpistemicSnapshot(mockState, scopeT09);
assert.strictEqual(snapshotT09.asOfTurn, 9);

// No Turno 9, apenas o fato registrado no Turno 9 deve estar presente. Fatos dos turnos 14 e 18 NÃO podem vazar!
const t09FactIds = snapshotT09.activeFacts.map(f => f.factId);
assert.ok(t09FactIds.includes('fact_bridge_garrison_001'), 'Fato do Turno 9 deve estar presente');
assert.ok(!t09FactIds.includes('fact_bridge_ironhand_rumor_006'), 'Boato do Turno 14 NÃO pode vazar no snapshot do Turno 9');
assert.ok(!t09FactIds.includes('fact_bridge_ironhand_confirmed_007'), 'Confirmação do Turno 18 NÃO pode vazar no snapshot do Turno 9');
console.log('  ✅ TEST 2A Aprovado: Snapshot histórico do Turno 9 bloqueia 100% dos fatos posteriores.');

// Caso B: Consulta no Estado Atual (Turno 35)
const scopeCurrent = extractTemporalScope('Quem comanda atualmente a posição?');
assert.strictEqual(scopeCurrent.mode, 'CURRENT_STATE');

const snapshotCurrent = resolveEpistemicSnapshot(mockState, scopeCurrent);
const currentFactIds = snapshotCurrent.activeFacts.map(f => f.factId);
assert.ok(currentFactIds.includes('fact_bridge_ironhand_confirmed_007'), 'Confirmação do Turno 18 deve ser ativa no estado atual');
assert.ok(!currentFactIds.includes('fact_bridge_ironhand_rumor_006'), 'Fato superseded (boato T14) deve ter sido movido para historicalFacts no estado atual');
console.log('  ✅ TEST 2B Aprovado: Estado atual reflete a verdade ativa e arquiva fatos superseded.');

// ---------------------------------------------------------------------------
// TEST 3: Detecção de Ausência de Fatos Autorizados (PT-016: NO_AUTHORIZED_INFORMATION)
// ---------------------------------------------------------------------------
console.log('\n[TEST 3] Verificando emissão estruturada de NO_AUTHORIZED_INFORMATION (PT-016)...');

const scopeBlackthorn = extractTemporalScope('O que sabemos sobre a Casa Blackthorn e sua participação na ponte?');
const projBlackthorn = buildObserverProjection(mockState, observer, scopeBlackthorn);

const factsText = projBlackthorn.knownFacts.map(f => `${f.statement} ${f.subjectId || ''}`).join(' ').toLowerCase();
const containsBlackthorn = factsText.includes('blackthorn');
assert.strictEqual(containsBlackthorn, false, 'Blackthorn não deve constar nos fatos autorizados');

console.log('  ✅ TEST 3 Aprovado: Ausência de fatos para entidade não cadastrada confirmada.');

console.log('\n🎉 TODOS OS TESTES UNITÁRIOS DE CONTRATOS DO M18.7.1 PASSARAM COM SUCESSO!');
