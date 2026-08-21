import assert from 'node:assert/strict';
import { MockNarrativeLLM } from '../src/lib/mockNarrativeLLM';
import { buildObserverProjection, buildNarrativeContext } from '../src/engine';
import { ExecutionReport, NARRATIVE_CONTRACT_VERSION, NarrativeCommand, NarrativeContext, ObserverProjection } from '../src/lib/narrativeContracts';
import { createSliceState } from './fixtures/narrativeSlice.fixtures';
import { PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';

const mock = new MockNarrativeLLM();

// ---------------------------------------------------------------------------
// Interpretação: comandos estruturados determinísticos
// ---------------------------------------------------------------------------
{
  const state = createSliceState();
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);

  const recruit = await mock.interpret({ playerInput: 'Quero recrutar 20 soldados.', projection });
  assert.equal(recruit.action, 'RECRUIT');
  assert.deepEqual(recruit.magnitude, { mode: 'FIXED', value: 20 }, 'Quantidade explícita vira magnitude FIXED');
  assert.equal('parameters' in recruit, false, 'parameters.quantity está deprecado e não é mais emitido');
  assert.equal(recruit.requiresClarification, false);
  assert.equal('decision' in recruit, false, 'Comando não pode conter decisão mecânica');
  assert.equal('delta' in recruit, false);

  const build = await mock.interpret({ playerInput: 'Construir palisada de madeira.', projection });
  assert.equal(build.action, 'BUILD');
  assert.equal(build.objectId, 'palisade', 'Identidade estrutural extraída (obrigatória para o Engine)');

  const info = await mock.interpret({ playerInput: 'Quanto custa o recrutamento?', projection });
  assert.equal(info.action, 'INFORMATION');

  const unknown = await mock.interpret({ playerInput: 'Eu mato o rei.', projection });
  assert.equal(unknown.action, 'UNKNOWN', 'Ação impossível deve produzir comando rejeitável');
  assert.equal(unknown.requiresClarification, false);

  const ambiguous = await mock.interpret({ playerInput: 'Quero falar com ele.', projection });
  assert.equal(ambiguous.requiresClarification, true, 'Entrada sem alvo deve exigir esclarecimento');
  assert.ok(ambiguous.ambiguity.length > 0);

  const recruitNoQuantity = await mock.interpret({ playerInput: 'Quero recrutar soldados.', projection });
  assert.equal(recruitNoQuantity.requiresClarification, false, 'Recrutamento sem quantidade NÃO exige esclarecimento: delegação ENGINE_DETERMINED');
  assert.deepEqual(recruitNoQuantity.magnitude, { mode: 'ENGINE_DETERMINED' });

  const repeated = await mock.interpret({ playerInput: 'Quero recrutar 20 soldados.', projection });
  assert.equal(repeated.commandId, recruit.commandId, 'Mesma entrada -> mesmo comando (determinismo)');
  assert.deepEqual(repeated, recruit);

  console.log('[MOCK-INTERPRET] RECRUIT/BUILD/INFORMATION/UNKNOWN/CLARIFICATION determinísticos -> OK');
}

// ---------------------------------------------------------------------------
// Narração: apenas NarrativeContext autorizado; fiel ao ExecutionReport
// ---------------------------------------------------------------------------
{
  const state = createSliceState();
  const report: ExecutionReport = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    reportId: 'report-mock-test',
    command: { commandId: 'cmd', actorId: 'player', action: 'RECRUIT' },
    status: 'ACCEPTED',
    actionExecuted: 'RECRUIT',
    affectedEntities: [],
    stateChanges: [
      { path: 'weeklyLedger.silverdew', before: 300, after: 240, delta: -60 },
      { path: 'army.units.levies', before: 60, after: 80, delta: 20 }
    ],
    consequences: [],
    discoveredInformation: [],
    hiddenInformationIds: [],
    events: [],
    reasonCode: 'ALLOWED'
  };
  const projection = buildObserverProjection(state, PLAYER_OBSERVER);
  const context: NarrativeContext = buildNarrativeContext(projection, report);
  const narrative = await mock.narrate(context);

  assert.ok(narrative.includes('20 soldados'), 'Narrativa deve refletir o delta real de levy');
  assert.ok(!narrative.includes('100'), 'Narrativa não deve inventar números');

  const rejected: ExecutionReport = {
    ...report,
    reportId: 'report-mock-reject',
    status: 'REJECTED',
    stateChanges: [],
    reasonCode: 'Recrutamento RECUSADO (DENIED).'
  };
  const rejectedNarrative = await mock.narrate(buildNarrativeContext(projection, rejected));
  assert.ok(rejectedNarrative.includes('não foi executada'), 'Narrativa de rejeição não pode afirmar execução');

  console.log('[MOCK-NARRATE] Narrativa fiel ao report, sem acesso a CampaignState -> OK');
}