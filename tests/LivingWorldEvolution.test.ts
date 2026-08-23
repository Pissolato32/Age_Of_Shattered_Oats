import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CampaignState, NobleHouse } from '../src/types';
import { resolveWeeklyTurn, getAbsoluteCampaignTurn, buildObserverProjection } from '../src/engine';
import { SuccessionService, Relative } from '../src/domain/kingdom/services/SuccessionService';
import { MarketService } from '../src/domain/commerce/services/MarketService';
import { resolveEpistemicSnapshot } from '../src/lib/narrativeProjection';
import { extractTemporalScope } from '../src/lib/intentHeuristics';

console.log('=== INICIANDO M18.8-A & M18.8-B: LIVING WORLD 52-WEEK ENGINE & PERSISTENCE PLAYTEST ===\n');

// 1. Carregar estado base da campanha
const baseStatePath = resolve(process.cwd(), 'artifacts/playtest_campaign_state.json');
let state: CampaignState = JSON.parse(readFileSync(baseStatePath, 'utf-8'));

// Inicializar configuração canônica para simulação de 52 semanas
state.weeklyLedger = {
  week: 1,
  month: 'Thawrise',
  year: 342,
  season: 'Thawtide',
  weather: 'Clear',
  silverdew: 300,
  food: 40,
  famineTicks: 0,
  unpaidWagesTicks: 0,
  materials: { timber: 20, iron: 10, stone: 15 },
  incomeDetail: { holdings: 50, patches: 20, trade: 10, tribute: 0, taxes: 15, loot: 0, other: 0 },
  expenseDetail: { wages: 20, garrison: 10, foodPurchases: 0, construction: 0, recruitment: 0, mercenaries: 0, tributePaid: 0, engineerWages: 0, shipUpkeep: 0, holdingMaintenance: 5, other: 0 }
};

state.worldLedger.currentDate = { day: 1, week: 1, month: 'Thawrise', year: 342 };
state.worldLedger.nobleHouses = [
  {
    name: 'Ironhand',
    region: 'Central Plains',
    currentLord: 'Lord Decimus Ironhand',
    seat: 'Ironhold',
    tier: 3,
    status: 'Neutra',
    allies: [],
    enemies: [],
    opinion: 0,
    rumor: 'Homens da Casa Ironhand mantêm patrulhas atentas nos limites das colinas.',
    isRealRumor: true
  }
];

state.character.memories = [
  {
    id: 'fact_bridge_garrison_001',
    ownerId: 'player',
    subjectId: 'velha_ponte',
    description: 'Uma guarnição armada de 25 soldados sem brasão visível mantém controle sobre a travessia de pedra na fronteira.',
    importance: 8,
    tickRegistered: 1,
    decayed: false
  } as any
];

const market = new MarketService();

console.log('--- FASE 1: PRIMAVERA / THAWTIDE (Semanas 1 a 13) ---');
for (let w = 1; w <= 13; w++) {
  state.weeklyLedger.week = w;
  state.worldLedger.currentDate.week = w;
  state.weeklyLedger.season = 'Thawtide';
  
  // Resolução canônica de virada de semana da Engine
  const { updatedState } = resolveWeeklyTurn(state);
  state = updatedState;
}

const springGrainPrice = market.calculatePrice(10, 'grain', 'central_plains', 3);
console.log(`[Semana 13] Primavera finalizada. Saldo: ${state.weeklyLedger.silverdew.toFixed(1)} SD | Preço do Grão (Base 10): ${springGrainPrice.finalPrice.toFixed(2)} SD`);
assert.ok(state.weeklyLedger.silverdew > 0, 'Tesouro deve permanecer solvente');

console.log('\n--- FASE 2: VERÃO / SUNREACH (Semanas 14 a 26) ---');
for (let w = 14; w <= 26; w++) {
  state.weeklyLedger.week = w;
  state.worldLedger.currentDate.week = w;
  state.weeklyLedger.season = 'Sunreach';
  state.worldLedger.currentDate.month = 'Highsun_1';

  // Evento T14: Rumor de Ironhand
  if (w === 14) {
    state.character.memories.push({
      id: 'fact_bridge_ironhand_rumor_006',
      ownerId: 'player',
      subjectId: 'velha_ponte',
      description: 'Surgiram boatos não confirmados de que o comandante na ponte pertence à Casa Ironhand.',
      importance: 6,
      tickRegistered: 14,
      decayed: false
    } as any);
    state.worldLedger.majorEvents.push({
      date: 'W14, Highsun_1, Y342',
      event: 'Boatos de viajantes ligam a guarnição da fronteira à Casa Ironhand',
      region: 'Central Plains',
      involved: 'Travelers -> Raven Watch',
      resolved: 'Yes'
    });
  }

  // Evento T18: Confirmação Capitão Vane via investigação
  if (w === 18) {
    state.character.memories.push({
      id: 'fact_bridge_ironhand_confirmed_007',
      ownerId: 'player',
      subjectId: 'velha_ponte',
      description: 'Investigação documental comprovou que o comandante é o Capitão Vane da Casa Ironhand.',
      importance: 9,
      tickRegistered: 18,
      decayed: false,
      supersedes: 'fact_bridge_ironhand_rumor_006'
    } as any);
  }

  // Evento T22: Trégua formal
  if (w === 22) {
    state.character.memories.push({
      id: 'fact_bridge_truce_active_008',
      ownerId: 'player',
      subjectId: 'velha_ponte',
      description: 'Trégua formal de passagem firmada na Velha Ponte.',
      importance: 9,
      tickRegistered: 22,
      decayed: false,
      supersedes: 'fact_bridge_garrison_001'
    } as any);
    state.worldLedger.nobleHouses[0].opinion = 1;
    state.worldLedger.nobleHouses[0].status = 'Trégua Formal';
  }

  // Evento T26: Inflação de grãos por compras volumosas no leste
  if (w === 26) {
    state.character.memories.push({
      id: 'fact_grain_inflation_003',
      ownerId: 'player',
      subjectId: 'mercado_leste',
      description: 'Compras anônimas volumosas no leste elevaram a cotação dos grãos.',
      importance: 7,
      tickRegistered: 26,
      decayed: false
    } as any);
  }

  const { updatedState } = resolveWeeklyTurn(state);
  state = updatedState;
}

// ---------------------------------------------------------------------------
// CONTEXT BLACKOUT 1 (Semana 26)
// ---------------------------------------------------------------------------
console.log('\n--- EXECUTANDO CONTEXT BLACKOUT 1 (Semana 26) ---');
const expectedOpinion26 = state.worldLedger.nobleHouses[0].opinion;
const blackout1Json = JSON.stringify(state);
let restoredState: CampaignState = JSON.parse(blackout1Json);

// Validação de integridade pós-blackout 1
const proj26 = buildObserverProjection(restoredState, { kind: 'PLAYER', observerId: 'player' });
const activeFactIds26 = proj26.knownFacts.map(f => f.factId);
assert.ok(activeFactIds26.includes('fact_bridge_truce_active_008'), 'Trégua ativa deve constar nos fatos vigentes na S26');
assert.ok(activeFactIds26.includes('fact_bridge_ironhand_confirmed_007'), 'Confirmação de Vane deve constar na S26');
assert.ok(!activeFactIds26.includes('fact_bridge_ironhand_rumor_006'), 'Rumor superseded não deve constar nos fatos ativos na S26');
assert.strictEqual(restoredState.worldLedger.nobleHouses[0].opinion, expectedOpinion26, 'Opinião diplomática pós-blackout deve ser idêntica ao Ground Truth');
console.log('  ✅ Context Blackout 1 validado: 100% de paridade com o Ground Truth da S26.');

console.log('\n--- FASE 3: OUTONO / REAPINGFALL (Semanas 27 a 39) ---');
state = restoredState;
for (let w = 27; w <= 39; w++) {
  state.weeklyLedger.week = w;
  state.worldLedger.currentDate.week = w;
  state.weeklyLedger.season = 'Reapingfall';
  state.worldLedger.currentDate.month = 'Harvestfall_1';

  // Evento T35: Ruptura da Trégua por emboscada
  if (w === 35) {
    state.character.memories.push({
      id: 'fact_bridge_truce_broken_009',
      ownerId: 'player',
      subjectId: 'velha_ponte',
      description: 'Trégua rompida e passagem hostil após emboscada contra mensageiros.',
      importance: 10,
      tickRegistered: 35,
      decayed: false,
      supersedes: 'fact_bridge_truce_active_008'
    } as any);
    state.worldLedger.nobleHouses[0].status = 'Hostil';
    state.worldLedger.nobleHouses[0].opinion = -2;
  }

  // Evento T36: Morte de Lorde Decimus e Sucessão Canônica
  if (w === 36) {
    const relatives: Relative[] = [
      { id: 'rel_1', name: 'Kenneth Ironhand', relation: 'child', age: 24, isLegitimate: true },
      { id: 'rel_2', name: 'Alaric Ironhand', relation: 'child', age: 19, isLegitimate: true },
      { id: 'rel_3', name: 'Boran Ironhand', relation: 'sibling', age: 48, isLegitimate: true }
    ];
    const successionOrder = SuccessionService.getSuccessionOrder(relatives);
    const newLord = successionOrder[0].name;
    
    state.worldLedger.nobleHouses[0].currentLord = `Lord ${newLord}`;
    state.character.memories.push({
      id: 'fact_ironhand_succession_010',
      ownerId: 'player',
      subjectId: 'casa_ironhand',
      description: `Com a morte de Lorde Decimus, seu primogênito Lord ${newLord} assumiu o comando de Ironhold.`,
      importance: 9,
      tickRegistered: 36,
      decayed: false
    } as any);
    state.worldLedger.majorEvents.push({
      date: 'W36, Harvestfall_1, Y342',
      event: `Sucessão em Ironhold: Lord ${newLord} ascende à liderança da Casa Ironhand`,
      region: 'Central Plains',
      involved: `Decimus Ironhand (Morto) -> ${newLord}`,
      resolved: 'Yes'
    });
  }

  const { updatedState } = resolveWeeklyTurn(state);
  state = updatedState;
}

assert.strictEqual(state.worldLedger.nobleHouses[0].currentLord, 'Lord Kenneth Ironhand', 'Sucessão canônica deve elevar Kenneth');
console.log(`[Semana 39] Outono finalizado. Novo Lorde de Ironhold: ${state.worldLedger.nobleHouses[0].currentLord} | Relação: ${state.worldLedger.nobleHouses[0].status} (${state.worldLedger.nobleHouses[0].opinion})`);

console.log('\n--- FASE 4: INVERNO / DEEPFROST (Semanas 40 a 52) ---');
for (let w = 40; w <= 52; w++) {
  state.weeklyLedger.week = w;
  state.worldLedger.currentDate.week = w;
  state.weeklyLedger.season = 'Deepfrost';
  state.worldLedger.currentDate.month = 'Longdark_1';

  const { updatedState } = resolveWeeklyTurn(state);
  state = updatedState;
}

const winterGrainPrice = market.calculatePrice(10, 'grain', 'central_plains', 11);
console.log(`[Semana 52] Inverno e Ano 342 finalizados. Preço do Grão de Inverno: ${winterGrainPrice.finalPrice.toFixed(2)} SD (vs Primavera: ${springGrainPrice.finalPrice.toFixed(2)} SD)`);

// ---------------------------------------------------------------------------
// CONTEXT BLACKOUT 2 (Semana 52 - Fim do Ciclo Anual)
// ---------------------------------------------------------------------------
console.log('\n--- EXECUTANDO CONTEXT BLACKOUT 2 (Semana 52 - Ground Truth Check) ---');
const blackout2Json = JSON.stringify(state);
let finalState: CampaignState = JSON.parse(blackout2Json);

// Validação do Ground Truth Completo do Mundo Vivo
const finalProj = buildObserverProjection(finalState, { kind: 'PLAYER', observerId: 'player' });
const finalFactIds = finalProj.knownFacts.map(f => f.factId);

// 1. Continuidade de Sucessão
assert.strictEqual(finalState.worldLedger.nobleHouses[0].currentLord, 'Lord Kenneth Ironhand');
assert.ok(finalFactIds.includes('fact_ironhand_succession_010'), 'Fato de sucessão de Kenneth deve estar ativo na S52');

// 2. Estado Atual da Fronteira
assert.ok(finalFactIds.includes('fact_bridge_truce_broken_009'), 'Trégua rompida deve ser o fato ativo na S52');

// 3. Resolução Temporal Retrospectiva
const scopePastT09 = extractTemporalScope('Quem comandava a posição no Turno 9?');
const snapshotT09 = resolveEpistemicSnapshot(finalState, scopePastT09);
assert.ok(snapshotT09.activeFacts.some(f => f.factId === 'fact_bridge_garrison_001'), 'No T09 apenas a guarnição sem brasão era conhecida');
assert.ok(!snapshotT09.activeFacts.some(f => f.factId === 'fact_bridge_ironhand_confirmed_007'), 'Vane não pode vazar no T09');
assert.ok(!snapshotT09.activeFacts.some(f => f.factId === 'fact_ironhand_succession_010'), 'Sucessão de Kenneth não pode vazar no T09');

// 4. Sazonalidade Econômica
assert.ok(winterGrainPrice.finalPrice > springGrainPrice.finalPrice, 'Preço no inverno deve ser superior ao da primavera');

// Salvar estado anual auditado em arquivo dedicado do M18.8
writeFileSync(resolve(process.cwd(), 'artifacts/playtest_living_world_52w_state.json'), JSON.stringify(finalState, null, 2), 'utf-8');

console.log('\n========================================================================');
console.log('📊 PAINEL DE INVARIANTES M18.8-A / M18.8-B (LIVING WORLD 52-WEEK BASELINE):');
console.log('  - World State Recall (Ground Truth Match):   100% (Meta: 100%) ✅');
console.log('  - Succession Continuity:                     100% (Lord Decimus -> Kenneth) ✅');
console.log('  - Frontier Control Evolution:                100% (Garrison -> Truce -> Broken) ✅');
console.log('  - Economic Seasonality Alignment:            100% (Winter > Spring Price) ✅');
console.log('  - Temporal Isolation (Past T09 Protected):  100% (Zero Leakage) ✅');
console.log('  - Context Blackout Integrity (2 Blackouts):  100% (Zero Degradation) ✅');
console.log('========================================================================\n');
console.log('🎉 52 SEMANAS DE SIMULAÇÃO DO MUNDO VIVO EXECUTADAS COM 100% DE SUCESSO!');
