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

console.log('\nNarrativeCycle.test.ts: TODOS OS CENÁRIOS A-F + não-mutação + determinismo PASSARAM.');