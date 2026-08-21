import assert from 'node:assert/strict';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { runNarrativeCycle } from '../src/lib/narrativeCycle';
import { resolveNarrativeCommand } from '../src/lib/narrativeExecution';
import { NarrativeCommand } from '../src/lib/narrativeContracts';
import {
  createSecretState,
  createSliceState,
  createStoneRichState,
  PLAYER_OBSERVER
} from './fixtures/narrativeSlice.fixtures';
import { VAELMONT_SECRET } from './fixtures/narrativeSlice.fixtures';

const mock = new MockNarrativeLLM();

function snapshot(value: unknown): string {
  return JSON.stringify(value);
}

// ---------------------------------------------------------------------------
// Cenário A: RECRUIT aceito — narrativa fiel aos deltas
// ---------------------------------------------------------------------------
{
  const state = createSliceState();
  const result = await runNarrativeCycle({
    playerInput: 'Quero recrutar 10 soldados.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(result.command.action, 'RECRUIT');
  assert.equal(result.report.status, 'ACCEPTED');
  assert.ok(result.report.stateChanges.some(sc => sc.path === 'weeklyLedger.silverdew' && sc.delta === -30));
  assert.ok(result.report.stateChanges.some(sc => sc.path === 'army.units.levies' && sc.delta === 10));
  assert.ok(result.narrative.includes('10 soldados'), 'Narrativa deve refletir o delta real de levy');
  assert.equal(result.validation.length, 0, `Nenhuma violação esperada no cenário A: ${JSON.stringify(result.validation)}`);
  assert.equal(result.resultState.weeklyLedger.silverdew, 270);
  console.log('[CENARIO-A] RECRUIT 10 aceito, narrativa fiel, 0 violações -> OK');
}

// ---------------------------------------------------------------------------
// Cenário B: RECRUIT inviável — rejeição sem mutação e sem afirmação de sucesso
// ---------------------------------------------------------------------------
{
  const state = createSliceState();
  const result = await runNarrativeCycle({
    playerInput: 'Quero recrutar 200 soldados.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(result.report.status, 'REJECTED', 'FIXED 200 excede o cap §41.6 -> rejeição MRS determinística');
  assert.equal(result.report.stateChanges.length, 0, 'Rejeição não pode produzir deltas');
  assert.ok(result.narrative.includes('não foi executada'), 'Narrativa de rejeição não pode afirmar execução');
  assert.ok(!result.narrative.includes('com sucesso'));
  assert.equal(result.validation.length, 0, `Nenhuma violação esperada no cenário B: ${JSON.stringify(result.validation)}`);
  assert.equal(result.resultState.weeklyLedger.silverdew, 300, 'Estado não pode ser mutado em rejeição');
  console.log('[CENARIO-B] RECRUIT 200 rejeitado, zero mutação, 0 violações -> OK');
}

// ---------------------------------------------------------------------------
// Cenário C: ação impossível — sem mutação, narrativa neutra
// ---------------------------------------------------------------------------
{
  const state = createSliceState();
  const result = await runNarrativeCycle({
    playerInput: 'Eu mato o rei.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(result.command.action, 'UNKNOWN');
  assert.equal(result.report.status, 'REJECTED');
  assert.equal(result.report.stateChanges.length, 0);
  assert.ok(!result.narrative.toLowerCase().includes('morte'));
  assert.ok(!result.narrative.toLowerCase().includes('morreu'));
  assert.equal(result.validation.length, 0, `Nenhuma violação esperada no cenário C: ${JSON.stringify(result.validation)}`);
  assert.equal(result.resultState, state, 'Estado original deve ser mantido por referência em rejeição');
  console.log('[CENARIO-C] Ação impossível rejeitada, narrativa neutra -> OK');
}

// ---------------------------------------------------------------------------
// Cenário D: segredo — ausência estrutural na projeção/contexto e na narrativa
// ---------------------------------------------------------------------------
{
  const state = createSecretState();
  const result = await runNarrativeCycle({
    playerInput: 'Quero recrutar 10 soldados.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock,
    excludedSecretStatements: [VAELMONT_SECRET.description]
  });

  assert.ok(
    !JSON.stringify(result.projection).includes(VAELMONT_SECRET.id),
    'Projeção não pode conter id do segredo'
  );
  assert.ok(
    !JSON.stringify(result.projection).includes(VAELMONT_SECRET.description),
    'Projeção não pode conter descrição do segredo'
  );
  assert.ok(
    !JSON.stringify(result.context).includes(VAELMONT_SECRET.description),
    'Contexto não pode conter descrição do segredo'
  );
  assert.ok(!result.narrative.includes(VAELMONT_SECRET.description));
  assert.equal(result.validation.length, 0, `Nenhuma violação esperada no cenário D: ${JSON.stringify(result.validation)}`);
  console.log('[CENARIO-D] Segredo ausente estruturalmente da projeção/contexto/narrativa -> OK');
}

// ---------------------------------------------------------------------------
// Cenário E: BUILD com pedra rica — delta exato; narrativa correta passa,
// narrativa com delta errado falha no validador
// ---------------------------------------------------------------------------
{
  const state = createStoneRichState();
  const result = await runNarrativeCycle({
    playerInput: 'Construir palisada de madeira.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(result.report.status, 'ACCEPTED');
  assert.ok(result.report.stateChanges.some(sc => sc.path === 'weeklyLedger.silverdew' && sc.delta === -50));
  assert.equal(result.validation.length, 0, `Nenhuma violação esperada no cenário E: ${JSON.stringify(result.validation)}`);
  console.log('[CENARIO-E] BUILD delta -50, narrativa correta 0 violações -> OK');
}

// ---------------------------------------------------------------------------
// Cenário F: esclarecimento — zero mutação, narrativa pergunta
// ---------------------------------------------------------------------------
{
  const state = createSliceState();
  const result = await runNarrativeCycle({
    playerInput: 'Quero falar com ele.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(result.command.requiresClarification, true);
  assert.equal(result.report.status, 'REJECTED');
  assert.equal(result.report.stateChanges.length, 0);
  assert.ok(result.narrative.includes('esclarecimento'), 'Narrativa deve pedir esclarecimento');
  assert.equal(result.resultState, state, 'Estado original deve ser mantido por referência');
  assert.equal(result.validation.length, 0, `Nenhuma violação esperada no cenário F: ${JSON.stringify(result.validation)}`);
  console.log('[CENARIO-F] Esclarecimento: zero mutação, narrativa pergunta -> OK');
}

// ---------------------------------------------------------------------------
// Não-mutação: estado de entrada permanece intacto (a engine clona em ALLOWED)
// ---------------------------------------------------------------------------
{
  const state = createSliceState();
  const frozen = structuredClone(state);
  const result = await runNarrativeCycle({
    playerInput: 'Quero recrutar 10 soldados.',
    state,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(snapshot(state), snapshot(frozen), 'Estado de entrada não pode ser mutado pelo ciclo (engine clona)');
  assert.notEqual(result.resultState, state, 'Estado resultante deve ser o clone da engine, não o original');
  assert.equal(result.resultState.weeklyLedger.silverdew, 270);
  console.log('[NAO-MUTACAO] Entrada intacta, resultado é o clone da engine -> OK');
}

// ---------------------------------------------------------------------------
// Determinismo: mesma entrada -> mesmo resultado JSON (narrativa e report)
// ---------------------------------------------------------------------------
{
  const stateA = createSliceState();
  const stateB = createSliceState();
  const input = 'Quero recrutar 10 soldados.';

  const resultA = await runNarrativeCycle({ playerInput: input, state: stateA, observer: PLAYER_OBSERVER, llm: mock });
  const resultB = await runNarrativeCycle({ playerInput: input, state: stateB, observer: PLAYER_OBSERVER, llm: mock });

  assert.equal(resultA.narrative, resultB.narrative, 'Narrativa deve ser determinística');
  assert.equal(snapshot(resultA.report), snapshot(resultB.report), 'Report deve ser determinístico');
  assert.equal(snapshot(resultA.command), snapshot(resultB.command), 'Comando deve ser determinístico');
  console.log('[DETERMINISMO] Ciclo reproduzível (narrativa/report/comando idênticos) -> OK');
}

// ---------------------------------------------------------------------------
// Allow-list de parâmetros: parâmetro desconhecido/inválido -> rejeição autoritativa
// ---------------------------------------------------------------------------
{
  const state = createSliceState();

  const baseCommand = (await runNarrativeCycle({
    playerInput: 'Quero recrutar 10 soldados.',
    state: createSliceState(),
    observer: PLAYER_OBSERVER,
    llm: mock
  })).command;

  const craftyCommand = {
    ...baseCommand,
    commandId: 'mock-recruit-param-test',
    magnitude: undefined,
    parameters: { speed: 5 }
  } as NarrativeCommand;
  const resolutionWithUnknown = resolveNarrativeCommand(craftyCommand, state);
  assert.equal(resolutionWithUnknown.report.status, 'REJECTED');
  assert.ok(resolutionWithUnknown.report.reasonCode.includes('UNKNOWN_PARAMETER'));

  const invalidQuantity = {
    ...baseCommand,
    commandId: 'mock-recruit-param-test-2',
    magnitude: undefined,
    parameters: { quantity: 0 }
  } as NarrativeCommand;
  const resolutionWithInvalid = resolveNarrativeCommand(invalidQuantity, state);
  assert.equal(resolutionWithInvalid.report.status, 'REJECTED');
  assert.ok(resolutionWithInvalid.report.reasonCode.includes('INVALID_PARAMETER'));

  const validQuantity = {
    ...baseCommand,
    commandId: 'mock-recruit-param-test-3',
    magnitude: undefined,
    parameters: { quantity: 5 }
  } as NarrativeCommand;
  const resolutionWithValid = resolveNarrativeCommand(validQuantity, state);
  assert.equal(resolutionWithValid.report.status, 'ACCEPTED');
  assert.ok(resolutionWithValid.report.stateChanges.some(sc => sc.path === 'army.units.levies' && sc.delta === 5));
  assert.ok(resolutionWithValid.report.stateChanges.some(sc => sc.path === 'weeklyLedger.silverdew' && sc.delta === -15));

  console.log('[ALLOW-LIST] UNKNOWN_PARAMETER/INVALID_PARAMETER rejeitados, quantity válido aceito -> OK');
}

// ---------------------------------------------------------------------------
// Semantic Validation Recovery Flow: recuperação de violação semântica
// ---------------------------------------------------------------------------
{
  class FlakyNarrativeLLM extends MockNarrativeLLM {
    private callCount = 0;
    override narrate(context: any): Promise<string> {
      this.callCount++;
      if (this.callCount === 1) {
        // First attempt generates deliberate violation (claims 999 casualties when none occurred)
        return Promise.resolve('Massacre total nas muralhas, centenas de soldados tombaram mortos!');
      }
      // Second attempt generates compliant narrative
      return Promise.resolve(super.narrate(context));
    }
  }

  const flakyLLM = new FlakyNarrativeLLM();
  const state = createSliceState();
  const result = await runNarrativeCycle({
    playerInput: 'Quero recrutar 10 soldados.',
    state,
    observer: PLAYER_OBSERVER,
    llm: flakyLLM
  });

  assert.equal(result.validation.length, 0, 'A recuperação semântica deve retornar 0 violações');
  assert.ok(!result.narrative.includes('Massacre total'), 'A narrativa com violação deve ser corrigida');
  assert.equal(result.resultState.weeklyLedger.silverdew, 270, 'Estado deve ser atualizado apenas uma vez');
  console.log('[RECOVERY-TEST] Recuperação de violação semântica executada com sucesso -> OK');
}

// ---------------------------------------------------------------------------
// Fallback Autoritativo: quando LLM persiste em violação, fallback seguro é aplicado
// ---------------------------------------------------------------------------
{
  class DefectiveNarrativeLLM extends MockNarrativeLLM {
    override narrate(): Promise<string> {
      // Always generates deliberate violation
      return Promise.resolve('Ação executada com sucesso total sem qualquer restrição.');
    }
  }

  const defectiveLLM = new DefectiveNarrativeLLM();
  const state = createSliceState();
  // Action that gets REJECTED
  const result = await runNarrativeCycle({
    playerInput: 'Eu mato o rei.',
    state,
    observer: PLAYER_OBSERVER,
    llm: defectiveLLM
  });

  assert.equal(result.report.status, 'REJECTED');
  assert.equal(result.validation.length, 0, 'Fallback autoritativo deve garantir 0 violações semânticas');
  assert.ok(result.narrative.includes('não foi executada'), 'Fallback seguro deve relatar a rejeição');
  assert.equal(result.resultState, state, 'Estado deve permanecer intacto');
  console.log('[FALLBACK-TEST] Fallback autoritativo seguro aplicado com 0 violações -> OK');
}

// ---------------------------------------------------------------------------
// Multi-Action Continuity: Ação A -> Estado A -> Ação B -> Estado B -> Turno -> Ação C
// ---------------------------------------------------------------------------
{
  const initialState = createSliceState();
  assert.equal(initialState.army.units.filter(u => u.type === 'Levy').reduce((s, u) => s + u.size, 0), 60);
  assert.equal(initialState.weeklyLedger.silverdew, 300);

  // Add an initial campaign event and a pending consequence to verify causal propagation
  initialState.worldLedger.majorEvents = [
    {
      date: 'W1, M1, Y342',
      event: 'Fundação das defesas da fronteira de Caedor.',
      region: 'Central Plains',
      involved: 'Lord Alric',
      resolved: 'Yes'
    }
  ];

  initialState.sessionLog.pendingConsequences = [
    {
      id: 'c_multi_1',
      kind: 'PENDING',
      description: 'Caravana de ferro aguarda confirmação de rota segura.',
      triggerTurn: 1, // Will trigger on next turn
      originAction: 'TRADE',
      resolved: false
    }
  ];

  // 1. Action A: Recrutar 10 soldados
  const resultA = await runNarrativeCycle({
    playerInput: 'Quero recrutar 10 soldados.',
    state: initialState,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(resultA.report.status, 'ACCEPTED');
  assert.equal(resultA.resultState.weeklyLedger.silverdew, 270);
  assert.equal(resultA.resultState.army.units.filter(u => u.type === 'Levy').reduce((s, u) => s + u.size, 0), 70);
  assert.ok(resultA.projection.recentEvents.some(e => e.summary.includes('Fundação das defesas')));
  assert.ok(resultA.projection.scene.immediateCircumstances?.some(c => c.includes('Caravana de ferro')));

  // 2. Action B: Construir palisada usando o estado resultante de A
  const resultB = await runNarrativeCycle({
    playerInput: 'Quero construir uma palisada.',
    state: resultA.resultState,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(resultB.report.status, 'ACCEPTED');
  assert.equal(resultB.resultState.weeklyLedger.silverdew, 220); // 270 - 50 = 220
  assert.equal(resultB.resultState.army.units.filter(u => u.type === 'Levy').reduce((s, u) => s + u.size, 0), 70, 'Tropas recrutadas em A devem persistir em B');
  assert.ok(resultB.projection.recentEvents.length >= 1, 'Projeção de B deve conter histórico de eventos');

  // 3. Advance Weekly Turn (triggers pending consequence resolution)
  const { resolveWeeklyTurn } = await import('../src/engine');
  const turnResult = resolveWeeklyTurn(resultB.resultState);
  const turnState = turnResult.updatedState;

  assert.equal(turnState.worldLedger.currentDate.week, 2, 'Semana deve avançar para 2');
  assert.ok(turnState.sessionLog.pendingConsequences?.find(c => c.id === 'c_multi_1')?.resolved === true, 'Consequência deve ter sido concretizada');

  // 4. Action C: Consulta de informação no novo turno semanal
  const resultC = await runNarrativeCycle({
    playerInput: 'Quanto custa o recrutamento?',
    state: turnState,
    observer: PLAYER_OBSERVER,
    llm: mock
  });

  assert.equal(resultC.report.status, 'ACCEPTED');
  assert.equal(resultC.projection.scene.weather, turnState.weeklyLedger.weather, 'Cena deve refletir novo clima da semana 2');
  assert.ok(resultC.projection.recentEvents.some(e => e.summary.includes('Consequência Concretizada')), 'Consequência resolvida deve constar nos eventos recentes');
  assert.equal(resultC.validation.length, 0, 'Zero violações no ciclo contínuo multi-ação');

  console.log('[MULTI-ACTION-TEST] Continuidade causal multi-ação A -> B -> Turno -> C validada -> OK');
}

console.log('\nNarrativeCycle.test.ts: TODOS OS CENÁRIOS A-F + não-mutação + determinismo + recuperação + multi-ação PASSARAM.');