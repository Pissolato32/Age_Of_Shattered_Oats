import assert from 'node:assert/strict';
import { createInitialState } from '../../src/engine';
import { CharacterLifecycleService, HistoricalCharacter } from '../../src/domain/character/CharacterLifecycle';
import { GenealogyService, GenealogyRecord } from '../../src/domain/character/Genealogy';
import { CampaignState } from '../../src/types';

console.log('=== TEST SUITE: HISTORICAL LIFECYCLE STRESS, GENEALOGY & 10,000-TURN GROWTH AUDIT ===\n');

// ---------------------------------------------------------------------------
// 1. EXACT ROLE HISTORY SEQUENCE & IDEMPOTENCY
// ---------------------------------------------------------------------------
{
  console.log('[TEST 1] Testando Sequência Exata de Role History e Idempotência...');

  const state = createInitialState('Noble Ruler', 'Central Plains');

  // Inicializa personagem Mara
  const mara: HistoricalCharacter = {
    id: 'mara_test',
    name: 'Mara de Valenfort',
    lifeState: 'alive',
    currentRole: 'advisor',
    roleHistory: [{ role: 'advisor', fromTurn: 1 }],
    historicalImportance: 4
  };
  CharacterLifecycleService.getHistoricalRoster(state).push(mara);

  // Turn 20: Mara -> Chancellor
  CharacterLifecycleService.assignCharacterRole(state, 'mara_test', 'chancellor', 20);
  assert.equal(mara.currentRole, 'chancellor');
  assert.equal(mara.roleHistory.length, 2);
  assert.equal(mara.roleHistory[0].toTurn, 20);
  assert.equal(mara.roleHistory[1].fromTurn, 20);

  // Turn 20: Reatribuição do mesmo papel (idempotência)
  CharacterLifecycleService.assignCharacterRole(state, 'mara_test', 'chancellor', 20);
  assert.equal(mara.roleHistory.length, 2, 'Reatribuir mesmo papel não deve criar períodos duplicados');

  // Turn 50: Mara -> Regent
  CharacterLifecycleService.assignCharacterRole(state, 'mara_test', 'regent', 50);
  assert.equal(mara.currentRole, 'regent');
  assert.equal(mara.roleHistory.length, 3);
  assert.equal(mara.roleHistory[1].toTurn, 50);
  assert.equal(mara.roleHistory[2].fromTurn, 50);

  // Turn 80: Mara dies
  CharacterLifecycleService.killCharacter(state, 'mara_test', {
    turn: 80,
    cause: 'Idade avançada na cidadela',
    place: 'Grey Keep'
  });

  assert.equal(mara.lifeState, 'dead');
  assert.equal(mara.currentRole, null);
  assert.equal(mara.death?.turn, 80);
  assert.equal(mara.roleHistory.length, 3);
  assert.equal(mara.roleHistory[2].toTurn, 80);

  assert.deepEqual(mara.roleHistory, [
    { role: 'advisor', fromTurn: 1, toTurn: 20 },
    { role: 'chancellor', fromTurn: 20, toTurn: 50 },
    { role: 'regent', fromTurn: 50, toTurn: 80 }
  ]);

  // Invariante: Morto não pode receber novo papel
  assert.throws(
    () => CharacterLifecycleService.assignCharacterRole(state, 'mara_test', 'chancellor', 85),
    /Invariant Violation/
  );

  console.log('  ✅ Sequência exata de cargos, idempotência e bloqueio a mortos aprovados.');
}

// ---------------------------------------------------------------------------
// 2. GENEALOGIA: DIRECIONALIDADE E PROTEÇÃO CONTRA CICLOS
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 2] Testando Direcionalidade e Proteção contra Ciclos em Genealogia...');

  const state = createInitialState('Noble Ruler', 'Central Plains');

  // Direcionalidade básica
  assert.equal(GenealogyService.isDescendantOf(state, 'ruler_current', 'founder_alden'), true);
  assert.equal(GenealogyService.isDescendantOf(state, 'founder_alden', 'ruler_current'), false);

  // Teste de Grafo Cíclico: A -> B -> C -> A
  const cyclicGenealogy: Record<string, GenealogyRecord> = {
    'char_a': { characterId: 'char_a', name: 'A', parentIds: ['char_b'], childIds: [], spouseIds: [], isPlayerLineage: false, generation: 0 },
    'char_b': { characterId: 'char_b', name: 'B', parentIds: ['char_c'], childIds: [], spouseIds: [], isPlayerLineage: false, generation: -1 },
    'char_c': { characterId: 'char_c', name: 'C', parentIds: ['char_a'], childIds: [], spouseIds: [], isPlayerLineage: false, generation: -2 }
  };
  (state as any).genealogy = cyclicGenealogy;

  const ancestryLine = GenealogyService.getAncestryLine(state, 'char_a');
  assert.equal(ancestryLine.length, 3, 'A busca deve abortar ao detectar ciclo sem loop infinito');
  assert.equal(ancestryLine.map(r => r.characterId).join('->'), 'char_a->char_b->char_c');

  console.log('  ✅ Direcionalidade e proteção contra ciclos infinitos validadas com sucesso.');
}

// ---------------------------------------------------------------------------
// 3. STRESS TEST: 1.000 PERSONAGENS, 10.000 TRANSIÇÕES, 5.000 MORTES E RELOADS
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 3] Executando Stress Test de Ciclo de Vida: 1.000 Personagens, 10.000 Transições e Save/Reloads...');

  let state = createInitialState('Noble Ruler', 'Central Plains');
  let roster = CharacterLifecycleService.getHistoricalRoster(state);

  // Gera 1.000 personagens históricos
  for (let i = 1; i <= 1000; i++) {
    roster.push({
      id: `char_stress_${i}`,
      name: `Personagem Histórico ${i}`,
      house: `Casa ${i % 20}`,
      lifeState: 'alive',
      currentRole: 'levy_officer',
      roleHistory: [{ role: 'levy_officer', fromTurn: 1 }],
      historicalImportance: (i % 5) + 1
    });
  }

  assert.ok(roster.length >= 1000);

  const roles = ['marshal', 'chancellor', 'steward', 'diplomat', 'scout_master', 'spymaster'];

  // Executa 10.000 transições de papel aleatórias com persistência intercalada
  for (let step = 1; step <= 10000; step++) {
    const charIndex = (step * 37) % 1000;
    const char = roster[charIndex];
    const turn = Math.floor(step / 10) + 1;

    if (char.lifeState === 'alive') {
      const nextRole = roles[step % roles.length];
      CharacterLifecycleService.assignCharacterRole(state, char.id, nextRole, turn);
    }

    // A cada 200 passos, executa ciclo completo de Save/Reload (50 saves/reloads no total)
    if (step % 200 === 0) {
      const serialized = JSON.stringify(state);
      const previousRoster = roster;
      state = JSON.parse(serialized) as CampaignState;
      roster = CharacterLifecycleService.getHistoricalRoster(state);
      assert.notEqual(roster, previousRoster, 'Roster desserializado deve ser uma nova referência');
    }
  }

  // Executa 5.000 chamadas de morte distribuídas
  const uniqueKilled = new Set<string>();
  for (let d = 1; d <= 5000; d++) {
    const charIndex = (d * 73) % 1000;
    const char = roster[charIndex];
    const turn = 1000 + d;

    CharacterLifecycleService.killCharacter(state, char.id, {
      turn,
      cause: 'Combate na Grande Guerra',
      place: 'Campo de Batalha'
    });
    uniqueKilled.add(char.id);
  }

  // Save/Reload após todas as mortes para validar integridade do estado persistido
  const finalSerialized = JSON.stringify(state);
  state = JSON.parse(finalSerialized) as CampaignState;
  roster = CharacterLifecycleService.getHistoricalRoster(state);

  // 20.000 consultas ao estado recém-desserializado
  let deadNeverActiveCount = 0;
  for (let q = 1; q <= 20000; q++) {
    const charIndex = (q * 41) % 1000;
    const char = roster[charIndex];
    if (char.lifeState === 'dead') {
      assert.equal(char.currentRole, null, 'Personagem morto no estado desserializado NUNCA pode ter cargo ativo');
      deadNeverActiveCount++;
    }
  }

  console.log(`  ✅ Stress Test concluído: 10.000 transições, 5.000 chamadas de kill (${uniqueKilled.size} personagens únicos falecidos), 50 saves/reloads e 20.000 verificações no estado desserializado.`);
}

// ---------------------------------------------------------------------------
// 4. AUDITORIA DE CRESCIMENTO E PEGADA DE MEMÓRIA (10.000 TURNOS DE HISTÓRIA)
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 4] Auditando Pegada de Memória em Simulação de Longo Prazo (10.000 Turnos)...');

  let state = createInitialState('Noble Ruler', 'Central Plains');
  const sizes: { turn: number; sizeBytes: number; sizeFormatted: string }[] = [];

  const checkpoints = [1, 100, 1000, 5000, 10000];

  for (let turn = 1; turn <= 10000; turn++) {
    state.weeklyLedger.week = (turn % 4) + 1;
    state.weeklyLedger.year = 342 + Math.floor(turn / 48);

    // Eventos históricos e dinastia
    if (turn % 50 === 0) {
      state.worldLedger.majorEvents.push({
        date: `Y${state.weeklyLedger.year}, W${state.weeklyLedger.week}`,
        event: `Tratado selado no turno ${turn}`,
        region: 'Central Plains',
        involved: 'Casa Stormcrest e Casas Vizinhas',
        resolved: 'Yes'
      });
    }

    if (checkpoints.includes(turn)) {
      const json = JSON.stringify(state);
      const sizeBytes = Buffer.byteLength(json, 'utf8');
      const sizeFormatted = sizeBytes > 1024 * 1024 
        ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
        : `${(sizeBytes / 1024).toFixed(2)} KB`;
      sizes.push({ turn, sizeBytes, sizeFormatted });
    }
  }

  console.log('  📊 Relatório de Crescimento de Memória:');
  for (const s of sizes) {
    console.log(`     • Turno ${String(s.turn).padStart(5, ' ')} : ${s.sizeFormatted}`);
  }

  // Verificação de contenção: 10.000 turnos não devem exceder 5 MB
  const finalSize = sizes[sizes.length - 1].sizeBytes;
  assert.ok(finalSize < 5 * 1024 * 1024, `Tamanho final (${finalSize} bytes) excede orçamento de 5 MB`);

  console.log('  ✅ Auditoria de pegada de memória aprovada: sem vazamento ou explosão descontrolada de estado.');
}

console.log('\n🎉 HistoricalLifecycleStress.test.ts: TODOS OS 4 TESTES DE STRESS E MEMÓRIA PASSARAM COM 100% DE SUCESSO!\n');
