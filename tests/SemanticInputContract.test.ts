import assert from 'node:assert/strict';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { buildObserverProjection, createInitialState } from '../src/engine';
import { createSliceState, PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';
import { NARRATIVE_CONTRACT_VERSION, ExecutionReport } from '../src/lib/narrativeContracts';

const mock = new MockNarrativeLLM();
const state = createSliceState();
const projection = buildObserverProjection(state, PLAYER_OBSERVER);

// ---------------------------------------------------------------------------
// TEST 1 — Structured Contract Guarantee
// ---------------------------------------------------------------------------
{
  const cmd = await mock.interpret({ playerInput: 'Quero recrutar 30 soldados.', projection });

  assert.equal(cmd.contractVersion, NARRATIVE_CONTRACT_VERSION);
  assert.equal(cmd.actorId, 'player');
  assert.equal(cmd.action, 'RECRUIT');
  assert.deepEqual(cmd.magnitude, { mode: 'FIXED', value: 30 });
  assert.equal(typeof cmd.confidence, 'number');
  assert.ok(Array.isArray(cmd.ambiguity));
  assert.equal(cmd.requiresClarification, false);

  // Interpreter MUST NOT emit mechanical execution properties
  assert.equal('decision' in cmd, false);
  assert.equal('delta' in cmd, false);
  assert.equal('stateChanges' in cmd, false);
  assert.equal('consequences' in cmd, false);

  console.log('[TEST 1] Contrato estruturado sem vazamento mecânico -> OK');
}

// ---------------------------------------------------------------------------
// TEST 2 — Stance Extraction (Honor, Aggression, Caution, Diplomacy)
// ---------------------------------------------------------------------------
{
  const agg = await mock.interpret({ playerInput: 'Ameaçar os camponeses e recrutar à força.', projection });
  assert.equal(agg.stance, 'AGGRESSIVE');

  const caut = await mock.interpret({ playerInput: 'Viajar cautelosamente para Central Plains.', projection });
  assert.equal(caut.stance, 'CAUTIOUS');

  const diplo = await mock.interpret({ playerInput: 'Negociar acordo diplomático com os vizinhos.', projection });
  assert.equal(diplo.stance, 'DIPLOMATIC');

  const hon = await mock.interpret({ playerInput: 'Recrutar com honra e lealdade.', projection });
  assert.equal(hon.stance, 'HONORABLE');

  console.log('[TEST 2] Extração de Stance semântico (AGGRESSIVE, CAUTIOUS, DIPLOMATIC, HONORABLE) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 3 — Ambiguous Target / Missing Entity Handling
// ---------------------------------------------------------------------------
{
  // Fala sem alvo especificado
  const speakNoTarget = await mock.interpret({ playerInput: 'Quero falar com ele agora.', projection });
  assert.equal(speakNoTarget.requiresClarification, true);
  assert.ok(speakNoTarget.ambiguity.length > 0);

  // Construção sem estrutura especificada
  const buildNoStructure = await mock.interpret({ playerInput: 'Quero construir algo no pátio.', projection });
  assert.equal(buildNoStructure.requiresClarification, true);
  assert.ok(buildNoStructure.ambiguity.length > 0);

  // Viagem sem destino
  const travelNoDest = await mock.interpret({ playerInput: 'Quero marchar com as tropas.', projection });
  assert.equal(travelNoDest.requiresClarification, true);

  console.log('[TEST 3] Ambiguidade e alvos ausentes exigem esclarecimento -> OK');
}

// ---------------------------------------------------------------------------
// TEST 4 — Impossible Actions
// ---------------------------------------------------------------------------
{
  const killKing = await mock.interpret({ playerInput: 'Eu mato o rei instantaneamente.', projection });
  assert.equal(killKing.action, 'UNKNOWN');
  assert.equal(killKing.requiresClarification, false);

  console.log('[TEST 4] Ações impossíveis geram ação não-canônica UNKNOWN -> OK');
}

// ---------------------------------------------------------------------------
// TEST 5 — Determinism of Interpretation
// ---------------------------------------------------------------------------
{
  const input = { playerInput: 'Quero comprar madeira no mercado.', projection };
  const res1 = await mock.interpret(input);
  const res2 = await mock.interpret(input);

  assert.deepEqual(res1, res2, 'Interpretações da mesma entrada devem ser estritamente idênticas');

  console.log('[TEST 5] Determinismo estrito do interpretador -> OK');
}

// ---------------------------------------------------------------------------
// TEST 6 — Operational Espionage Reconnaissance (Regression Test)
// ---------------------------------------------------------------------------
{
  const spyInput = await mock.interpret({
    playerInput: 'Roric, envie novamente os batedores para a velha ponte de pedra. Quero descobrir quem está acampado ali, mas mantenha-os ocultos e evite qualquer confronto.',
    projection
  });

  assert.equal(spyInput.action, 'ESPIONAGE');
  assert.equal(spyInput.locationId, 'velha ponte de pedra');
  // Variação morfológica nominal ("aprofundar investigação na...")
  const spyInput2 = await mock.interpret({
    playerInput: 'Roric, aprofunde a investigação na velha ponte. Quero descobrir quem comanda aquele destacamento e a qual Casa ou senhor eles respondem. Continue evitando confronto e não envie mais homens do que o necessário.',
    projection
  });

  assert.equal(spyInput2.action, 'ESPIONAGE');
  assert.equal(spyInput2.locationId, 'velha ponte');
  assert.equal(spyInput2.stance, 'CAUTIOUS');
  assert.equal(spyInput2.requiresClarification, false);

  console.log('[TEST 6] Reconhecimento e espionagem operacional classificados como ESPIONAGE com local derivado -> OK');
}

// ---------------------------------------------------------------------------
// TEST 7 — Formal Diplomatic Mission (Regression Test)
// ---------------------------------------------------------------------------
{
  const diploInput = await mock.interpret({
    playerInput: 'Tobin, envie uma comitiva formal à ponte velha sob bandeira de trégua. Quero exigir que os homens ali se identifiquem e informem sob qual autoridade estão operando. Não ofereça dinheiro nem faça ameaças.',
    projection
  });

  assert.equal(diploInput.action, 'DIPLOMACY');
  assert.equal(diploInput.targetId, 'ponte velha');
  assert.equal(diploInput.requiresClarification, false);

  console.log('[TEST 7] Missão diplomática formal e comitivas classificadas como DIPLOMACY -> OK');
}

// ---------------------------------------------------------------------------
// TEST 8 — Tactical Military Deployment (Regression Test)
// ---------------------------------------------------------------------------
{
  const milInput = await mock.interpret({
    playerInput: 'Roric, mobilize um pequeno destacamento para estabelecer um piquete na encruzilhada da estrada norte. Quero pressionar o acampamento e interromper seus suprimentos, mas não ataque nem tente tomar a ponte. Se houver resistência, recue.',
    projection
  });

  assert.equal(milInput.action, 'MILITARY');
  assert.equal(milInput.targetId, 'encruzilhada da estrada norte');
  assert.equal(milInput.stance, 'CAUTIOUS');
  assert.equal(milInput.requiresClarification, false);

  console.log('[TEST 8] Mobilização tática e piquetes classificados como MILITARY com postura cautelosa -> OK');
}

// ---------------------------------------------------------------------------
// TEST 9 — Factual Grounding Violation Prevention (P0-B)
// ---------------------------------------------------------------------------
{
  const { validateNarrativeConsistency } = await import('../src/lib/semanticValidation');

  const ungroundedNarrative = 'Os batedores seguiram o rastro pelas ravinas e o mensageiro seguiu até Ironpeak, comprovando a ligação com a Casa Ironhand.';
  const report: import('../src/lib/narrativeContracts').ExecutionReport = {
    reportId: 'rep_test_9',
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    status: 'ACCEPTED',
    actionExecuted: 'MILITARY',
    command: {
      commandId: 'cmd_test_9',
      actorId: 'player',
      action: 'MILITARY'
    },
    reasonCode: 'Resolução genérica contextual executada: SUCCESS (roll=12, atrito=7).',
    discoveredInformation: [],
    affectedEntities: [],
    hiddenInformationIds: [],
    events: [],
    consequences: [
      {
        consequenceId: 'csq_test_9',
        kind: 'IMMEDIATE',
        description: 'O destacamento militar manobrou no terreno e estabeleceu a posição tática ordenada.',
        authorized: true
      }
    ],
    stateChanges: []
  };

  const violations = validateNarrativeConsistency(report, null, ungroundedNarrative, {
    excludedSecretStatements: ['Ironpeak', 'Barão Valerius']
  });

  assert.ok(violations.length > 0, 'Validador deve rejeitar narrativa com descobertas não autorizadas');
  assert.ok(violations.some(v => v.code === 'SECRET_LEAKAGE' || v.code === 'INVENTED_MECHANICAL_CONSEQUENCE'));

  console.log('[TEST 9] Grounding factual estrito: alucinações de espionagem/segredos em ações militares barradas -> OK');
}

// ---------------------------------------------------------------------------
// TEST 10 — Authoritative Weekly Turn Persistence in Playtest Runner (P0-A)
// ---------------------------------------------------------------------------
{
  const { executePlaytestTurnPristine, loadOrCreatePlaytestState, savePlaytestState } = await import('../src/tools/PlaytestSessionRunner');

  const testState = createInitialState('Landed Knight', 'Central Plains');
  testState.weeklyLedger.silverdew = 300.0;
  testState.weeklyLedger.food = 40.0;
  testState.worldLedger.currentDate = { day: 1, month: 'Bloom', year: 342, week: 1 };
  savePlaytestState(testState);

  const res = await executePlaytestTurnPristine('Roric, mantenha a vigilância na fronteira.');

  const persistedState = loadOrCreatePlaytestState();

  // Check that persisted state exactly matches the trace entry and week progressed
  assert.equal(persistedState.weeklyLedger.silverdew, res.traceEntry.stateAfter.silverdew);
  assert.equal(persistedState.worldLedger.currentDate.week, 2);
  assert.equal(res.traceEntry.turn, 2);

  console.log('[TEST 10] Runner persiste e aplica ciclo econômico e avanço de semana canônico -> OK');
}

// ---------------------------------------------------------------------------
// TEST 11 — Imperative Material Purchasing Resolution (TRADE)
// ---------------------------------------------------------------------------
{
  const { executePlaytestTurnPristine, loadOrCreatePlaytestState, savePlaytestState } = await import('../src/tools/PlaytestSessionRunner');

  const testState = createInitialState('Landed Knight', 'Central Plains');
  testState.weeklyLedger.month = 'Greening';
  testState.weeklyLedger.season = 'Thawtide';
  testState.weeklyLedger.silverdew = 314.5;
  testState.weeklyLedger.materials.timber = 0;
  testState.worldLedger.currentDate = { day: 1, month: 'Greening', year: 342, week: 2 };
  savePlaytestState(testState);

  const res = await executePlaytestTurnPristine(
    'Gerold, compre madeira seca suficiente para os reparos urgentes identificados por Aldren. Negocie com os comboios fluviais pelo melhor preço possível.'
  );

  assert.equal(res.traceEntry.classifiedAction, 'TRADE');
  assert.equal(res.traceEntry.engineResult.actionExecuted, 'TRADE');
  assert.equal(res.traceEntry.engineResult.mutated, true);

  const persistedState = loadOrCreatePlaytestState();
  // Cost: -15 SD, Timber: +20. Weekly delta: +92.5 - 70 - 8 = +14.5 SD -> Final: 314.5 - 15 + 14.5 = 314.0 SD
  assert.equal(persistedState.weeklyLedger.materials.timber, 20);
  assert.equal(persistedState.weeklyLedger.silverdew, 314.0);

  console.log('[TEST 11] Compra imperativa de materiais resolve TRADE e credita estoque mecânico -> OK');
}

// ---------------------------------------------------------------------------
// TEST 12 — Contextual Mobilization Disambiguation & Mechanical Build (PT-008)
// ---------------------------------------------------------------------------
{
  const { MockNarrativeLLM } = await import('../src/lib/mockNarrativeLLM');
  const mockLLM = new MockNarrativeLLM();

  const cmdWorkerPalisade = await mockLLM.interpret({ playerInput: 'Mobilize 20 trabalhadores para reparar a paliçada', projection });
  assert.equal(cmdWorkerPalisade.action, 'BUILD', 'Mobilização de trabalhadores para paliçada deve ser BUILD');

  const cmdSoldierPatrol = await mockLLM.interpret({ playerInput: 'Mobilize 20 soldados para patrulhar a estrada', projection });
  assert.equal(cmdSoldierPatrol.action, 'MILITARY', 'Mobilização de soldados para patrulha deve ser MILITARY');

  const cmdWorkerTower = await mockLLM.interpret({ playerInput: 'Mobilize trabalhadores para construir uma torre defensiva', projection });
  assert.equal(cmdWorkerTower.action, 'BUILD', 'Mobilização de trabalhadores para torre deve ser BUILD');

  const { executePlaytestTurnPristine, loadOrCreatePlaytestState, savePlaytestState } = await import('../src/tools/PlaytestSessionRunner');

  const testState = createInitialState('Landed Knight', 'Central Plains');
  testState.weeklyLedger.month = 'Greening';
  testState.weeklyLedger.season = 'Thawtide';
  testState.weeklyLedger.silverdew = 314.0;
  testState.weeklyLedger.materials.timber = 40;
  testState.holdings.laborPool = 395;
  testState.worldLedger.currentDate = { day: 1, month: 'Greening', year: 342, week: 3 };
  savePlaytestState(testState);

  const res = await executePlaytestTurnPristine(
    'Aldren, inicie os reparos urgentes identificados na inspeção. Use apenas a madeira necessária para reparar o trecho norte da paliçada e reforçar estruturalmente a torre leste. Mobilize os 20 trabalhadores necessários, mas não realize outras obras além dessas duas. Se os materiais forem insuficientes, pare e informe o que falta.'
  );

  assert.equal(res.traceEntry.classifiedAction, 'BUILD');
  assert.equal(res.traceEntry.engineResult.actionExecuted, 'BUILD');
  assert.equal(res.traceEntry.engineResult.mutated, true);

  const persistedState = loadOrCreatePlaytestState();
  // Timber: 40 - 20 = 20
  assert.equal(persistedState.weeklyLedger.materials.timber, 20);
  // Action delta: 20 workers mobilized
  const laborActionDelta = res.traceEntry.actionDeltas.find(d => d.path === 'holdings.laborPool');
  assert.equal(laborActionDelta?.delta, -20);
  // Silverdew: 314.0 - 50 (build wages) + 14.5 (weekly net) = 278.5 SD
  assert.equal(persistedState.weeklyLedger.silverdew, 278.5);

  console.log('[TEST 12] Desambiguação contextual de mobilização (trabalhadores->BUILD vs soldados->MILITARY) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 13 — GeminiNarrativeLLM Offline Parity & Schema Validation
// ---------------------------------------------------------------------------
{
  const { GeminiNarrativeLLM } = await import('../src/lib/geminiNarrativeLLM');

  // Modo offline (sem API key)
  const offlineGemini = new GeminiNarrativeLLM({ apiKey: undefined });

  // 1. "aprofunde a investigação" NÃO deve cair em INFORMATION por substring "ação"
  const cmdInvest = await offlineGemini.interpret({ playerInput: 'aprofunde a investigação na velha ponte de pedra', projection });
  assert.equal(cmdInvest.action, 'ESPIONAGE', 'Fallback offline deve classificar investigação como ESPIONAGE');

  // 2. "comitiva formal sob trégua" deve ser DIPLOMACY
  const cmdDiplo = await offlineGemini.interpret({ playerInput: 'enviar comitiva formal sob trégua', projection });
  assert.equal(cmdDiplo.action, 'DIPLOMACY', 'Fallback offline deve classificar comitiva como DIPLOMACY');

  // 3. "compre madeira pelo melhor preço" deve ser TRADE
  const cmdTrade = await offlineGemini.interpret({ playerInput: 'Gerold, compre madeira seca pelo melhor preço possível', projection });
  assert.equal(cmdTrade.action, 'TRADE', 'Fallback offline deve classificar compra como TRADE');

  // 4. "mobilize 20 trabalhadores para reparar a paliçada" deve ser BUILD
  const cmdBuild = await offlineGemini.interpret({ playerInput: 'Aldren, mobilize 20 trabalhadores para reparar a paliçada', projection });
  assert.equal(cmdBuild.action, 'BUILD', 'Fallback offline deve classificar mobilização de trabalhadores como BUILD');

  // 5. "Roric, avalie militarmente a posição" deve ser INFORMATION
  const cmdInfo = await offlineGemini.interpret({ playerInput: 'Roric, avalie militarmente a posição na velha ponte sem mover tropas', projection });
  assert.equal(cmdInfo.action, 'INFORMATION', 'Fallback offline deve classificar consulta como INFORMATION');

  // 6. Schema validation: Modelo retornando ação não-canônica "ATTACK" deve ser sanitizado para UNKNOWN
  const fakeFetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ action: 'ATTACK', confidence: 0.9 }) }] } }]
    })
  } as unknown as Response);

  const onlineMockGemini = new GeminiNarrativeLLM({ apiKey: 'fake-key', fetchFn: fakeFetch as unknown as typeof fetch });
  const cmdSanitized = await onlineMockGemini.interpret({ playerInput: 'atacar a guarnição', projection });
  assert.equal(cmdSanitized.action, 'UNKNOWN', 'Ação não-canônica ATTACK deve ser sanitizada para UNKNOWN');

  console.log('[TEST 13] Paridade total offline do GeminiNarrativeLLM e validação de schema -> OK');
}

// ---------------------------------------------------------------------------
// TEST 14 — Factual Persistence and Retrieval Without Conversation Context (PT-009)
// ---------------------------------------------------------------------------
{
  const { executePlaytestTurnPristine, loadOrCreatePlaytestState, savePlaytestState } = await import('../src/tools/PlaytestSessionRunner');
  const { MockNarrativeLLM } = await import('../src/lib/mockNarrativeLLM');

  // 1. Executa inspeção de defesas (T07)
  const testState = createInitialState('Landed Knight', 'Central Plains');
  testState.weeklyLedger.silverdew = 302.0;
  testState.worldLedger.currentDate = { day: 1, month: 'Highsun_1', year: 342, week: 3 };
  savePlaytestState(testState);

  const resT07 = await executePlaytestTurnPristine('Aldren, faça uma nova inspeção das defesas de Ravens Watch e registre quais estruturas ainda apresentam vulnerabilidades, mas não inicie nenhuma obra.');

  assert.equal(resT07.traceEntry.classifiedAction, 'INFORMATION');
  assert.ok(resT07.traceEntry.engineResult.discoveredInformation, 'ExecutionReport deve conter discoveredInformation');
  assert.ok(resT07.traceEntry.engineResult.discoveredInformation.length > 0, 'Deve emitir fatos de inspeção autorizados');

  const persistedAfterT07 = loadOrCreatePlaytestState();
  assert.ok(persistedAfterT07.character.memories, 'Memórias do personagem devem estar presentes');
  assert.ok(persistedAfterT07.character.memories.some(m => m.subjectId === 'holdings.fortification'), 'Fato de inspeção deve ser persistido no estado');

  // 2. Executa pergunta de recuperação (T08) sem contexto anterior
  const resT08 = await executePlaytestTurnPristine("Aldren, retome o último relatório de inspeção das defesas de Raven's Watch. Sem realizar nova inspeção, diga-me quais estruturas foram consideradas vulneráveis.");

  assert.equal(resT08.traceEntry.classifiedAction, 'INFORMATION');
  assert.ok(resT08.traceEntry.llmResponse.includes('paliçada defensiva') || resT08.traceEntry.llmResponse.includes('Paliçada'), 'Narrativa deve recuperar o fato persistido na memória');
  assert.ok(resT08.traceEntry.llmResponse.includes('vulneráveis'), 'Narrativa deve recuperar as vulnerabilidades registradas');

  console.log('[TEST 14] Persistência factual e recuperação estrita de memória do CampaignState (PT-009) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 15 — Regression for PT-011 (Passive Voice Espionage) and PT-012 (Coin Cost Contradiction)
// ---------------------------------------------------------------------------
{
  const { validateNarrativeConsistency } = await import('../src/lib/semanticValidation');

  const reportMilitary: ExecutionReport = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    reportId: 'rpt_test_15_mil',
    command: {
      commandId: 'cmd_test_15_mil',
      actorId: 'player',
      action: 'MILITARY'
    },
    status: 'ACCEPTED',
    actionExecuted: 'MILITARY',
    affectedEntities: [],
    discoveredInformation: [],
    hiddenInformationIds: [],
    events: [],
    reasonCode: 'Manobra militar autorizada.',
    consequences: [],
    stateChanges: [{ path: 'weeklyLedger.silverdew', before: 300, after: 250, delta: -50 }]
  };

  // PT-011: Detecção de espionagem não-autorizada em voz passiva
  const passiveEspionageNarrative = 'Os soldados marcharam até a ponte e o mensageiro foi seguido até a fortaleza de Ironpeak.';
  const violationsPassive = validateNarrativeConsistency(reportMilitary, null, passiveEspionageNarrative);
  assert.ok(
    violationsPassive.some(v => v.code === 'INVENTED_MECHANICAL_CONSEQUENCE'),
    'Validador deve capturar espionagem não-autorizada em voz passiva (PT-011)'
  );

  // PT-012: Detecção de divergência de custo em moedas / moedas de prata
  const wrongCoinCostNarrative = 'Os capitães concluíram as obras pagando o valor de 100 moedas de prata aos artesãos.';
  const violationsCost = validateNarrativeConsistency(reportMilitary, null, wrongCoinCostNarrative);
  assert.ok(
    violationsCost.some(v => v.code === 'DELTA_CONTRADICTION'),
    'Validador deve capturar custo divergente em moedas de prata (PT-012)'
  );

  // Verificação de delegação diplomática em intentHeuristics
  const { interpretIntentHeuristically } = await import('../src/lib/intentHeuristics');
  const delegationCmd = interpretIntentHeuristically('Quero uma delegação para negociar paz com os vizinhos');
  assert.equal(delegationCmd.action, 'DIPLOMACY', 'Delegação para negociar paz deve classificar como DIPLOMACY');

  console.log('[TEST 15] Validações de regressão PT-011 (voz passiva) e PT-012 (custos em moedas) -> OK');
}

console.log('SemanticInputContract test suite passed successfully.');
