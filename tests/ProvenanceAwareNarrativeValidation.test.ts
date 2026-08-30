import assert from 'node:assert/strict';
import { validateNarrativeConsistency } from '../src/lib/semanticValidation';
import { ExecutionReport, NarrativeContext, AuthorizedKnowledgeFact, NARRATIVE_CONTRACT_VERSION } from '../src/lib/narrativeContracts';

console.log('=== TEST SUITE: Provenance-Aware Narrative Validation (M18.8.1) ===\n');

const factVaneConfirmed: AuthorizedKnowledgeFact = {
  factId: 'fact_bridge_ironhand_confirmed_007',
  subjectId: 'velha_ponte',
  statement: 'No Turno 18, a investigação documental comprovou que o comandante é o Capitão Vane da Casa Ironhand.',
  tier: 'PLAYER_KNOWLEDGE',
  certainty: 'CONFIRMED',
  source: 'ENGINE',
  createdTurn: 18,
  createdDate: 'Year 342, Highsun_2, Week 4',
  tags: ['ponte', 'vane', 'ironhand', 'fronteira']
};

const factGarrison: AuthorizedKnowledgeFact = {
  factId: 'fact_bridge_garrison_001',
  subjectId: 'velha_ponte',
  statement: 'Uma guarnição armada de 25 soldados sem brasão visível mantém controle sobre a travessia de pedra na fronteira.',
  tier: 'PLAYER_KNOWLEDGE',
  certainty: 'CONFIRMED',
  source: 'ENGINE',
  createdTurn: 9,
  createdDate: 'Year 342, Highsun_1, Week 1',
  tags: ['ponte', 'fronteira', 'guarnicao']
};

const baseReport: ExecutionReport = {
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
  reasonCode: 'Consulta factual de inteligência'
};

const baseContext: NarrativeContext = {
  contractVersion: NARRATIVE_CONTRACT_VERSION,
  observer: { kind: 'PLAYER', observerId: 'player' },
  scene: {
    locationId: 'grey_keep',
    regionName: 'Central Plains',
    environment: 'Castle',
    weather: 'Clear',
    season: 'Deepfrost'
  },
  actors: [],
  relationships: [],
  knownFacts: [factGarrison, factVaneConfirmed],
  recentEvents: [],
  executionResult: baseReport,
  narrativeConstraints: [],
  query: {
    playerInput: 'O que mudou nas fronteiras?',
    originalAction: 'INFORMATION',
    temporalScope: { mode: 'CURRENT_STATE', targetTurn: 52 }
  }
};

// ---------------------------------------------------------------------------
// TESTE 1: Referência histórica comprovada e autorizada (PT-017 RESOLUTION)
// ---------------------------------------------------------------------------
console.log('[TEST 1] Referência a fato investigativo histórico autorizado...');
const nar1 = "A investigação documental comprovou que o Capitão Vane da Casa Ironhand comanda a travessia de pedra.";
const v1 = validateNarrativeConsistency(baseReport, baseContext, nar1);
assert.strictEqual(v1.length, 0, 'Referência histórica legítima a fato autorizado em knownFacts deve ser ACEITA');
console.log('  ✅ TEST 1 Aprovado: Referência a fato histórico aceita sem falso positivo.');

// ---------------------------------------------------------------------------
// TESTE 2: Confirmação e registros históricos com menção de atores
// ---------------------------------------------------------------------------
console.log('[TEST 2] Citação de confirmação por registros históricos...');
const nar2 = "Os registros antigos confirmam que o oficial na velha ponte pertence à Casa Ironhand.";
const v2 = validateNarrativeConsistency(baseReport, baseContext, nar2);
assert.strictEqual(v2.length, 0, 'Citação de confirmação apoiada em knownFacts deve ser ACEITA');
console.log('  ✅ TEST 2 Aprovado: Citação de confirmação autorizada aceita.');

// ---------------------------------------------------------------------------
// TESTE 3: Descoberta com atribuição de turno histórico anterior
// ---------------------------------------------------------------------------
console.log('[TEST 3] Descoberta histórica com atribuição temporal (T18 no contexto T52)...');
const nar3 = "Nossos batedores revelaram no Turno 18 que o Capitão Vane liderava a guarnição da ponte.";
const v3 = validateNarrativeConsistency(baseReport, baseContext, nar3);
assert.strictEqual(v3.length, 0, 'Descoberta com proveniência histórica em knownFacts deve ser ACEITA');
console.log('  ✅ TEST 3 Aprovado: Descoberta histórica autorizada aceita.');

// ---------------------------------------------------------------------------
// TESTE 4: Invenção de nova espionagem sem relatório mecânico (Violação Real)
// ---------------------------------------------------------------------------
console.log('[TEST 4] Alegação de nova investigação não autorizada na corte...');
const nar4 = "Roric realizou uma nova investigação secreta e descobriu conspirações na corte de Silverfall.";
const v4 = validateNarrativeConsistency(baseReport, baseContext, nar4);
assert.ok(v4.some(v => v.code === 'INVENTED_MECHANICAL_CONSEQUENCE'), 'Nova investigação sem fato nem discoveredInformation deve ser REJEITADA');
console.log('  ✅ TEST 4 Aprovado: Invenção de nova espionagem barrada.');

// ---------------------------------------------------------------------------
// TESTE 5: Alucinação de rastreamento de entidade inexistente (Violação Real PT-005)
// ---------------------------------------------------------------------------
console.log('[TEST 5] Alucinação de rastreamento até local não mapeado (Ironpeak)...');
const militaryReport: ExecutionReport = {
  ...baseReport,
  actionExecuted: 'MILITARY',
  command: { commandId: 'cmd_002', actorId: 'player', action: 'MILITARY' }
};
const nar5 = "Os batedores seguiram o mensageiro capturado até as masmorras de Ironpeak.";
const v5 = validateNarrativeConsistency(militaryReport, baseContext, nar5);
assert.ok(v5.some(v => v.code === 'INVENTED_MECHANICAL_CONSEQUENCE'), 'Rastreamento até local inexistente nos fatos deve ser REJEITADO');
console.log('  ✅ TEST 5 Aprovado: Rastreamento espúrio até entidade inexistente barrado.');

// ---------------------------------------------------------------------------
// TESTE 6: Violação de Escopo Temporal (Fato de T18 afirmado como conhecido em T09)
// ---------------------------------------------------------------------------
console.log('[TEST 6] Violação de Escopo Temporal (Fato de T18 reivindicado no T09)...');
const pastContextT09: NarrativeContext = {
  ...baseContext,
  knownFacts: [factGarrison], // Apenas o fato do Turno 9 está visível
  query: {
    playerInput: 'Quem comandava no Turno 9?',
    originalAction: 'INFORMATION',
    temporalScope: { mode: 'HISTORICAL_POINT', targetTurn: 9 }
  }
};
const nar6 = "Descobrimos na travessia que o Capitão Vane da Casa Ironhand era o comandante.";
const v6 = validateNarrativeConsistency(baseReport, pastContextT09, nar6);
assert.ok(v6.some(v => v.code === 'INVENTED_MECHANICAL_CONSEQUENCE'), 'Afirmação sobre fato não existente na janela temporal T09 deve ser REJEITADA');
console.log('  ✅ TEST 6 Aprovado: Violação temporal de fato futuro barrada.');

console.log('\n========================================================================');
console.log('📊 PAINEL DE INVARIANTES DO M18.8.1 (PROVENANCE-AWARE VALIDATION):');
console.log('  - AUTHORIZED_FACT_ACCEPTANCE: 100% (Meta: 100%) ✅');
console.log('  - False Rejection Rate:       0%   (Meta: 0%)   ✅');
console.log('  - False Acceptance Rate:      0%   (Meta: 0%)   ✅');
console.log('========================================================================\n');
console.log('🎉 TODOS OS TESTES DE VALIDAÇÃO DE PROVENIÊNCIA PASSARAM COM SUCESSO!');
