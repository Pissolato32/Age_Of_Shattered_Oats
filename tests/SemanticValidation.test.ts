import assert from 'node:assert/strict';
import { NARRATIVE_CONTRACT_VERSION, ExecutionReport } from '../src/lib/narrativeContracts';
import { validateNarrativeConsistency } from '../src/lib/semanticValidation';
import { createSliceState } from './fixtures/narrativeSlice.fixtures';
import { PLAYER_OBSERVER } from './fixtures/narrativeSlice.fixtures';

const state = createSliceState();

function baseReport(overrides: Partial<ExecutionReport> = {}): ExecutionReport {
  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    reportId: 'report-semantic-test',
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
    reasonCode: 'ALLOWED',
    ...overrides
  };
}

function codes(violations: readonly { code: string }[]): string[] {
  return violations.map(v => v.code);
}

// ---------------------------------------------------------------------------
// STATUS_CONTRADICTION: narrativa afirma sucesso quando o Engine rejeitou
// ---------------------------------------------------------------------------
{
  const rejected = baseReport({ status: 'REJECTED', stateChanges: [], reasonCode: 'Recrutamento RECUSADO (DENIED).' });
  const narrative = 'O recrutamento foi executado com sucesso: 20 soldados foram recrutados.';
  const violations = validateNarrativeConsistency(rejected, undefined as never, narrative);
  assert.ok(violations.some(v => v.code === 'STATUS_CONTRADICTION'), 'Sucesso afirmado sobre rejeição deve ser flagrado');
  console.log('[VALIDATOR-STATUS] Rejeição x sucesso afirmado -> OK');
}

// ---------------------------------------------------------------------------
// STATUS_CONTRADICTION: narrativa afirma falha quando o Engine aceitou
// ---------------------------------------------------------------------------
{
  const narrative = 'A ação foi recusada: recursos insuficientes.';
  const violations = validateNarrativeConsistency(baseReport(), undefined as never, narrative);
  assert.ok(violations.some(v => v.code === 'STATUS_CONTRADICTION'), 'Falha afirmada sobre aceite deve ser flagrada');
  console.log('[VALIDATOR-STATUS] Aceite x falha afirmada -> OK');
}

// ---------------------------------------------------------------------------
// DELTA_CONTRADICTION: número inventado próximo de recurso (sem negociação)
// ---------------------------------------------------------------------------
{
  const narrative = 'A construção foi autorizada: custo total de 100 SD.';
  const buildReport = baseReport({
    actionExecuted: 'BUILD',
    stateChanges: [{ path: 'weeklyLedger.silverdew', before: 300, after: 250, delta: -50 }]
  });
  const violations = validateNarrativeConsistency(buildReport, undefined as never, narrative);
  assert.ok(violations.some(v => v.code === 'DELTA_CONTRADICTION'), 'Delta divergente deve ser flagrado');
  console.log('[VALIDATOR-DELTA] Delta 100 x 50 -> OK');
}

// ---------------------------------------------------------------------------
// DELTA: número correto não gera violação
// ---------------------------------------------------------------------------
{
  const narrative = 'A construção foi autorizada: custo total de 50 SD.';
  const buildReport = baseReport({
    actionExecuted: 'BUILD',
    stateChanges: [{ path: 'weeklyLedger.silverdew', before: 300, after: 250, delta: -50 }]
  });
  const violations = validateNarrativeConsistency(buildReport, undefined as never, narrative);
  assert.equal(violations.length, 0, `Delta correto não deve gerar violação: ${JSON.stringify(violations)}`);
  console.log('[VALIDATOR-DELTA] Delta correto sem violação -> OK');
}

// ---------------------------------------------------------------------------
// NEGAÇÃO: "não foi executada" em rejeição não gera STATUS_CONTRADICTION
// ---------------------------------------------------------------------------
{
  const rejected = baseReport({ status: 'REJECTED', stateChanges: [], reasonCode: 'Recrutamento RECUSADO (DENIED).' });
  const narrative = 'A ação solicitada não foi executada: Recrutamento RECUSADO (DENIED).';
  const violations = validateNarrativeConsistency(rejected, undefined as never, narrative);
  assert.equal(violations.length, 0, `Negação correta não deve gerar violação: ${JSON.stringify(violations)}`);
  console.log('[VALIDATOR-NEGACAO] "não foi executada" em rejeição -> OK');
}

// ---------------------------------------------------------------------------
// SECRET_LEAKAGE: narrativa vaza descrição excluída estruturalmente
// ---------------------------------------------------------------------------
{
  const narrative = 'Enquanto isso, a Casa Vaelmont planeja secretamente trair o jogador.';
  const violations = validateNarrativeConsistency(baseReport(), undefined as never, narrative, {
    excludedSecretStatements: ['A Casa Vaelmont planeja secretamente trair o jogador.']
  });
  assert.ok(violations.some(v => v.code === 'SECRET_LEAKAGE'), 'Vazamento de segredo deve ser flagrado');
  console.log('[VALIDATOR-SECRET] Vazamento detectado -> OK');
}

// ---------------------------------------------------------------------------
// CLARIFICATION_VIOLATION: esclarecimento pedido, mas narrativa afirma execução
// ---------------------------------------------------------------------------
{
  const clarification = baseReport({
    status: 'REJECTED',
    stateChanges: [],
    reasonCode: 'Comando incompleto: requer esclarecimento.'
  });
  const narrative = 'O recrutamento foi executado com sucesso: 20 soldados incorporados.';
  const violations = validateNarrativeConsistency(clarification, undefined as never, narrative);
  assert.ok(violations.some(v => v.code === 'CLARIFICATION_VIOLATION'), 'Execução afirmada sob esclarecimento deve ser flagrada');
  console.log('[VALIDATOR-CLARIFICATION] Execução sob esclarecimento -> OK');
}

// ---------------------------------------------------------------------------
// ACTION_CONTRADICTION: narrativa descreve ação diferente da executada
// ---------------------------------------------------------------------------
{
  const narrative = 'As caravanas partiram: você vendeu a madeira por um bom preço.';
  const violations = validateNarrativeConsistency(baseReport(), undefined as never, narrative);
  assert.ok(violations.some(v => v.code === 'ACTION_CONTRADICTION'), 'Ação divergente deve ser flagrada');
  console.log('[VALIDATOR-ACTION] Comércio narrado sobre RECRUIT -> OK');
}

// ---------------------------------------------------------------------------
// Sanidade: narrativa fiel do mock não gera nenhuma violação
// ---------------------------------------------------------------------------
{
  const narrative = 'O recrutamento foi autorizado: 20 soldados incorporados às suas forças, e o tesouro arcou com o ônus devido.';
  const violations = validateNarrativeConsistency(baseReport(), undefined as never, narrative);
  assert.equal(violations.length, 0, `Narrativa fiel não deve gerar violação: ${JSON.stringify(violations)}`);
  console.log('[VALIDATOR-SANITY] Narrativa fiel do mock -> OK');
}

console.log('\nSemanticValidation.test.ts: TODOS OS CASOS PASSARAM.');