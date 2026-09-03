import assert from 'node:assert';
import { createInitialState } from '../../src/engine';
import { resolveNarrativeCommand } from '../../src/lib/narrativeExecution';
import { toNarrativeProjection } from '../../src/lib/narrativeProjection';
import { interpretIntentHeuristically } from '../../src/lib/intentHeuristics';
import { resolveGenericPlausibleAction } from '../../src/lib/genericResolution';
import { RandomService } from '../../src/core/RandomService';
import { NarrativeContext, ExecutionReport } from '../../src/lib/narrativeContracts';

console.log('🧪 Running Semantic Boundary Audit Unit Tests (FIX-6B)...');

// 1. ORDER / COUNCIL INSPECTION BOUNDARY
{
  const input = "Digo ao meu marechal: Inspecione a prontidão da guarnição nas muralhas e dobre a vigília nas passagens.";
  const command = interpretIntentHeuristically(input);

  assert.strictEqual(command.action, 'INFORMATION', 'Inspeção de conselho deve ser mapeada para INFORMATION');
  assert.strictEqual(command.requiresClarification, false, 'Comando de inspeção claro não deve exigir esclarecimento');

  const state = createInitialState('Landed Knight', 'Grey Keep');
  const resolution = resolveNarrativeCommand(command, state);

  assert.strictEqual(resolution.report.status, 'ACCEPTED', 'Consulta sobre guarnição/muralhas deve ser aceita');
  assert.strictEqual(resolution.report.actionExecuted, 'INFORMATION', 'Ação executada deve ser INFORMATION');
  assert.strictEqual(resolution.mutated, false, 'Consultas de informação nunca devem mutar o estado');

  console.log('  ✅ TEST 1: Council inspection command resolves cleanly as INFORMATION without state mutation.');
}

// 2. DIPLOMACY PROBE / LETTER CONSEQUENCE INTEGRITY
{
  const state = createInitialState('Noble Ruler', 'Grey Keep');
  state.weeklyLedger.silverdew = 100;
  const rng = new RandomService(42);

  const reqProbe = {
    action: 'Mara, redija uma mensagem formal à Casa Greyhaven sondando suas intenções comerciais.',
    targetId: 'Greyhaven'
  };

  const resProbe = resolveGenericPlausibleAction(reqProbe, state, rng);
  assert.strictEqual(resProbe.classification, 'PLAUSIBLE_UNMODELED');
  assert.ok(resProbe.consequences.length > 0, 'Deve conter consequências');

  const desc = resProbe.consequences[0].description;
  // A consequência de envio de mensagem/carta NÃO pode alucinar recepção imediata de emissários ou banquete
  assert.ok(!desc.includes('Emissários foram recebidos com honras'), 'Não deve alucinar recepção presencial de emissários para envio de carta');
  assert.ok(desc.includes('mensagem') || desc.includes('carta') || desc.includes('despachad'), 'Deve relatar o despacho da mensagem sob salvo-conduto');

  console.log('  ✅ TEST 2: Diplomatic letter/probe action generates grounded dispatch consequence, not instant feast or reception.');
}

// 3. REJECTION GROUNDING: REASON CODE PROPAGATION (NO FICTIONAL TIRED MEN)
{
  const mockRejectedReport: ExecutionReport = {
    contractVersion: 1,
    reportId: 'rep_rej_test',
    command: {
      commandId: 'cmd_1',
      actorId: 'player',
      action: 'UNKNOWN'
    },
    status: 'REJECTED',
    actionExecuted: 'UNKNOWN',
    reasonCode: 'Comando de controle de sistema. Utilize a interface para avançar o turno.',
    affectedEntities: [],
    stateChanges: [],
    consequences: [],
    discoveredInformation: [],
    hiddenInformationIds: [],
    events: []
  };

  const projection = toNarrativeProjection(mockRejectedReport);

  assert.strictEqual(projection.outcome, 'rejected', 'Outcome deve ser rejected');
  assert.ok(projection.authoritativeFacts.some(f => f.includes('Comando de controle de sistema')), 'Fatos autorizados devem conter o motivo mecânico real');
  assert.ok(projection.visibleEvents.some(e => e.description.includes('Comando de controle de sistema')), 'Eventos observáveis devem descrever o motivo real da rejeição');
  assert.ok(!projection.visibleEvents.some(e => e.description.includes('cansaço dos soldados')), 'Não deve conter alegações espúrias de soldados cansados');

  console.log('  ✅ TEST 3: Rejection reports inject authoritative reasonCode into projection, preventing narrative hallucination of fatigue.');
}

// 4. SYSTEM COMMAND BOUNDARY: END_TURN IN CHAT
{
  const input = "Avance o turno atual.";
  const command = interpretIntentHeuristically(input);

  assert.strictEqual(command.action, 'UNKNOWN', 'Comando de virar turno pelo chat deve ser classificado como UNKNOWN');

  const state = createInitialState('Noble Ruler', 'Grey Keep');
  const resolution = resolveNarrativeCommand(command, state);

  assert.strictEqual(resolution.mutated, false, 'Comando UNKNOWN nunca deve mutar CampaignState');
  assert.strictEqual(resolution.report.status, 'REJECTED', 'Comando UNKNOWN deve ser rejeitado no motor');

  console.log('  ✅ TEST 4: Chat input attempting to advance turn is rejected safely as UNKNOWN with zero state mutation.');
}

console.log('🎉 All Semantic Boundary Audit Tests Passed Successfully!');
