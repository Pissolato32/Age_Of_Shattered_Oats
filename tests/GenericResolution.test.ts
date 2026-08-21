import assert from 'node:assert/strict';
import { createInitialState } from '../src/engine';
import { RandomService } from '../src/core/RandomService';
import { CampaignState } from '../src/types';
import {
  classifyAction,
  resolveGenericPlausibleAction,
  GenericResolutionRequest
} from '../src/lib/genericResolution';

function createFreshState(type: 'Bastion' | 'Fortified Town' | 'Castle' | 'Walled City' = 'Fortified Town'): CampaignState {
  const s = createInitialState('Noble Ruler', 'Central Plains');
  s.holdings.type = type;
  s.weeklyLedger.silverdew = 1000;
  s.holdings.laborPool = 300;
  s.holdings.population = 2500;
  s.character.stats.commanderTier = 3;
  s.character.reputation = 20; // +2 bonus
  s.weeklyLedger.season = 'Sunreach';
  return s;
}

console.log('=== TESTES UNITÁRIOS DE RESOLUÇÃO GENÉRICA CONTEXTUAL (v0.2) ===');

// ---------------------------------------------------------------------------
// 1. Classificação CANONICAL vs PLAUSIBLE vs IMPOSSIBLE vs AMBIGUOUS
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  
  assert.equal(classifyAction({ action: 'RECRUIT' }, state).type, 'CANONICAL');
  assert.equal(classifyAction({ action: 'BUILD' }, state).type, 'CANONICAL');
  assert.equal(classifyAction({ action: 'TRAVEL' }, state).type, 'CANONICAL');
  assert.equal(classifyAction({ action: 'TRADE' }, state).type, 'CANONICAL');
  assert.equal(classifyAction({ action: 'DIPLOMACY' }, state).type, 'CANONICAL');

  assert.equal(classifyAction({ action: 'Ressuscitar morto com magia' }, state).type, 'IMPOSSIBLE');
  assert.equal(classifyAction({ action: 'Voar sem asas até a fortaleza' }, state).type, 'IMPOSSIBLE');
  assert.equal(classifyAction({ action: 'Criar ouro do nada' }, state).type, 'IMPOSSIBLE');

  assert.equal(classifyAction({ action: '' }, state).type, 'AMBIGUOUS');

  assert.equal(classifyAction({ action: 'Mandar homens limpar estrada ao norte' }, state).type, 'PLAUSIBLE_UNMODELED');
  assert.equal(classifyAction({ action: 'Subornar guarda da muralha' }, state).type, 'PLAUSIBLE_UNMODELED');
  console.log('[CLASSIFICATION] Canonical / Impossível / Ambíguo / Plausível -> OK');
}

// ---------------------------------------------------------------------------
// 2. Gargalos de Capacidade Real (Labor vs Settlement Tier vs Treasury)
// ---------------------------------------------------------------------------
{
  // Test Bastion (Cap derived from population/tier = 50)
  const bastionState = createFreshState('Bastion');
  bastionState.holdings.population = 1000;
  bastionState.holdings.laborPool = 500; // Much labor, but capped by structural work cap (50)

  const req: GenericResolutionRequest = { action: 'Reparar paliçada de madeira', parameters: { men: 100 } };
  const resBastion = resolveGenericPlausibleAction(req, bastionState, new RandomService(101));
  assert.equal(resBastion.classification, 'PLAUSIBLE_UNMODELED');
  assert.equal(resBastion.magnitude, 50, 'Deve ser limitado pelo teto de Bastion (50 homens)');

  // Test Treasury Limiting Capacity (Treasury of 2 SD supports max 20 men)
  const poorState = createFreshState('Castle');
  poorState.weeklyLedger.silverdew = 2; // 2 SD supports 20 men
  poorState.holdings.laborPool = 200;

  const resPoor = resolveGenericPlausibleAction(req, poorState, new RandomService(101));
  assert.equal(resPoor.magnitude, 20, 'Deve ser limitado pelo teto financeiro de apoio (20 homens)');

  // Test Walled City with low labor (30)
  const cityState = createFreshState('Walled City');
  cityState.holdings.laborPool = 30; // Labor is the bottleneck

  const resCity = resolveGenericPlausibleAction(req, cityState, new RandomService(101));
  assert.equal(resCity.magnitude, 30, 'Deve ser limitado pelo pool real de labor (30 homens)');

  // Zero labor failure
  const zeroLaborState = createFreshState();
  zeroLaborState.holdings.laborPool = 0;
  const resZero = resolveGenericPlausibleAction(req, zeroLaborState, new RandomService(101));
  assert.equal(resZero.outcome, 'FAILURE', 'Zero labor deve falhar graciosamente');

  console.log('[CAPACITY] Gargalos de labor, tesouraria e tier de assentamento respeitados -> OK');
}

// ---------------------------------------------------------------------------
// 3. Envelope Dinâmico e Variância de Magnitude em Ação Não-Fixada
// ---------------------------------------------------------------------------
{
  const state = createFreshState('Castle');
  state.holdings.laborPool = 200;
  state.holdings.population = 5000; // Structural cap = 250 men

  // Generic request without fixed count -> magnitude should vary within envelope [100, 200]
  const req: GenericResolutionRequest = { action: 'Desobstruir e limpar estrada' };

  const magnitudes = new Set<number>();
  for (let seed = 1; seed <= 50; seed++) {
    const res = resolveGenericPlausibleAction(req, state, new RandomService(seed));
    if (res.magnitude) magnitudes.add(res.magnitude);
  }

  assert.ok(magnitudes.size > 1, 'Magnitude não-fixada deve variar estocasticamente dentro do envelope.');
  console.log(`[ENVELOPE] Variância de magnitude comprovada (${magnitudes.size} valores distintos observados) -> OK`);
}

// ---------------------------------------------------------------------------
// 4. Teste de Monotonicidade Rigorosa (Liderança, Clima, Afinidade)
// ---------------------------------------------------------------------------
{
  const base = createFreshState();
  const req: GenericResolutionRequest = { action: 'Limpar estrada da colina', parameters: { men: 25 } };

  // Monotonicidade da Liderança
  const lowLeadState = { ...createFreshState(), character: { ...base.character, stats: { ...base.character.stats, commanderTier: 1 } } };
  const highLeadState = { ...createFreshState(), character: { ...base.character, stats: { ...base.character.stats, commanderTier: 5 } } };
  const pLowLead = resolveGenericPlausibleAction(req, lowLeadState, new RandomService(10)).probability ?? 0;
  const pHighLead = resolveGenericPlausibleAction(req, highLeadState, new RandomService(10)).probability ?? 0;
  assert.ok(pHighLead >= pLowLead, 'Liderança maior nunca pode reduzir a probabilidade de sucesso.');

  // Monotonicidade do Clima
  const summerSeason: 'Sunreach' = 'Sunreach';
  const winterSeason: 'Deepfrost' = 'Deepfrost';
  const summerState = { ...createFreshState(), weeklyLedger: { ...base.weeklyLedger, season: summerSeason } };
  const winterState = { ...createFreshState(), weeklyLedger: { ...base.weeklyLedger, season: winterSeason } };
  const pSummer = resolveGenericPlausibleAction(req, summerState, new RandomService(10)).probability ?? 0;
  const pWinter = resolveGenericPlausibleAction(req, winterState, new RandomService(10)).probability ?? 0;
  assert.ok(pSummer >= pWinter, 'Deepfrost nunca pode aumentar a probabilidade de sucesso.');

  // Monotonicidade da Afinidade
  const alliedState = createFreshState();
  alliedState.worldLedger.nobleHouses = [{ name: 'Target', region: 'Plains', currentLord: 'L', seat: 'S', tier: 3, status: 'Active', allies: [], enemies: [], opinion: 3, rumor: '', isRealRumor: false }];
  const hostileState = createFreshState();
  hostileState.worldLedger.nobleHouses = [{ name: 'Target', region: 'Plains', currentLord: 'L', seat: 'S', tier: 3, status: 'Active', allies: [], enemies: [], opinion: -3, rumor: '', isRealRumor: false }];

  const reqSub: GenericResolutionRequest = { action: 'Negociar salvo-conduto', targetId: 'Target', parameters: { amount: 50 } };
  const pAllied = resolveGenericPlausibleAction(reqSub, alliedState, new RandomService(10)).probability ?? 0;
  const pHostile = resolveGenericPlausibleAction(reqSub, hostileState, new RandomService(10)).probability ?? 0;
  assert.ok(pAllied >= pHostile, 'Opinião aliada nunca pode reduzir a probabilidade de negociação.');

  console.log('[MONOTONICITY] Monotonicidade de Liderança, Clima e Afinidade validada -> OK');
}

// ---------------------------------------------------------------------------
// 5. Accounting e Invariantes de Estado (Sem Cobrança Indevida em Falha)
// ---------------------------------------------------------------------------
{
  const state = createFreshState();
  state.weeklyLedger.silverdew = 100;

  state.worldLedger.nobleHouses = [
    {
      name: 'Enemy_Clan',
      region: 'North',
      currentLord: 'Warlord',
      seat: 'Fortress',
      tier: 4,
      status: 'Hostile',
      allies: [],
      enemies: [],
      opinion: -3,
      rumor: '',
      isRealRumor: false
    }
  ];

  const req: GenericResolutionRequest = { action: 'Subornar guarda', targetId: 'Enemy_Clan', parameters: { amount: 80 } };

  // Seed producing roll 1
  const mockRng: RandomService = {
    nextInt: () => 1
  } as unknown as RandomService;

  const res = resolveGenericPlausibleAction(req, state, mockRng);
  assert.equal(res.outcome, 'FAILURE');
  assert.equal(res.stateChanges.length, 0, 'Falha em suborno não pode deduzir prata');

  console.log('[ACCOUNTING] Invariantes contábeis preservadas sem deduções em falha -> OK');
}

// ---------------------------------------------------------------------------
// 6. Determinismo Estrito
// ---------------------------------------------------------------------------
{
  const stateA = createFreshState();
  const stateB = createFreshState();
  const frozenState = Object.freeze(JSON.parse(JSON.stringify(stateA)));

  const req: GenericResolutionRequest = { action: 'Limpar estrada', parameters: { men: 25 } };
  const res1 = resolveGenericPlausibleAction(req, frozenState, new RandomService(999));
  const res2 = resolveGenericPlausibleAction(req, stateB, new RandomService(999));

  assert.deepEqual(res1, res2, 'Mesma seed -> resultado idêntico');
  assert.equal(frozenState.weeklyLedger.silverdew, 1000, 'Estado de entrada deve ser imutável');

  console.log('[DETERMINISMO] Resolução reproduzível e puramente funcional -> OK');
}

console.log('GenericResolution test suite passed successfully.');
