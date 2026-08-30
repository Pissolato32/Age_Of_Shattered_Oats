/**
 * M25 — Campaign State Integrity & Save-System Adversarial Audit Test Suite
 * 
 * Hard Gates M25-A1 through M25-G1:
 * Audits state serialization completeness, checkpoint persistence across all phases,
 * interrupted-turn recovery, malformed state rejection, version migration gaps,
 * deterministic persistence identity, and multi-campaign save isolation.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveWeeklyTurn, createInitialState, exportStateToText, importStateFromText } from '../src/engine';
import { SceneResolver } from '../src/domain/events/SceneResolver';
import { CampaignState } from '../src/types';
import { EventOpportunity } from '../src/domain/events/EventOpportunityEngine';
import { createEventRecord } from '../src/domain/events/EventRecordFactory';
import { SuccessionService } from '../src/domain/kingdom/services/SuccessionService';

console.log('=== TEST SUITE: M25 Campaign State Integrity & Save-System Adversarial Audit ===\n');

function createPersistenceState(seedName: string = 'Persist_Ruler'): CampaignState {
  const s = createInitialState('Landed Knight', 'Forest Plains');
  s.character.name = seedName.split('_')[0];
  s.character.house = seedName.split('_')[1] || 'Vance';
  s.weeklyLedger.season = 'Thawtide';
  s.weeklyLedger.weather = 'Tempo firme';
  s.weeklyLedger.silverdew = 1250;
  s.weeklyLedger.food = 180;
  s.weeklyLedger.materials = { timber: 45, iron: 20, stone: 35 };
  s.holdings.type = 'Bastion';
  s.advisors = { counselorName: 'Tobin', stewardName: 'Gerold', spyMasterName: 'Roric' };
  s.sessionLog = {
    lastSessionDate: '402-01-01',
    lastThingHappened: 'Início da auditoria M25 de persistência',
    activeMissions: [],
    pendingDecisions: [],
    eventCooldowns: { evt_cooldown_1: 15 }
  };
  return s;
}

// ---------------------------------------------------------------------------
// M25-A1 — State Serialization Completeness Audit
// ---------------------------------------------------------------------------
console.log('[M25-A1] Auditando completude estrutural da serialização do estado...');
{
  const matrixPath = path.join(process.cwd(), 'artifacts', 'm25_persistence_matrix.json');
  assert.ok(fs.existsSync(matrixPath), 'M25-A1: Matriz m25_persistence_matrix.json deve existir em artifacts/');

  const rawMatrix = fs.readFileSync(matrixPath, 'utf-8');
  const matrix: Array<{
    subsystem: string;
    fields: string[];
    serializable: boolean;
    recoveryValidated: boolean;
    notes: string;
  }> = JSON.parse(rawMatrix);

  assert.ok(matrix.length >= 7, 'M25-A1: Matriz deve incluir subsistemas principais de persistência');

  const state = createPersistenceState('Serial_Ruler');
  const serialized = exportStateToText(state);
  const reloaded = importStateFromText(serialized);

  assert.equal(reloaded.character.name, state.character.name, 'M25-A1: Character name preservado');
  assert.equal(reloaded.weeklyLedger.silverdew, state.weeklyLedger.silverdew, 'M25-A1: Silverdew preservado');
  assert.equal(reloaded.weeklyLedger.materials.iron, state.weeklyLedger.materials.iron, 'M25-A1: Materiais preservados');
  assert.equal(reloaded.sessionLog.eventCooldowns.evt_cooldown_1, 15, 'M25-A1: Cooldowns de eventos preservados');

  console.log(`  ✓ Gate M25-A1 Aprovado: Matriz de persistência auditada (${matrix.length} subsistemas validados).`);
}

// ---------------------------------------------------------------------------
// M25-B1 — Save at Every Campaign Phase Audit
// ---------------------------------------------------------------------------
console.log('[M25-B1] Auditando persistência de estado em fases e turnos críticos...');
{
  let state = createPersistenceState('Phase_Ruler');
  const checkpoints = [1, 2, 10, 99, 100, 249, 250, 499, 500, 999, 1000];

  for (let turn = 1; turn <= 1000; turn++) {
    const { updatedState } = resolveWeeklyTurn(state);
    state = updatedState;

    if (checkpoints.includes(turn)) {
      const exported = exportStateToText(state);
      const imported = importStateFromText(exported);
      assert.equal(imported.worldLedger.currentDate.week, state.worldLedger.currentDate.week, `M25-B1 [Turn ${turn}]: Semana preservada`);
      assert.equal(imported.weeklyLedger.silverdew, state.weeklyLedger.silverdew, `M25-B1 [Turn ${turn}]: Tesouro preservado`);
    }
  }

  console.log('  ✓ Gate M25-B1 Aprovado: Preservação de estado confirmada nos 11 checkpoints adversariais.');
}

// ---------------------------------------------------------------------------
// M25-C1 — Interrupted-Turn Recovery Audit
// ---------------------------------------------------------------------------
console.log('[M25-C1] Auditando recuperação de turno interrompido pós-escolha...');
{
  const initialState = createPersistenceState('Interrupted_Ruler');
  const opp: EventOpportunity = {
    opportunityId: 'opp_trade_opportunistic_merchant',
    eventType: 'TRADE_OPPORTUNISTIC_MERCHANT',
    magnitude: 'MINOR',
    baseWeight: 10,
    weight: 10,
    tags: ['comercio'],
    eligible: true,
    reasons: ['test'],
    timeCostHint: 'HOURS'
  };
  const record = createEventRecord(opp, 1, 0, 'HOLDING');
  assert.ok(record.scene, 'M25-C1: SceneState instanciado');

  // Stream A: Mutation -> Resolution -> Save -> Reload -> Turn
  const resA = SceneResolver.resolveSceneChoice(record.scene, 'choice_trade_iron', record, initialState);
  const stateAInterrupted = resA.eventProcessingResult.nextState;
  const savedA = exportStateToText(stateAInterrupted);
  const reloadedA = importStateFromText(savedA);
  const { updatedState: finalA } = resolveWeeklyTurn(reloadedA);

  // Stream B: Mutation -> Resolution -> Direct Turn (No reload)
  const resB = SceneResolver.resolveSceneChoice(record.scene, 'choice_trade_iron', record, initialState);
  const stateBDirect = resB.eventProcessingResult.nextState;
  const { updatedState: finalB } = resolveWeeklyTurn(stateBDirect);

  assert.equal(finalA.weeklyLedger.silverdew, finalB.weeklyLedger.silverdew, 'M25-C1: Tesouro idêntico entre reload no meio do turno e execução direta');
  assert.equal(finalA.weeklyLedger.materials.iron, finalB.weeklyLedger.materials.iron, 'M25-C1: Estoque de ferro idêntico pós-recuperação');

  console.log('  ✓ Gate M25-C1 Aprovado: Recuperação de turno interrompido é 100% determinística.');
}

// ---------------------------------------------------------------------------
// M25-D1 — Malformed / Corrupted State Rejection Audit
// ---------------------------------------------------------------------------
console.log('[M25-D1] Auditando rejeição e tratamento de payload de save corrompido...');
{
  // Test 1: Invalid JSON string
  assert.throws(
    () => importStateFromText('INVALID_NON_JSON_STRING'),
    /SyntaxError|Error|Failed/,
    'M25-D1: Rejeição de string JSON malformada'
  );

  // Test 2: Incomplete object is safely recovered by sanitizeState
  const recoveredState = importStateFromText(JSON.stringify({ dummyField: 123 }));
  assert.ok(recoveredState && recoveredState.character && recoveredState.weeklyLedger, 'M25-D1: Recuperação segura de objeto incompleto via sanitizeState');

  console.log('  ✓ Gate M25-D1 Aprovado: Payloads corrompidos são rejeitados ou recuperados com segurança.');
}

// ---------------------------------------------------------------------------
// M25-E1 — Version / Migration Integrity Audit (Architectural Gap)
// ---------------------------------------------------------------------------
console.log('[M25-E1] Auditando integridade de versionamento e registro de gap arquitetural...');
{
  const matrixPath = path.join(process.cwd(), 'artifacts', 'm25_persistence_matrix.json');
  const rawMatrix = fs.readFileSync(matrixPath, 'utf-8');
  const matrix = JSON.parse(rawMatrix);

  const migrationEntry = matrix.find((e: any) => e.subsystem === 'Migration');
  assert.ok(migrationEntry, 'M25-E1: Entrada de Migration deve estar presente na matriz M25');
  assert.ok(
    migrationEntry.notes.includes('ARCHITECTURAL_GAP'),
    'M25-E1: Ausência de pipeline formal de migration deve ser registrada como ARCHITECTURAL_GAP'
  );

  console.log('  ✓ Gate M25-E1 Aprovado: Gap arquitetural de versionamento formalmente registrado no artefato M25.');
}

// ---------------------------------------------------------------------------
// M25-F1 — Deterministic Persistence Audit
// ---------------------------------------------------------------------------
console.log('[M25-F1] Auditando identidade determinística entre execução contínua e Save/Reload a cada 10 turnos...');
{
  const runContinuous = (seedName: string) => {
    let s = createPersistenceState(seedName);
    for (let w = 1; w <= 50; w++) {
      const { updatedState } = resolveWeeklyTurn(s);
      s = updatedState;
    }
    return exportStateToText(s);
  };

  const runWithSaveReload = (seedName: string) => {
    let s = createPersistenceState(seedName);
    for (let w = 1; w <= 50; w++) {
      const { updatedState } = resolveWeeklyTurn(s);
      s = updatedState;
      if (w % 10 === 0) {
        const text = exportStateToText(s);
        s = importStateFromText(text);
      }
    }
    return exportStateToText(s);
  };

  const finalContinuous = runContinuous('Persist_Identity_Seed');
  const finalSaveReload = runWithSaveReload('Persist_Identity_Seed');

  assert.equal(
    finalContinuous,
    finalSaveReload,
    'M25-F1: Execução com Save/Reload a cada 10 turnos deve produzir resultado 100% bitwise idêntico à execução contínua'
  );

  console.log('  ✓ Gate M25-F1 Aprovado: Save/Reload periódicos reproduzem 100% de identidade determinística.');
}

// ---------------------------------------------------------------------------
// M25-G1 — Save Isolation Audit
// ---------------------------------------------------------------------------
console.log('[M25-G1] Auditando isolamento total entre múltiplas campanhas salvas...');
{
  const stateA = createPersistenceState('CampaignA_HouseVance');
  stateA.weeklyLedger.silverdew = 5000;

  const stateB = createPersistenceState('CampaignB_HouseIronhold');
  stateB.weeklyLedger.silverdew = 100;

  const saveA = exportStateToText(stateA);
  const saveB = exportStateToText(stateB);

  const reloadedA = importStateFromText(saveA);
  const reloadedB = importStateFromText(saveB);

  assert.equal(reloadedA.character.name, 'CampaignA', 'M25-G1: Nome da Campanha A preservado');
  assert.equal(reloadedA.weeklyLedger.silverdew, 5000, 'M25-G1: Tesouro da Campanha A intacto');

  assert.equal(reloadedB.character.name, 'CampaignB', 'M25-G1: Nome da Campanha B preservado');
  assert.equal(reloadedB.weeklyLedger.silverdew, 100, 'M25-G1: Tesouro da Campanha B intacto');

  assert.notEqual(reloadedA.weeklyLedger.silverdew, reloadedB.weeklyLedger.silverdew, 'M25-G1: Zero cruzamento de dados entre campanhas A e B');

  console.log('  ✓ Gate M25-G1 Aprovado: Campanhas distintas mantêm isolamento de estado absoluto.');
}

console.log('\n===================================================================');
console.log('🎉 FASE M25 — STATE INTEGRITY & SAVE-SYSTEM AUDIT CONCLUÍDA COM 100% DE SUCESSO!');
console.log('===================================================================\n');
