import assert from 'node:assert/strict';
import { NARRATIVE_CONTRACT_VERSION, NarrativeCommand } from '../src/lib/narrativeContracts';
import { createInitialState, resolveNarrativeCommand } from '../src/engine';
import { CampaignState } from '../src/types';

function makeCommand(action: NarrativeCommand['action'], overrides: Partial<NarrativeCommand> = {}): NarrativeCommand {
  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: 'command-1',
    actorId: 'player',
    action,
    constraints: [],
    confidence: 0.98,
    ambiguity: [],
    requiresClarification: false,
    ...overrides
  };
}

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value as object)) {
      freezeDeep((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

const baseState: CampaignState = createInitialState('Noble Ruler', 'Central Plains');
const baseStateJson = JSON.stringify(baseState);

function freshState(): CampaignState {
  return JSON.parse(baseStateJson) as CampaignState;
}

// ---------------------------------------------------------------------------
// TEST A — Sucesso: ação mecânica válida produz accepted + report coerente
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const command = makeCommand('RECRUIT', { magnitude: { mode: 'FIXED', value: 10 } });
  const { report, state: resultState, mutated } = resolveNarrativeCommand(command, state);

  assert.equal(mutated, true);
  assert.equal(report.status, 'ACCEPTED', 'Ação válida deve ser ACEITA');
  assert.equal(report.actionExecuted, 'RECRUIT');
  assert.equal(report.command.commandId, 'command-1');
  assert.deepEqual(report.magnitude, {
    mode: 'FIXED',
    value: 10,
    source: 'PLAYER_EXPLICIT',
    min: 10,
    max: 10
  }, 'Magnitude explícita do jogador refletida no report');
  assert.equal(resultState.weeklyLedger.silverdew, state.weeklyLedger.silverdew - 30, 'Tesouraria deve refletir o custo real da resolução');
  assert.equal(resultState.army.units.find(u => u.id === 'u_1')!.size, 70, 'A unidade Levy existente deve crescer para 70');

  const composedForNarration = Object.fromEntries(
    report.stateChanges.map(sc => [sc.path, sc.delta])
  );
  assert.deepEqual(composedForNarration, {
    'weeklyLedger.silverdew': -30,
    'holdings.laborPool': -10,
    'army.units.levies': 10
  }, 'O report deve permitir reconstruir o que aconteceu sem acessar CampaignState');

  console.log('[TEST A] Sucesso: RECRUIT aceito com report coerente -> OK');
}

// ---------------------------------------------------------------------------
// TEST B — Rejeição: ação inválida produz accepted=false e NENHUMA consequência
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const command = makeCommand('RECRUIT', { magnitude: { mode: 'FIXED', value: 200 } });
  const { report, state: resultState, mutated } = resolveNarrativeCommand(command, state);

  assert.equal(report.status, 'REJECTED', 'FIXED 200 excede os limites da regra (cap 10) -> rejeição determinística do MRS');
  assert.equal(mutated, false);
  assert.equal(report.stateChanges.length, 0, 'Rejeição não registra deltas');
  assert.equal(report.consequences.length, 0, 'Rejeição não registra consequências fictícias');
  assert.equal(report.events.length, 0);
  assert.equal(resultState, state, 'Nenhuma mutação: o estado retornado deve ser a mesma referência imutável');
  assert.match(report.reasonCode, /RECUSADO/);
  assert.equal('magnitude' in report, false, 'Rejeição não carrega magnitude resolvida');

  const zeroState = freshState();
  const zeroCommand = makeCommand('RECRUIT', { parameters: { quantity: 0 } });
  const zeroResult = resolveNarrativeCommand(zeroCommand, zeroState);
  assert.equal(zeroResult.report.status, 'REJECTED', 'Quantidade 0 é rejeitada pela regra autoritativa');
  assert.match(zeroResult.report.reasonCode, /INVALID_PARAMETER/);

  const threatState = freshState();
  const threatResult = resolveNarrativeCommand(makeCommand('THREAT'), threatState);
  assert.equal(threatResult.report.status, 'REJECTED', 'THREAT não possui mecânica: rejeição autoritativa, sem consequências');
  assert.equal(threatResult.report.stateChanges.length, 0);

  console.log('[TEST B] Rejeição: RECRUIT FIXED inviável / quantidade 0 / THREAT sem mecânica -> OK');
}

// ---------------------------------------------------------------------------
// TEST C — Delta: deltas derivados da resolução real (after - before)
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const command = makeCommand('RECRUIT', { magnitude: { mode: 'FIXED', value: 10 } });
  const { report } = resolveNarrativeCommand(command, state);

  const silverdew = report.stateChanges.find(sc => sc.path === 'weeklyLedger.silverdew')!;
  assert.equal(silverdew.before, 300);
  assert.equal(silverdew.after, 270);
  assert.equal(silverdew.delta, -30, 'delta = after - before');

  const levies = report.stateChanges.find(sc => sc.path === 'army.units.levies')!;
  assert.equal(levies.before, 60);
  assert.equal(levies.after, 70);
  assert.equal(levies.delta, 10);

  console.log('[TEST C] Delta: valores reais before/after/delta -> OK');
}

// ---------------------------------------------------------------------------
// TEST D — Determinismo: mesma resolução produz reports equivalentes
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const command = makeCommand('RECRUIT', { magnitude: { mode: 'FIXED', value: 10 } });
  const first = resolveNarrativeCommand(command, state);
  const second = resolveNarrativeCommand(command, state);

  assert.deepEqual(first.report, second.report, 'Reports devem ser structuralmente equivalentes');
  assert.equal(JSON.stringify(first.report), JSON.stringify(second.report), 'Reports devem serializar de forma idêntica');
  assert.equal(first.report.reportId, 'report-command-1', 'IDs derivados de forma determinística (sem UUID random)');

  const buildState = freshState();
  buildState.weeklyLedger.materials.stone = 50;
  const buildCommand = makeCommand('BUILD', { objectId: 'palisade' });
  const buildFirst = resolveNarrativeCommand(buildCommand, buildState);
  const buildSecond = resolveNarrativeCommand(buildCommand, buildState);
  assert.equal(buildFirst.report.status, 'ACCEPTED');
  assert.deepEqual(buildFirst.report, buildSecond.report);

  console.log('[TEST D] Determinismo: RECRUIT e BUILD com reports idênticos em execuções repetidas -> OK');
}

// ---------------------------------------------------------------------------
// TEST E — Ausência de snapshot: nenhuma forma de CampaignState no report
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const command = makeCommand('RECRUIT', { magnitude: { mode: 'FIXED', value: 10 } });
  const { report } = resolveNarrativeCommand(command, state);
  const json = JSON.stringify(report);

  const expectedKeys = [
    'contractVersion', 'reportId', 'command', 'status', 'actionExecuted',
    'affectedEntities', 'stateChanges', 'consequences', 'discoveredInformation',
    'hiddenInformationIds', 'events', 'reasonCode', 'magnitude'
  ];
  assert.deepEqual(Object.keys(report).sort(), [...expectedKeys].sort(), 'Report contém apenas as chaves do contrato');
  assert.deepEqual(Object.keys(report.magnitude!).sort(), ['mode', 'value', 'source', 'min', 'max'].sort(), 'Magnitude expõe apenas o resultado factual (sem fórmulas/pesos/config)');

  for (const forbidden of ['beforeState', 'afterState', 'previousState', 'resultingState', 'CampaignState']) {
    assert.equal(json.includes(forbidden), false, `Report não deve conter "${forbidden}"`);
  }
  for (const forbiddenShape of ['"nobleHouses"', '"worldSecrets"', '"character"', '"holdings"', '"worldLedger"']) {
    assert.equal(json.includes(forbiddenShape), false, `Report não deve conter shape de CampaignState: ${forbiddenShape}`);
  }
  for (const change of report.stateChanges) {
    assert.ok(['string', 'number', 'boolean', 'undefined'].includes(typeof change.before) || change.before === null);
    assert.ok(['string', 'number', 'boolean', 'undefined'].includes(typeof change.after) || change.after === null);
  }

  console.log('[TEST E] Ausência de snapshot: nenhuma chave/shape de CampaignState no report -> OK');
}

// ---------------------------------------------------------------------------
// TEST F — Não mutação indevida: entrada congelada permanece intacta
// ---------------------------------------------------------------------------
{
  const state = freezeDeep(freshState());
  const command = makeCommand('RECRUIT', { magnitude: { mode: 'FIXED', value: 10 } });

  let resolved;
  try {
    resolved = resolveNarrativeCommand(command, state);
  } catch (err) {
    assert.fail(`Resolução não deve tentar mutar estado congelado: ${err instanceof Error ? err.message : String(err)}`);
  }
  assert.deepEqual(state, JSON.parse(baseStateJson), 'Estado de entrada não pode ser alterado pela resolução');
  assert.equal(resolved.mutated, true, 'A resolução ainda é mutável (produz clone), apenas a entrada permanece intacta');
  assert.equal(resolved.report.stateChanges.length, 3);

  console.log('[TEST F] Não mutação: entrada congelada intacta após resolução -> OK');
}

// ---------------------------------------------------------------------------
// TEST G — MRS: ENGINE_DETERMINED (ausência de magnitude) e identidade exigida
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const engineDetermined = resolveNarrativeCommand(makeCommand('RECRUIT'), state);
  assert.equal(engineDetermined.report.status, 'ACCEPTED', 'Sem magnitude -> ENGINE_DETERMINED, não default silencioso');
  assert.equal(engineDetermined.report.magnitude!.mode, 'ENGINE_DETERMINED');
  assert.equal(engineDetermined.report.magnitude!.source, 'ENGINE_CALCULATED');
  assert.equal(engineDetermined.report.magnitude!.value, 10, 'Estado padrão: envelope [15,15] x cap 10 -> 10');
  assert.equal(engineDetermined.report.magnitude!.min, 10);
  assert.equal(engineDetermined.report.magnitude!.max, 10);
  assert.ok(engineDetermined.report.stateChanges.some(sc => sc.path === 'army.units.levies' && sc.delta === 10));

  const noTarget = resolveNarrativeCommand(makeCommand('BUILD'), state);
  assert.equal(noTarget.report.status, 'REJECTED', 'BUILD sem objectId -> esclarecimento exigido pelo Engine');
  assert.equal(noTarget.report.reasonCode.includes('esclarecimento'), true);
  assert.equal(noTarget.mutated, false);

  const d0Example = resolveNarrativeCommand(makeCommand('RECRUIT', { magnitude: { mode: 'FIXED', value: 23 } }), state);
  assert.equal(d0Example.report.status, 'REJECTED', 'D0: FIXED 23 (exemplo do owner) excede o cap §41.6 -> REJECT, nunca clamp');
  assert.match(d0Example.report.reasonCode, /RECUSADO/);

  console.log('[TEST G] ENGINE_DETERMINED, identidade exigida (BUILD), D0 FIXED 23 -> OK');
}

// ---------------------------------------------------------------------------
// Casos adicionais: informacional aceito sem mutação; clarificação pendente
// ---------------------------------------------------------------------------
{
  const state = freshState();
  const infoResult = resolveNarrativeCommand(makeCommand('INFORMATION', { objectId: 'recrutamento' }), state);
  assert.equal(infoResult.report.status, 'ACCEPTED');
  assert.equal(infoResult.mutated, false);
  assert.equal(infoResult.report.stateChanges.length, 0);
  assert.equal(infoResult.report.consequences.length, 0);

  const clarificationResult = resolveNarrativeCommand(
    makeCommand('RECRUIT', { requiresClarification: true, ambiguity: ['quantidade não especificada'] }),
    state
  );
  assert.equal(clarificationResult.report.status, 'REJECTED');
  assert.equal(clarificationResult.mutated, false);
  assert.equal(clarificationResult.report.reasonCode.includes('esclarecimento'), true);

  console.log('[EXTRA] INFORMATION aceito sem mutação e clarificação pendente barrada no Engine -> OK');
}

console.log('ExecutionReport focused suite passed.');