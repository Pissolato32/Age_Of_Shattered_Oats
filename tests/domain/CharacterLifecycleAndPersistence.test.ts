import assert from 'node:assert/strict';
import { createInitialState, resolveNarrativeCommand } from '../../src/engine';
import { CharacterLifecycleService, DeathRecord } from '../../src/domain/character/CharacterLifecycle';
import { GenealogyService } from '../../src/domain/character/Genealogy';
import { NarrativeJudge } from '../../src/llm/validators/NarrativeJudge';
import { NarrativeReportSanitizer } from '../../src/llm/contracts/NarrativeExecutionReport';
import { NarrativeCommand } from '../../src/lib/narrativeContracts';
import { CampaignState } from '../../src/types';

console.log('=== TEST SUITE: CHARACTER LIFECYCLE, PERSISTENCE & REVERSE ATTACK INVARIANTS ===\n');

// ---------------------------------------------------------------------------
// 1. CHARACTER LIFECYCLE MUTATIONS & INVARIANTS
// ---------------------------------------------------------------------------
{
  console.log('[TEST 1] Testando Transições de Estado de Ciclo de Vida de Personagens...');

  const state = createInitialState('Noble Ruler', 'Central Plains');
  const roster = CharacterLifecycleService.getHistoricalRoster(state);
  assert.ok(roster.length >= 6, 'Roster deve conter personagens canônicos');

  // 1a. Ren está vivo com papel de Marechal
  const ren = CharacterLifecycleService.findCharacter('Ren', state);
  assert.ok(ren);
  assert.equal(ren!.lifeState, 'alive');
  assert.equal(ren!.currentRole, 'marshal');

  // 1b. Transição de Papel (Role Transition): Ren é nomeado Chanceler no turno 15
  CharacterLifecycleService.assignCharacterRole(state, 'Ren', 'chancellor', 15);
  assert.equal(ren!.currentRole, 'chancellor');
  assert.equal(ren!.roleHistory.length, 2);
  assert.equal(ren!.roleHistory[0].role, 'marshal');
  assert.equal(ren!.roleHistory[0].toTurn, 15);
  assert.equal(ren!.roleHistory[1].role, 'chancellor');
  assert.equal(ren!.roleHistory[1].fromTurn, 15);

  // 1c. Morte de Personagem: Ren tomba no turno 28
  const deathRecord: DeathRecord = {
    turn: 28,
    cause: 'Flechada nas muralhas durante o cerco',
    place: 'Grey Keep',
    killerId: 'raider_archer_1'
  };
  CharacterLifecycleService.killCharacter(state, 'Ren', deathRecord);
  assert.equal(ren!.lifeState, 'dead');
  assert.equal(ren!.currentRole, null);
  assert.equal(ren!.roleHistory[1].toTurn, 28);
  assert.deepEqual(ren!.death, deathRecord);

  // 1d. INVARIANTE: Morto não pode receber novo papel
  assert.throws(
    () => CharacterLifecycleService.assignCharacterRole(state, 'Ren', 'steward', 30),
    /Invariant Violation/,
    'Tentativa de atribuir cargo a personagem falecido deve lançar erro'
  );

  console.log('  ✅ Transições de ciclo de vida e invariante de bloqueio a mortos aprovados.');
}

// ---------------------------------------------------------------------------
// 2. PERSISTÊNCIA E SERIALIZAÇÃO SAVE/LOAD
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 2] Testando Persistência e Sobrevivência a Save/Load (JSON Serialization)...');

  const stateBefore = createInitialState('Noble Ruler', 'Central Plains');
  CharacterLifecycleService.assignCharacterRole(stateBefore, 'Barth', 'diplomat', 10);
  CharacterLifecycleService.killCharacter(stateBefore, 'Barth', {
    turn: 22,
    cause: 'Febre de pântano',
    place: 'Pântanos do Sul'
  });

  // Simula ciclo completo de Save/Reload
  const serialized = JSON.stringify(stateBefore);
  const stateReloaded: CampaignState = JSON.parse(serialized);

  const barthReloaded = CharacterLifecycleService.findCharacter('Barth', stateReloaded);
  assert.ok(barthReloaded, 'Barth deve sobreviver ao reload');
  assert.equal(barthReloaded!.lifeState, 'dead', 'Estado de morte deve persistir após reload');
  assert.equal(barthReloaded!.currentRole, null);
  assert.equal(barthReloaded!.death?.turn, 22);
  assert.equal(barthReloaded!.roleHistory.length, 2);
  assert.equal(barthReloaded!.roleHistory[0].role, 'steward');
  assert.equal(barthReloaded!.roleHistory[0].toTurn, 10);
  assert.equal(barthReloaded!.roleHistory[1].role, 'diplomat');
  assert.equal(barthReloaded!.roleHistory[1].toTurn, 22);

  console.log('  ✅ Persistência aprovada: histórico de papéis e registro de morte 100% intactos após reload.');
}

// ---------------------------------------------------------------------------
// 3. GENEALOGIA E LINHAGEM DO JOGADOR
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 3] Testando Linhagem Genealógica e Retenção de Ancestrais...');

  const state = createInitialState('Noble Ruler', 'Central Plains');
  const ancestry = GenealogyService.getAncestryLine(state, 'ruler_current');

  assert.ok(ancestry.length >= 3, 'Linhagem deve conter pelo menos 3 gerações até o fundador');
  assert.equal(ancestry[0].characterId, 'ruler_current');
  assert.equal(ancestry[0].generation, 0);
  assert.equal(ancestry[1].characterId, 'father_alden_jr');
  assert.equal(ancestry[1].generation, -1);
  assert.equal(ancestry[2].characterId, 'founder_alden');
  assert.equal(ancestry[2].generation, -2);

  assert.equal(GenealogyService.isDescendantOf(state, 'ruler_current', 'founder_alden'), true);

  console.log('  ✅ Genealogia aprovada: rastreamento de linhagem soberana validado.');
}

// ---------------------------------------------------------------------------
// 4. AUTORIDADE DA ENGINE: BLOQUEIO DE COMANDOS A MORTOS
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 4] Testando Bloqueio Autoritativo de Ações para Personagens Falecidos...');

  const state = createInitialState('Noble Ruler', 'Central Plains');

  // 4a. Ação militar direcionada ao General Morr (morto)
  const deadCmd: NarrativeCommand = {
    contractVersion: 1,
    commandId: 'cmd_test_dead',
    actorId: 'player',
    action: 'MILITARY',
    targetId: 'General Morr',
    constraints: [],
    confidence: 0.95,
    ambiguity: [],
    requiresClarification: false
  };

  const { report, mutated } = resolveNarrativeCommand(deadCmd, state);
  assert.equal(mutated, false);
  assert.equal(report.status, 'REJECTED', 'Comando a personagem morto deve ser categoricamente REJEITADO');
  assert.ok(report.reasonCode?.includes('morto'), `Razão esperada conter 'morto', obteve: ${report.reasonCode}`);

  // 4b. Consulta informativa sobre o General Morr (permitida)
  const infoCmd: NarrativeCommand = {
    contractVersion: 1,
    commandId: 'cmd_test_info_dead',
    actorId: 'player',
    action: 'INFORMATION',
    targetId: 'General Morr',
    constraints: [],
    confidence: 0.95,
    ambiguity: [],
    requiresClarification: false
  };

  const { report: infoReport } = resolveNarrativeCommand(infoCmd, state);
  assert.equal(infoReport.status, 'ACCEPTED', 'Consulta sobre figura histórica deve ser aceita');

  console.log('  ✅ Bloqueio de ações a mortos validado na fronteira da Engine.');
}

// ---------------------------------------------------------------------------
// 5. TESTE DE ATAQUE REVERSO: ENGINE -> NARRATIVE LLM (STATE DIVERGENCE)
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 5] Testando Ataque Reverso e Imutabilidade do Estado sob Alucinação Narrativa...');

  const state = createInitialState('Noble Ruler', 'Central Plains');
  const initialSilverdew = state.weeklyLedger.silverdew;

  // 1. Engine resolve como REJEITADO / FALHA
  const failedReport = {
    commandId: 'cmd_failed_siege',
    actionExecuted: 'MILITARY',
    status: 'REJECTED',
    reasonCode: 'DEFESA_INSUFICIENTE',
    stateChanges: [],
    consequences: []
  };

  const sanitized = NarrativeReportSanitizer.sanitize(failedReport, 1);

  // 2. LLM alucina vitória triunfante e reivindica ganho de recursos
  const hallucinatedNarration = 'A vitória foi absoluta e conquistamos 500 moedas de prata para os cofres!';

  const judgment = NarrativeJudge.judge(hallucinatedNarration, undefined, sanitized);
  assert.equal(judgment.hallucination, true, 'Deve identificar alucinação de vitória em derrota');
  assert.equal(judgment.stateDivergence, true, 'Deve sinalizar divergência de estado');

  // 3. INVARIANTE SUPREMO: A narrativa NUNCA muta o CampaignState
  assert.equal(state.weeklyLedger.silverdew, initialSilverdew, 'O estado do mundo deve permanecer 100% inalterado');

  console.log('  ✅ Ataque Reverso aprovado: alucinação detectada e estado do mundo 100% preservado.');
}

console.log('\n🎉 CharacterLifecycleAndPersistence.test.ts: TODOS OS 5 TESTES DE INVARIANTES PASSARAM COM SUCESSO!\n');
