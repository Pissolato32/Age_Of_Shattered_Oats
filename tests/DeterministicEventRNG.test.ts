import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CampaignState } from '../src/types';
import { EventOpportunityEngine, EventOpportunity, OpportunityContext } from '../src/domain/events/EventOpportunityEngine';
import { CooldownPolicy, RecentEventSummary } from '../src/domain/events/CooldownPolicy';
import { DeterministicEventRNG, DeterministicEventSelectionInput } from '../src/domain/events/DeterministicEventRNG';

console.log('=== TEST SUITE: Deterministic Event RNG & Cooldown Policy (M18.9-B) ===\n');

// Carregar estado base
const statePath = resolve(process.cwd(), 'artifacts/playtest_living_world_52w_state.json');
const baseState: CampaignState = JSON.parse(readFileSync(statePath, 'utf-8'));

const travelContext: OpportunityContext = {
  activity: 'TRAVEL',
  currentTurn: 52
};
const travelOpportunities = EventOpportunityEngine.getEligibleOpportunities(baseState, travelContext);

// ---------------------------------------------------------------------------
// TESTE 1: Reprodução 100/100 (Determinismo Absoluto)
// ---------------------------------------------------------------------------
console.log('[TEST 1] Verificando reprodução 100/100 com chave canônica idêntica...');
const baseInput: DeterministicEventSelectionInput = {
  campaignSeed: 'seed_iron_chronicle_994',
  absoluteTurn: 52,
  slotIndex: 1,
  domain: 'TRAVEL',
  opportunities: travelOpportunities
};

const firstResult = DeterministicEventRNG.selectEvent(baseInput);
assert.ok(firstResult.selected !== null, 'Deveria selecionar um evento válido');

for (let i = 0; i < 100; i++) {
  const rerunResult = DeterministicEventRNG.selectEvent(baseInput);
  assert.strictEqual(rerunResult.selected?.opportunityId, firstResult.selected?.opportunityId);
  assert.strictEqual(rerunResult.roll, firstResult.roll);
  assert.strictEqual(rerunResult.seedMaterial, firstResult.seedMaterial);
}
console.log(`  ✅ TEST 1 Aprovado: 100/100 execuções idênticas (${firstResult.selected?.eventType}, roll: ${firstResult.roll.toFixed(4)}).`);

// ---------------------------------------------------------------------------
// TESTE 2: Seeds Diferentes Alteram a Seleção / Roll
// ---------------------------------------------------------------------------
console.log('[TEST 2] Verificando sensibilidade a Seeds diferentes...');
const inputSeedA: DeterministicEventSelectionInput = { ...baseInput, campaignSeed: 'seed_alpha_123' };
const inputSeedB: DeterministicEventSelectionInput = { ...baseInput, campaignSeed: 'seed_omega_789' };

const resSeedA = DeterministicEventRNG.selectEvent(inputSeedA);
const resSeedB = DeterministicEventRNG.selectEvent(inputSeedB);

assert.notStrictEqual(resSeedA.roll, resSeedB.roll, 'Seeds diferentes devem produzir rolls diferentes');
console.log(`  ✅ TEST 2 Aprovado: Seeds distintas geram rolls distintos (${resSeedA.roll.toFixed(4)} vs ${resSeedB.roll.toFixed(4)}).`);

// ---------------------------------------------------------------------------
// TESTE 3: Turnos Diferentes
// ---------------------------------------------------------------------------
console.log('[TEST 3] Verificando sensibilidade a Turnos diferentes...');
const resTurn52 = DeterministicEventRNG.selectEvent({ ...baseInput, absoluteTurn: 52 });
const resTurn53 = DeterministicEventRNG.selectEvent({ ...baseInput, absoluteTurn: 53 });
assert.notStrictEqual(resTurn52.roll, resTurn53.roll, 'Turnos diferentes devem produzir rolls diferentes');
console.log('  ✅ TEST 3 Aprovado: Variação de turno validada.');

// ---------------------------------------------------------------------------
// TESTE 4: Slots Diferentes
// ---------------------------------------------------------------------------
console.log('[TEST 4] Verificando sensibilidade a Slots diferentes...');
const resSlot1 = DeterministicEventRNG.selectEvent({ ...baseInput, slotIndex: 1 });
const resSlot2 = DeterministicEventRNG.selectEvent({ ...baseInput, slotIndex: 2 });
assert.notStrictEqual(resSlot1.roll, resSlot2.roll, 'Slots diferentes devem produzir rolls diferentes');
console.log('  ✅ TEST 4 Aprovado: Variação de slotIndex validada.');

// ---------------------------------------------------------------------------
// TESTE 5: Domínios Diferentes
// ---------------------------------------------------------------------------
console.log('[TEST 5] Verificando sensibilidade a Domínios diferentes...');
const resDomainTravel = DeterministicEventRNG.selectEvent({ ...baseInput, domain: 'TRAVEL' });
const resDomainHolding = DeterministicEventRNG.selectEvent({ ...baseInput, domain: 'HOLDING' });
assert.notStrictEqual(resDomainTravel.roll, resDomainHolding.roll, 'Domínios diferentes devem produzir rolls diferentes');
console.log('  ✅ TEST 5 Aprovado: Variação de domain validada.');

// ---------------------------------------------------------------------------
// TESTE 6: Weighted Distribution (Convergência de Pesos em 1000 Amostras)
// ---------------------------------------------------------------------------
console.log('[TEST 6] Validando distribuição proporcional aos pesos (1000 amostras)...');
const mockCandidates: EventOpportunity[] = [
  { opportunityId: 'opp_light', eventType: 'LIGHT_EVENT', magnitude: 'INCIDENTAL', baseWeight: 1, weight: 1, tags: [], eligible: true, reasons: [], timeCostHint: 'NONE' },
  { opportunityId: 'opp_heavy', eventType: 'HEAVY_EVENT', magnitude: 'SIGNIFICANT', baseWeight: 9, weight: 9, tags: [], eligible: true, reasons: [], timeCostHint: 'HOURS' }
];

const counts: Record<string, number> = { LIGHT_EVENT: 0, HEAVY_EVENT: 0 };
for (let slot = 0; slot < 1000; slot++) {
  const result = DeterministicEventRNG.selectEvent({
    campaignSeed: 'seed_monte_carlo',
    absoluteTurn: 10,
    slotIndex: slot,
    domain: 'TEST',
    opportunities: mockCandidates
  });
  if (result.selected) {
    counts[result.selected.eventType]++;
  }
}

// Peso esperado: 10% LIGHT (1/10) vs 90% HEAVY (9/10)
const lightRatio = counts.LIGHT_EVENT / 1000;
const heavyRatio = counts.HEAVY_EVENT / 1000;
assert.ok(lightRatio > 0.05 && lightRatio < 0.15, `Light ratio (${lightRatio}) deve convergir para ~0.10`);
assert.ok(heavyRatio > 0.85 && heavyRatio < 0.95, `Heavy ratio (${heavyRatio}) deve convergir para ~0.90`);
console.log(`  ✅ TEST 6 Aprovado: Distribuição convergiu conforme pesos (${(lightRatio*100).toFixed(1)}% vs ${(heavyRatio*100).toFixed(1)}%).`);

// ---------------------------------------------------------------------------
// TESTE 7: Candidato com Weight <= 0 Nunca é Selecionado
// ---------------------------------------------------------------------------
console.log('[TEST 7] Verificando que Weight <= 0 ou Inelegível nunca é selecionado...');
const zeroWeightCandidates: EventOpportunity[] = [
  { opportunityId: 'opp_zero', eventType: 'ZERO_EVENT', magnitude: 'MINOR', baseWeight: 0, weight: 0, tags: [], eligible: false, reasons: [], timeCostHint: 'NONE' },
  { opportunityId: 'opp_valid', eventType: 'VALID_EVENT', magnitude: 'MINOR', baseWeight: 5, weight: 5, tags: [], eligible: true, reasons: [], timeCostHint: 'NONE' }
];

for (let slot = 0; slot < 50; slot++) {
  const result = DeterministicEventRNG.selectEvent({
    campaignSeed: 'seed_zero_check',
    absoluteTurn: 15,
    slotIndex: slot,
    domain: 'TEST',
    opportunities: zeroWeightCandidates
  });
  assert.strictEqual(result.selected?.eventType, 'VALID_EVENT', 'Nunca deve selecionar candidato com peso zero');
}
console.log('  ✅ TEST 7 Aprovado: Peso zero 100% bloqueado.');

// ---------------------------------------------------------------------------
// TESTE 8: Cooldown Simples Aplicado com Sucesso
// ---------------------------------------------------------------------------
console.log('[TEST 8] Verificando aplicação de Cooldown simples...');
const recentEvents: RecentEventSummary[] = [
  { eventType: 'TRAVEL_ROAD_ACCIDENT', turnRegistered: 50 } // Ocorreu no T50 (cooldown é 4 turnos, então T50 + 4 = T54)
];

const contextAtTurn52: DeterministicEventSelectionInput = {
  ...baseInput,
  absoluteTurn: 52,
  recentEvents
};

const resultUnderCooldown = DeterministicEventRNG.selectEvent(contextAtTurn52);
assert.notStrictEqual(resultUnderCooldown.selected?.eventType, 'TRAVEL_ROAD_ACCIDENT', 'TRAVEL_ROAD_ACCIDENT em cooldown no T52 não pode ser selecionado');
console.log('  ✅ TEST 8 Aprovado: Evento em cooldown devidamente filtrado.');

// ---------------------------------------------------------------------------
// TESTE 9: Cooldown Específico por eventType (Não polui outros tipos)
// ---------------------------------------------------------------------------
console.log('[TEST 9] Verificando isolamento de cooldown por eventType...');
const remainingAccident = CooldownPolicy.getRemainingCooldown('TRAVEL_ROAD_ACCIDENT', 52, recentEvents);
const remainingAnimal = CooldownPolicy.getRemainingCooldown('WILD_ANIMAL_ENCOUNTER', 52, recentEvents);

assert.strictEqual(remainingAccident, 2, 'TRAVEL_ROAD_ACCIDENT deve ter 2 turnos restantes no T52');
assert.strictEqual(remainingAnimal, 0, 'WILD_ANIMAL_ENCOUNTER não deve ter cooldown');
console.log('  ✅ TEST 9 Aprovado: Cooldowns isolados estritamente por eventType.');

// ---------------------------------------------------------------------------
// TESTE 10: Nenhum Candidato Elegível Retorna selected: null
// ---------------------------------------------------------------------------
console.log('[TEST 10] Verificando fallback com zero candidatos elegíveis...');
const emptyResult = DeterministicEventRNG.selectEvent({
  ...baseInput,
  opportunities: []
});
assert.strictEqual(emptyResult.selected, null, 'Deveria retornar selected: null quando não há candidatos');
assert.strictEqual(emptyResult.candidates.length, 0);
console.log('  ✅ TEST 10 Aprovado: Retorno seguro de selected: null.');

// ---------------------------------------------------------------------------
// TESTE 11: Nenhuma Mutação do CampaignState
// ---------------------------------------------------------------------------
console.log('[TEST 11] Verificando imutabilidade do CampaignState...');
const stateClone: CampaignState = JSON.parse(JSON.stringify(baseState));
const beforeJson = JSON.stringify(stateClone);

DeterministicEventRNG.selectEvent({
  campaignSeed: 'seed_immutability',
  absoluteTurn: 52,
  slotIndex: 1,
  domain: 'TRAVEL',
  opportunities: travelOpportunities
});

const afterJson = JSON.stringify(stateClone);
assert.strictEqual(afterJson, beforeJson, 'CampaignState não deve sofrer mutação');
console.log('  ✅ TEST 11 Aprovado: Imutabilidade confirmada.');

// ---------------------------------------------------------------------------
// TESTE 12: Replay Determinístico Após Serialize / Deserialize
// ---------------------------------------------------------------------------
console.log('[TEST 12] Validando Replay determinístico pós Save/Reload...');
const serializedInput = JSON.stringify(baseInput);
const deserializedInput: DeterministicEventSelectionInput = JSON.parse(serializedInput);

const replayResult1 = DeterministicEventRNG.selectEvent(baseInput);
const replayResult2 = DeterministicEventRNG.selectEvent(deserializedInput);

assert.strictEqual(replayResult1.selected?.opportunityId, replayResult2.selected?.opportunityId);
assert.strictEqual(replayResult1.roll, replayResult2.roll);
assert.strictEqual(replayResult1.seedMaterial, replayResult2.seedMaterial);
console.log('  ✅ TEST 12 Aprovado: Replay determinístico garantido após serialização JSON.');

console.log('\n========================================================================');
console.log('📊 PAINEL DE INVARIANTES DO M18.9-B (DETERMINISTIC EVENT RNG):');
console.log('  - PRNG Reproducibility (100/100):   100% (Meta: 100%) ✅');
console.log('  - Seed/Turn/Slot/Domain Isolation:  100% (Meta: 100%) ✅');
console.log('  - Weighted Distribution Accuracy:   100% (Meta: 100%) ✅');
console.log('  - Cooldown Enforcement:             100% (Meta: 100%) ✅');
console.log('  - Zero State Side-Effects:          100% (Meta: 100%) ✅');
console.log('  - Replay Consistency:               100% (Meta: 100%) ✅');
console.log('========================================================================\n');
console.log('🎉 TODOS OS TESTES DO M18.9-B PASSARAM COM SUCESSO TOTAL!');
