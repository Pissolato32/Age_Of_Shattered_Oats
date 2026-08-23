import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CampaignState } from '../src/types';
import { EventOpportunityEngine, OpportunityContext } from '../src/domain/events/EventOpportunityEngine';

console.log('=== TEST SUITE: Event Opportunity Engine (M18.9-A) ===\n');

// 1. Carregar estado base
const statePath = resolve(process.cwd(), 'artifacts/playtest_living_world_52w_state.json');
const baseState: CampaignState = JSON.parse(readFileSync(statePath, 'utf-8'));

// Snapshot profundo do estado para testar imutabilidade estrita
const stateBeforeString = JSON.stringify(baseState);

// ---------------------------------------------------------------------------
// TESTE 1: Elegibilidade Contextual de Viagem (TRAVEL)
// ---------------------------------------------------------------------------
console.log('[TEST 1] Verificando elegibilidade contextual para TRAVEL...');
const travelContext: OpportunityContext = {
  activity: 'TRAVEL',
  currentTurn: 52
};
const travelOpportunities = EventOpportunityEngine.getEligibleOpportunities(baseState, travelContext);
const travelEventTypes = travelOpportunities.map(o => o.eventType);

assert.ok(travelEventTypes.includes('TRAVEL_ROAD_ACCIDENT'), 'TRAVEL_ROAD_ACCIDENT deve ser elegível em TRAVEL');
assert.ok(travelEventTypes.includes('WILD_ANIMAL_ENCOUNTER'), 'WILD_ANIMAL_ENCOUNTER deve ser elegível em TRAVEL nos ermos');
assert.ok(!travelEventTypes.includes('BUILD_WORKPLACE_INJURY'), 'BUILD_WORKPLACE_INJURY não pode ser elegível em TRAVEL');
console.log('  ✅ TEST 1 Aprovado: Oportunidades de viagem elegíveis com exclusão de obras.');

// ---------------------------------------------------------------------------
// TESTE 2: Elegibilidade Contextual de Obras (BUILD)
// ---------------------------------------------------------------------------
console.log('[TEST 2] Verificando elegibilidade contextual para BUILD...');
const buildContext: OpportunityContext = {
  activity: 'BUILD',
  currentTurn: 52
};
const buildOpportunities = EventOpportunityEngine.getEligibleOpportunities(baseState, buildContext);
const buildEventTypes = buildOpportunities.map(o => o.eventType);

assert.ok(buildEventTypes.includes('BUILD_WORKPLACE_INJURY'), 'BUILD_WORKPLACE_INJURY deve ser elegível em BUILD');
assert.ok(!buildEventTypes.includes('TRAVEL_ROAD_ACCIDENT'), 'TRAVEL_ROAD_ACCIDENT não pode ser elegível em BUILD');
console.log('  ✅ TEST 2 Aprovado: Oportunidades de construção elegíveis com exclusão de acidentes de estrada.');

// ---------------------------------------------------------------------------
// TESTE 3: Bloqueio de Eventos Impossíveis (Fome com celeiros cheios)
// ---------------------------------------------------------------------------
console.log('[TEST 3] Bloqueio de eventos impossíveis (Fome em tempos de abundância)...');
baseState.weeklyLedger.famineTicks = 0;
baseState.weeklyLedger.food = 50; // Abundante

const allOpportunities = EventOpportunityEngine.evaluateOpportunities(baseState, buildContext);
const famineOpp = allOpportunities.find(o => o.eventType === 'FAMINE_UNREST_RUMOR');

assert.ok(famineOpp, 'FAMINE_UNREST_RUMOR deve constar na avaliação');
assert.strictEqual(famineOpp.eligible, false, 'Fome não pode ser elegível com celeiros abastecidos');
assert.strictEqual(famineOpp.weight, 0, 'Peso deve ser 0 quando inelegível');
console.log('  ✅ TEST 3 Aprovado: Evento de crise de fome inelegível em tempos de fartura.');

// ---------------------------------------------------------------------------
// TESTE 4: Respeito Estrito a Cooldowns
// ---------------------------------------------------------------------------
console.log('[TEST 4] Verificando respeito a Cooldown...');
const contextWithCooldown: OpportunityContext = {
  activity: 'TRAVEL',
  currentTurn: 52,
  eventCooldowns: {
    TRAVEL_ROAD_ACCIDENT: 4 // Em cooldown por 4 turnos
  }
};
const cooldownOpps = EventOpportunityEngine.evaluateOpportunities(baseState, contextWithCooldown);
const accidentOpp = cooldownOpps.find(o => o.eventType === 'TRAVEL_ROAD_ACCIDENT');

assert.ok(accidentOpp);
assert.strictEqual(accidentOpp.eligible, false, 'Evento em cooldown deve ser inelegível');
assert.strictEqual(accidentOpp.weight, 0, 'Peso deve ser 0 em cooldown');
assert.ok(accidentOpp.reasons[0].includes('cooldown'), 'Motivo deve citar cooldown');
console.log('  ✅ TEST 4 Aprovado: Cooldown respeitado e bloqueado.');

// ---------------------------------------------------------------------------
// TESTE 5: Determinismo Funcional Absoluto (100 avaliações idênticas)
// ---------------------------------------------------------------------------
console.log('[TEST 5] Validando determinismo funcional (100 execuções idênticas)...');
const firstResultJson = JSON.stringify(EventOpportunityEngine.evaluateOpportunities(baseState, travelContext));
for (let i = 0; i < 100; i++) {
  const currentResultJson = JSON.stringify(EventOpportunityEngine.evaluateOpportunities(baseState, travelContext));
  assert.strictEqual(currentResultJson, firstResultJson, 'A avaliação deve ser 100% determinística sem variabilidade espúria');
}
console.log('  ✅ TEST 5 Aprovado: 100/100 avaliações produziram resultados idênticos.');

// ---------------------------------------------------------------------------
// TESTE 6: Imutabilidade Estrita do CampaignState
// ---------------------------------------------------------------------------
console.log('[TEST 6] Validando imutabilidade de CampaignState...');
const testStateClone: CampaignState = JSON.parse(readFileSync(statePath, 'utf-8'));
const stateBeforeClone = JSON.stringify(testStateClone);

EventOpportunityEngine.evaluateOpportunities(testStateClone, travelContext);
EventOpportunityEngine.evaluateOpportunities(testStateClone, buildContext);

const stateAfterClone = JSON.stringify(testStateClone);
assert.strictEqual(stateAfterClone, stateBeforeClone, 'CampaignState não pode sofrer nenhuma mutação durante a avaliação');
console.log('  ✅ TEST 6 Aprovado: Zero mutação de estado confirmada.');

// ---------------------------------------------------------------------------
// TESTE 7: Incidental com timeCostHint
// ---------------------------------------------------------------------------
console.log('[TEST 7] Verificando magnitudes e timeCostHint...');
const ravenOpp = allOpportunities.find(o => o.eventType === 'ATMOSPHERIC_FLAVOR_RAVEN');
assert.ok(ravenOpp);
assert.strictEqual(ravenOpp.magnitude, 'INCIDENTAL', 'Corvo deve ser INCIDENTAL');
assert.strictEqual(ravenOpp.timeCostHint, 'NONE', 'Evento incidental não deve consumir tempo de calendário');
console.log('  ✅ TEST 7 Aprovado: Metadados de magnitude e custo de tempo íntegros.');

console.log('\n========================================================================');
console.log('📊 PAINEL DE INVARIANTES DO M18.9-A (EVENT OPPORTUNITY ENGINE):');
console.log('  - Contextual Eligibility Alignment: 100% (Meta: 100%) ✅');
console.log('  - Impossible Event Rejection:       100% (Meta: 100%) ✅');
console.log('  - Cooldown Enforcement:             100% (Meta: 100%) ✅');
console.log('  - Functional Determinism:           100% (Meta: 100%) ✅');
console.log('  - State Immutability:               100% (Zero Side-Effects) ✅');
console.log('========================================================================\n');
console.log('🎉 TODOS OS TESTES DO M18.9-A PASSARAM COM SUCESSO TOTAL!');
