import assert from 'node:assert/strict';
import { createInitialState, resolveWeeklyTurn, buildObserverProjection } from '../src/engine';
import { RandomService } from '../src/core/RandomService';
import { CampaignState } from '../src/types';
import {
  resolveGenericPlausibleAction,
  GenericResolutionRequest
} from '../src/lib/genericResolution';

export interface CampaignMetrics {
  readonly totalWeeks: number;
  readonly silverdewHistory: number[];
  readonly foodHistory: number[];
  readonly laborHistory: number[];
  readonly outcomesBySeason: Record<string, { SUCCESS: number; PARTIAL_SUCCESS: number; FAILURE: number; TOTAL: number }>;
  readonly actionsExecuted: number;
  readonly famineOccurrences: number;
  readonly defaultOccurrences: number;
  readonly totalEventsRecorded: number;
  readonly activeMemories: number;
  readonly decayedMemories: number;
  readonly expiredVows: number;
  readonly resolvedConsequences: number;
}

export function runCalibratedCampaign(
  totalWeeks: number = 520,
  seed: number = 777123,
  archetype: string = 'Noble Ruler',
  region: string = 'Central Plains',
  options: {
    addInitialVow?: boolean;
    addInitialPendingConsequence?: boolean;
  } = {}
): {
  finalState: CampaignState;
  metrics: CampaignMetrics;
  checkpointHashes: Record<number, string>;
} {
  const rng = new RandomService(seed);
  let state = createInitialState(archetype, region);

  // Initialize character memories
  state.character.memories = [
    {
      id: 'mem_init_01',
      ownerId: state.character.name,
      subjectId: 'Lord_Veyr',
      description: 'Firmou acordo inicial de paz nas fronteiras orientais',
      importance: 2, // Decays in 2 * 30 = 60 turns
      tickRegistered: 1,
      decayed: false
    }
  ];

  // Optional vow for testing
  if (options.addInitialVow) {
    if (!state.worldLedger.nobleHouses[0].vows) {
      state.worldLedger.nobleHouses[0].vows = [];
    }
    state.worldLedger.nobleHouses[0].vows.push({
      type: 'TratadoDeDefesaMutua',
      deadlineTick: 10, // Expires at week 10
      active: true,
      broken: false
    });
  }

  // Optional pending consequence for testing
  if (options.addInitialPendingConsequence) {
    if (!state.sessionLog.pendingConsequences) {
      state.sessionLog.pendingConsequences = [];
    }
    state.sessionLog.pendingConsequences.push({
      id: 'pc_caravan_investigation',
      kind: 'PENDING',
      description: 'Intendentes vizinhos concluíram o relatório sobre o pedágio na fronteira',
      triggerTurn: 15, // Triggers at week 15
      originAction: 'TRADE',
      resolved: false
    });
  }

  const silverdewHistory: number[] = [];
  const foodHistory: number[] = [];
  const laborHistory: number[] = [];

  const outcomesBySeason: Record<string, { SUCCESS: number; PARTIAL_SUCCESS: number; FAILURE: number; TOTAL: number }> = {
    Thawtide: { SUCCESS: 0, PARTIAL_SUCCESS: 0, FAILURE: 0, TOTAL: 0 },
    Sunreach: { SUCCESS: 0, PARTIAL_SUCCESS: 0, FAILURE: 0, TOTAL: 0 },
    Reapingfall: { SUCCESS: 0, PARTIAL_SUCCESS: 0, FAILURE: 0, TOTAL: 0 },
    Deepfrost: { SUCCESS: 0, PARTIAL_SUCCESS: 0, FAILURE: 0, TOTAL: 0 }
  };

  let actionsExecuted = 0;
  let famineOccurrences = 0;
  let defaultOccurrences = 0;
  const checkpointHashes: Record<number, string> = {};

  const actionPool: GenericResolutionRequest[] = [
    { action: 'Desobstruir e patrulhar a estrada principal da região' },
    { action: 'Reparar valas defensivas e paliçadas perimetrais' },
    { action: 'Negociar salvo-conduto com emissários locais', targetId: 'House_Stormcrest' },
    { action: 'Reforçar armazenamento de grãos no entreposto' },
    { action: 'Sondar rotas de abastecimento no vale' }
  ];

  for (let week = 1; week <= totalWeeks; week++) {
    // 1. Advance Canonical Weekly Turn in Engine (processes vows, memory decay, pending consequences, and eventStore)
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;

    if (state.weeklyLedger.food <= 0) famineOccurrences++;
    if (state.weeklyLedger.silverdew <= 0) defaultOccurrences++;

    // 2. Execute Generic Action v0.2 during turn
    const selectedAction = actionPool[rng.nextInt(0, actionPool.length - 1)];
    const genericResult = resolveGenericPlausibleAction(selectedAction, state, rng);
    actionsExecuted++;

    // Register outcome by season
    const currentSeason = state.weeklyLedger.season || 'Sunreach';
    if (!outcomesBySeason[currentSeason]) {
      outcomesBySeason[currentSeason] = { SUCCESS: 0, PARTIAL_SUCCESS: 0, FAILURE: 0, TOTAL: 0 };
    }

    if (genericResult.outcome === 'SUCCESS') outcomesBySeason[currentSeason].SUCCESS++;
    else if (genericResult.outcome === 'PARTIAL_SUCCESS') outcomesBySeason[currentSeason].PARTIAL_SUCCESS++;
    else if (genericResult.outcome === 'FAILURE') outcomesBySeason[currentSeason].FAILURE++;
    outcomesBySeason[currentSeason].TOTAL++;

    // Apply state changes to ongoing campaign state if action succeeded or partially succeeded
    for (const change of genericResult.stateChanges) {
      if (change.path === 'holdings.laborPool' && typeof change.after === 'number') {
        state.holdings.laborPool = Math.max(0, change.after);
      } else if (change.path === 'weeklyLedger.silverdew' && typeof change.after === 'number') {
        state.weeklyLedger.silverdew = Math.max(0, change.after);
      }
    }

    // Progression of character attributes gradually over years
    if (week % 52 === 0) {
      if (state.character.stats.commanderTier < 5 && rng.nextInt(1, 100) <= 50) {
        state.character.stats.commanderTier++;
      }
      state.character.reputation = Math.min(100, state.character.reputation + 2);
    }

    // Periodic sample of economic curves
    if (week % 4 === 0) {
      silverdewHistory.push(state.weeklyLedger.silverdew);
      foodHistory.push(state.weeklyLedger.food);
      laborHistory.push(state.holdings.laborPool);
    }

    // Checkpoint hashes
    if (week === 52 || week === 104 || week === 260 || week === 520) {
      checkpointHashes[week] = JSON.stringify({
        week: state.weeklyLedger.week,
        year: state.weeklyLedger.year,
        sd: state.weeklyLedger.silverdew,
        food: state.weeklyLedger.food,
        labor: state.holdings.laborPool,
        commanderTier: state.character.stats.commanderTier,
        reputation: state.character.reputation,
        eventCount: state.eventStore?.length || 0
      });
    }
  }

  const activeMem = (state.character.memories || []).filter(m => !m.decayed).length;
  const decayedMem = (state.character.memories || []).filter(m => m.decayed).length;
  const expiredVowsCount = (state.worldLedger.nobleHouses || []).reduce((sum, h) => sum + (h.vows || []).filter(v => !v.active).length, 0);
  const resolvedConsequencesCount = (state.sessionLog.pendingConsequences || []).filter(pc => pc.resolved).length;

  return {
    finalState: state,
    metrics: {
      totalWeeks,
      silverdewHistory,
      foodHistory,
      laborHistory,
      outcomesBySeason,
      actionsExecuted,
      famineOccurrences,
      defaultOccurrences,
      totalEventsRecorded: state.eventStore?.length || 0,
      activeMemories: activeMem,
      decayedMemories: decayedMem,
      expiredVows: expiredVowsCount,
      resolvedConsequences: resolvedConsequencesCount
    },
    checkpointHashes
  };
}

console.log('=== INICIANDO SIMULAÇÃO DE CALIBRAÇÃO DE LONGA DURAÇÃO (M13 - 10 ANOS / 520 SEMANAS) ===');

// Run 1: Primary 10-Year Campaign Run with Temporal Features
const campaign = runCalibratedCampaign(520, 777123, 'Noble Ruler', 'Central Plains', {
  addInitialVow: true,
  addInitialPendingConsequence: true
});
const m = campaign.metrics;

console.log(`\n1. DIAGNÓSTICO ECONÔMICO (520 Semanas / 10 Anos):`);
console.log(`  - Saldo Inicial de Prata: 300 SD | Final: ${campaign.finalState.weeklyLedger.silverdew} SD`);
console.log(`  - Reserva de Comida Inicial: 10 FSU | Final: ${campaign.finalState.weeklyLedger.food.toFixed(1)} FSU`);
console.log(`  - Mão de Obra Final: ${campaign.finalState.holdings.laborPool}`);
console.log(`  - Ocorrências de Fome (Comida <= 0): ${m.famineOccurrences} semanas (${((m.famineOccurrences / 520) * 100).toFixed(1)}%)`);
console.log(`  - Ocorrências de Default (Prata <= 0): ${m.defaultOccurrences} semanas (${((m.defaultOccurrences / 520) * 100).toFixed(1)}%)`);
console.log(`  - Total de Ações Genéricas Resolvidas: ${m.actionsExecuted}`);

console.log(`\n2. TAXAS DE DESFECHO POR ESTAÇÃO DO ANO:`);
for (const [season, stats] of Object.entries(m.outcomesBySeason)) {
  if (stats.TOTAL > 0) {
    const succ = ((stats.SUCCESS / stats.TOTAL) * 100).toFixed(1);
    const part = ((stats.PARTIAL_SUCCESS / stats.TOTAL) * 100).toFixed(1);
    const fail = ((stats.FAILURE / stats.TOTAL) * 100).toFixed(1);
    console.log(`  - [${season.padEnd(12)}] Total: ${stats.TOTAL.toString().padEnd(4)} | Sucesso: ${succ}% | Parcial: ${part}% | Falha: ${fail}%`);
  }
}

// Assert season impact: Deepfrost must have higher failure rate than Sunreach
const deepfrostFailRate = m.outcomesBySeason.Deepfrost.FAILURE / m.outcomesBySeason.Deepfrost.TOTAL;
const sunreachFailRate = m.outcomesBySeason.Sunreach.FAILURE / m.outcomesBySeason.Sunreach.TOTAL;
assert.ok(deepfrostFailRate > sunreachFailRate, 'Deepfrost deve apresentar taxa de falha superior a Sunreach em campanha contínua');
console.log(`\n  ✅ Impacto estacional validado: Falha em Inverno (${(deepfrostFailRate * 100).toFixed(1)}%) > Falha em Verão (${(sunreachFailRate * 100).toFixed(1)}%)`);

console.log(`\n3. CONTINUIDADE TEMPORAL (EVENTSTORE, MEMORYLOG, VOWS, PENDING):`);
console.log(`  - Eventos Fatuais Gravados no EventStore: ${m.totalEventsRecorded}`);
assert.equal(m.totalEventsRecorded, 520, 'EventStore deve registrar exatamente 520 turnos');
console.log(`  - Memórias Ativas: ${m.activeMemories} | Memórias Decaídas (*Decayed*): ${m.decayedMemories}`);
assert.equal(m.decayedMemories, 1, 'Memória com importância 2 deve ter decaído após 60 turnos no ano 10');
console.log(`  - Juramentos Expirados: ${m.expiredVows}`);
assert.equal(m.expiredVows, 1, 'Juramento de teste deve ter expirado no turno 10');
console.log(`  - Consequências Pendentes Concretizadas: ${m.resolvedConsequences}`);
assert.equal(m.resolvedConsequences, 1, 'Consequência agendada deve ter sido concretizada no turno 15');

console.log(`\n4. PROJEÇÃO NARRATIVA COM ATORES E MEMÓRIAS:`);
const projection = buildObserverProjection(campaign.finalState, { kind: 'PLAYER', observerId: campaign.finalState.character.name });
assert.ok(projection.actors.length > 1, 'Atores projetados devem conter o jogador e lordes locais');
console.log(`  - Total de Atores Projetados no Âmbito Local: ${projection.actors.length} (inclui ${projection.actors.map(a => a.name).join(', ')})`);
console.log(`  - Fatos e Rumores Projetados: ${projection.knownFacts.length}`);

console.log(`\n5. TESTE DE CAUSALIDADE E ISOLAMENTO DE IMPACTO:`);
// Scenario A: Sem Vow | Scenario B: Com Vow
const campaignA = runCalibratedCampaign(50, 111222, 'Noble Ruler', 'Central Plains', { addInitialVow: false });
const campaignB = runCalibratedCampaign(50, 111222, 'Noble Ruler', 'Central Plains', { addInitialVow: true });

// Assert economics are strictly identical
assert.equal(campaignA.finalState.weeklyLedger.silverdew, campaignB.finalState.weeklyLedger.silverdew, 'Economia de prata deve ser 100% idêntica');
assert.equal(campaignA.finalState.weeklyLedger.food, campaignB.finalState.weeklyLedger.food, 'Reserva de comida deve ser 100% idêntica');
assert.equal(campaignA.metrics.expiredVows, 0, 'Campanha A não deve ter vows expirados');
assert.equal(campaignB.metrics.expiredVows, 1, 'Campanha B deve ter 1 vow expirado');
console.log('  ✅ Causalidade de Juramento comprovada: A divergência ocorre exclusivamente no estado de Vows sem efeitos colaterais espúrios.');

console.log(`\n6. VALIDAÇÃO DE REPLAY DETERMINÍSTICO (RE-RUN COM MESMA SEED):`);
const replayCampaign = runCalibratedCampaign(520, 777123, 'Noble Ruler', 'Central Plains', {
  addInitialVow: true,
  addInitialPendingConsequence: true
});
for (const week of [52, 104, 260, 520]) {
  assert.equal(
    replayCampaign.checkpointHashes[week],
    campaign.checkpointHashes[week],
    `Checkpoint na semana ${week} deve ser 100% idêntico na reprodução determinística`
  );
  console.log(`  ✅ Checkpoint semana ${week.toString().padEnd(3)} (Ano ${week / 52}): Hash idêntico (100% Determinístico)`);
}

console.log('\nCampaignCalibrationSimulation test suite passed successfully.');
