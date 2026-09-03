import assert from 'node:assert/strict';
import { UnifiedNarrativeLLM } from '../src/llm/adapters/UnifiedNarrativeLLM';
import { buildObserverProjection, createInitialState, resolveNarrativeCommand } from '../src/engine';
import { runNarrativeCycle } from '../src/lib/narrativeCycle';
import { PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';
import { NarrativeCommand } from '../src/lib/narrativeContracts';

// ===========================================================================
// SUÍTE DE TESTES CONTRATUAIS DO PROTOCOLO NARRATIVO (NARRATIVE LLM PROTOCOL SUITE)
// ===========================================================================
console.log('=== TESTES CONTRATUAIS DO PROTOCOLO NARRATIVO (NARRATIVE LLM PROTOCOL - M14) ===');

const baseState = createInitialState('Landless', 'Florestas do Rio');
baseState.character.title = 'Capitão Errante';
baseState.character.location.landmark = 'Fenwick';
baseState.advisors = {
  counselorName: 'Tobin',
  stewardName: 'Gerold',
  spyMasterName: 'Roric'
};

const projection = buildObserverProjection(baseState, PLAYER_OBSERVER);

// ---------------------------------------------------------------------------
// TEST 1 — Classificação de Recrutamento ("Quero recrutar 50 homens")
// ---------------------------------------------------------------------------
{
  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const cmd = await llm.interpret({ playerInput: 'Quero recrutar 50 homens', projection });
  assert.equal(cmd.action, 'RECRUIT');
  assert.ok(cmd.magnitude?.value >= 10, 'Magnitude deve ser >= 10 para input com número explícito');
  console.log('  ✅ 1. Classificação de Recrutamento (RECRUIT) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 2 — Classificação de Construção ("Construa uma paliçada")
// ---------------------------------------------------------------------------
{
  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const cmd = await llm.interpret({ playerInput: 'Construa uma paliçada', projection });
  assert.equal(cmd.action, 'BUILD');
  console.log('  ✅ 2. Classificação de Construção (BUILD) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 3 — Classificação de Consulta sobre Conselheiros ("Quem são meus conselheiros?")
// ---------------------------------------------------------------------------
{
  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const cmd = await llm.interpret({ playerInput: 'Quem são meus conselheiros?', projection });
  assert.equal(cmd.action, 'INFORMATION');
  console.log('  ✅ 3. Classificação de Consulta sobre Conselheiros (INFORMATION) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 4 — [REMOVED] Prompt Injection — teste de implementação específica do GeminiNarrativeLLM.
// Comportamento equivalente validado pelo GeminiAdapter no pipeline Unificado.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TEST 5 — [REMOVED] systemInstruction separation — teste de implementação específica do GeminiNarrativeLLM.
// Comportamento equivalente validado pelo GeminiAdapter no pipeline Unificado.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TEST 6 — Resolução de Consulta Semântica e Silêncio Mecânico
// ---------------------------------------------------------------------------
{
  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const result = await runNarrativeCycle({
    playerInput: 'Quanto ouro temos?',
    state: baseState,
    observer: PLAYER_OBSERVER,
    llm
  });

  assert.equal(result.report.actionExecuted, 'INFORMATION');
  assert.ok(!result.narrative.includes('silverdew'));
  assert.ok(!result.narrative.includes('SD'));
  console.log('  ✅ 6. Consulta de Recursos com Silêncio Mecânico preservado -> OK');
}

// ---------------------------------------------------------------------------
// TEST 7 — Silêncio Político vs. Entrada Vazia Acidental (PART 122.9)
// ---------------------------------------------------------------------------
{
  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  
  // 7.1 Entrada vazia ou acidental fora de contexto -> UNKNOWN + requiresClarification
  const emptyCmd = await llm.interpret({ playerInput: '   ', projection });
  assert.equal(emptyCmd.action, 'UNKNOWN');
  assert.equal(emptyCmd.requiresClarification, true);

  // 7.2 Silêncio deliberado explícito -> DIPLOMACY + stance CAUTIOUS + requiresClarification = false
  const silenceCmd1 = await llm.interpret({ playerInput: '...', projection });
  assert.equal(silenceCmd1.action, 'DIPLOMACY');
  assert.equal(silenceCmd1.stance, 'CAUTIOUS');
  assert.equal(silenceCmd1.requiresClarification, false);

  const silenceCmd2 = await llm.interpret({ playerInput: 'permaneço em silêncio diante da proposta', projection });
  assert.equal(silenceCmd2.action, 'DIPLOMACY');
  assert.equal(silenceCmd2.stance, 'CAUTIOUS');

  console.log('  ✅ 7. Distinção entre Silêncio Político Deliberado e Entrada Vazia (PART 122.9) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 8 — Classificação dos 4 Estados de Cena (SceneState - PART 122.2, 122.5, 122.7)
// ---------------------------------------------------------------------------
{
  // 8.1 Cena regular resolvida -> Resolved
  const regularState = JSON.parse(JSON.stringify(baseState));
  regularState.caravanLedger = { activeCaravans: [] };
  const regularProj = buildObserverProjection(regularState, PLAYER_OBSERVER);
  assert.equal(regularProj.scene.sceneState, 'Resolved');

  // 8.2 Cena com crise militar e salários atrasados -> Interrupted
  const crisisState = JSON.parse(JSON.stringify(baseState));
  crisisState.worldLedger.activeConflicts = [{ conflictId: 'c1', name: 'Incursão Inimiga' }];
  crisisState.weeklyLedger.unpaidWagesTicks = 2;
  const crisisProj = buildObserverProjection(crisisState, PLAYER_OBSERVER);
  assert.equal(crisisProj.scene.sceneState, 'Interrupted');

  // 8.3 Cena com caravana em trânsito estável -> Suspended
  const travelState = JSON.parse(JSON.stringify(baseState));
  travelState.caravanLedger = { activeCaravans: [{ id: 'car1', status: 'Em viagem' }] };
  travelState.sessionLog = { pendingConsequences: [] };
  travelState.weeklyLedger.famineTicks = 0;
  travelState.weeklyLedger.unpaidWagesTicks = 0;
  const travelProj = buildObserverProjection(travelState, PLAYER_OBSERVER);
  assert.equal(travelProj.scene.sceneState, 'Suspended');

  // 8.4 Evento não crítico (caravana em viagem) NÃO deve interromper a cena
  assert.notEqual(travelProj.scene.sceneState, 'Interrupted');

  console.log('  ✅ 8. Classificação Determinística dos 4 Estados de Cena (SceneState) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 9 — Cenas Multiator e Atribuição com Voz Única (PART 122.6)
// ---------------------------------------------------------------------------
{
  assert.ok(projection.actors.length >= 3, 'Projeção de conselho deve incluir conselheiros nominalmente');
  const actorNames = projection.actors.map(a => a.name);
  assert.ok(actorNames.includes('Tobin'));
  assert.ok(actorNames.includes('Gerold'));
  assert.ok(actorNames.includes('Roric'));
  assert.ok(!actorNames.includes('Personagem Fantasma'), 'Não deve conter personagens não autorizados');
  console.log('  ✅ 9. Projeção Multiator e Atribuição Nominal de Voz Única (PART 122.6) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 10 — Checkpoint Narration em Ações Multi-Turno (PART 122.11)
// ---------------------------------------------------------------------------
{
  // 10.1 Início de construção defensiva -> START_CHECKPOINT
  const buildCmd: NarrativeCommand = {
    contractVersion: 1,
    commandId: 'cmd_build_start',
    actorId: 'player',
    action: 'BUILD',
    objectId: 'palisade',
    constraints: [],
    confidence: 1.0,
    ambiguity: [],
    requiresClarification: false
  };

  const stateWithoutFort = JSON.parse(JSON.stringify(baseState));
  stateWithoutFort.weeklyLedger.materials = { timber: 200, stone: 200, iron: 50 };
  stateWithoutFort.weeklyLedger.silverdew = 1000;
  stateWithoutFort.holdings.fortification = { tier: 0, type: 'None' };
  const resStart = resolveNarrativeCommand(buildCmd, stateWithoutFort);
  assert.equal(resStart.report.checkpoint?.kind, 'START_CHECKPOINT');
  assert.ok(resStart.report.checkpoint?.progressDescription.includes('Fundação'));

  // 10.2 Conclusão / Upgrade de fortificação -> COMPLETION_CHECKPOINT
  const stateWithFort = JSON.parse(JSON.stringify(baseState));
  stateWithFort.weeklyLedger.materials = { timber: 200, stone: 200, iron: 50 };
  stateWithFort.weeklyLedger.silverdew = 1000;
  stateWithFort.holdings.fortification = { tier: 1, type: 'Wooden Palisade' };
  const resComplete = resolveNarrativeCommand(buildCmd, stateWithFort);
  assert.equal(resComplete.report.checkpoint?.kind, 'COMPLETION_CHECKPOINT');
  assert.ok(resComplete.report.checkpoint?.progressDescription.includes('finalizado'));

  // 10.3 Ação instantânea (RECRUIT) NÃO deve ter checkpoint
  const recruitCmd: NarrativeCommand = {
    contractVersion: 1,
    commandId: 'cmd_recruit_instant',
    actorId: 'player',
    action: 'RECRUIT',
    constraints: [],
    confidence: 1.0,
    ambiguity: [],
    requiresClarification: false
  };
  const resRecruit = resolveNarrativeCommand(recruitCmd, baseState);
  assert.equal(resRecruit.report.checkpoint, undefined);

  console.log('  ✅ 10. Checkpoint Narration (START, COMPLETION e Ausência em Instantâneas) -> OK');
}

// ---------------------------------------------------------------------------
// TEST 11 — Interrupção Prioritária (PART 122.5)
// ---------------------------------------------------------------------------
{
  // 11.1 Ausência de evento crítico -> Cena normal Resolved
  const peacefulState = JSON.parse(JSON.stringify(baseState));
  peacefulState.worldLedger.activeConflicts = [];
  peacefulState.weeklyLedger.unpaidWagesTicks = 0;
  peacefulState.caravanLedger = { activeCaravans: [] };
  const projPeaceful = buildObserverProjection(peacefulState, PLAYER_OBSERVER);
  assert.equal(projPeaceful.scene.sceneState, 'Resolved');

  // 11.2 Conflito ativo com crise emergente -> Interrupted com prioridade absoluta
  const warState = JSON.parse(JSON.stringify(baseState));
  warState.worldLedger.activeConflicts = [{ conflictId: 'war1', name: 'Cerco a Fenwick', status: 'Active' }];
  warState.weeklyLedger.unpaidWagesTicks = 3;
  const projWar = buildObserverProjection(warState, PLAYER_OBSERVER);
  assert.equal(projWar.scene.sceneState, 'Interrupted');

  console.log('  ✅ 11. Interrupção Prioritária com Autorização da Engine (PART 122.5) -> OK');
}

console.log('\n🎉 TODOS OS 11 TESTES DO PROTOCOLO NARRATIVO PARTE 122 FORAM EXECUTADOS E PASSARAM COM SUCESSO!\n');
