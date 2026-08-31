import { resolveAction } from '../../src/lib/ruleResolver';
import { resolveNarrativeCommand } from '../../src/lib/narrativeExecution';
import { NarrativeCommand } from '../../src/lib/narrativeContracts';
import { CampaignState } from '../../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function createMockState(): CampaignState {
  return {
    campaignId: 'test_camp_01',
    schemaVersion: '1.0.0',
    character: {
      id: 'char_01',
      name: 'Roric',
      archetype: 'Renascent Lord',
      attributes: { martial: 10, intrigue: 10, stewardship: 10, diplomacy: 10 },
      isAlive: true,
      traits: []
    } as any,
    holdings: {
      id: 'holding_grey_keep',
      name: 'Grey Keep',
      population: 500,
      laborPool: 400,
      garrison: 40,
      fortification: { tier: 1 }
    } as any,
    weeklyLedger: {
      silverdew: 300,
      food: 120,
      materials: { timber: 20, stone: 10, iron: 10 }
    } as any,
    army: {
      units: []
    } as any,
    worldLedger: {
      currentDate: { year: 342, month: 'Longdark', week: 2 }
    } as any
  } as unknown as CampaignState;
}

function createTestCommand(overrides: Partial<NarrativeCommand> & { action: NarrativeCommand['action'] }): NarrativeCommand {
  return {
    contractVersion: 1,
    commandId: overrides.commandId || `cmd_${Date.now()}`,
    actorId: overrides.actorId || 'char_01',
    action: overrides.action,
    targetId: overrides.targetId,
    objectId: overrides.objectId,
    locationId: overrides.locationId,
    magnitude: overrides.magnitude,
    stance: overrides.stance || 'NEUTRAL',
    constraints: overrides.constraints || [],
    confidence: overrides.confidence ?? 1.0,
    ambiguity: overrides.ambiguity || [],
    requiresClarification: overrides.requiresClarification ?? false,
    parameters: overrides.parameters
  };
}

export function runTradeBudgetInvariantTests() {
  console.log("=== EXECUTANDO SUÍTE DE TESTES: M28.0 TRADE BUDGET & M28.1 MUTATION SEMANTICS ===");

  // --------------------------------------------------------------------------
  // 1. Separação de Quantidade Física vs. Teto Orçamentário (maxCost)
  // --------------------------------------------------------------------------
  console.log("1. Testando separação de parâmetros na Engine determinística...");

  const state1 = createMockState();
  const resDenied = resolveAction("Compre 100 alimentos por até 100 moedas", state1, { maxCost: 100, quantity: 100 });
  assert(resDenied.decision === 'DENIED', "Transação com custo acima do maxCost DEVE ser RECUSADA (DENIED)");
  assert(resDenied.effects.length === 0, "Transação recusada por orçamento NÃO PODE ter efeitos");
  assert(resDenied.decisionReason?.includes('ORÇAMENTO'), "Motivo de recusa deve indicar teto orçamentário");
  console.log("  ✅ Transação acima de maxCost rejeitada com zero efeitos.");

  const state2 = createMockState();
  const res2 = resolveAction('compre comida, mas não gaste mais de 100 moedas', state2);
  assert(res2.decision === 'ALLOWED', "compra com teto deve ser ALLOWED");
  const sd2 = res2.effects.find(e => e.resource === 'weeklyLedger.silverdew');
  const food2 = res2.effects.find(e => e.resource === 'weeklyLedger.food');
  assert(Math.abs(Number(sd2?.delta ?? 0)) <= 100, "Custo real não pode exceder o teto de 100 SD");
  assert((food2?.delta ?? 0) === 66, "Deve adquirir 66 FSU (99 SD <= 100 SD)");
  console.log("  ✅ 'não gaste mais de 100 moedas' -> maxCost=100, quantity calculada segura.");

  const state3 = createMockState();
  const res3 = resolveAction('compre 100 unidades de comida gastando no máximo 150 moedas', state3);
  assert(res3.decision === 'ALLOWED', "qty=100 com maxCost=150 deve ser ALLOWED");
  const sd3 = res3.effects.find(e => e.resource === 'weeklyLedger.silverdew');
  assert(sd3?.delta === -150, "Custo de 150 SD permitido pelo teto de 150 SD");
  console.log("  ✅ 'compre 100 unidades... max 150 moedas' -> ALLOWED (150 SD <= 150 SD).");

  const state4 = createMockState();
  const res4 = resolveAction('compre 100 unidades de comida gastando no máximo 100 moedas', state4);
  assert(res4.decision === 'DENIED', "qty=100 com maxCost=100 DEVE ser DENIED");
  assert(res4.effects.length === 0, "Ação negada não pode produzir efeitos");
  assert(res4.decisionReason.includes("excede o orçamento máximo autorizado"), "Razão deve indicar violação orçamentária");
  console.log("  ✅ 'compre 100 unidades... max 100 moedas' -> DENIED (150 SD > 100 SD).");

  // --------------------------------------------------------------------------
  // 2. Teste de Propriedade/Invariante: actualCost > maxCost => ZERO mutação
  // --------------------------------------------------------------------------
  console.log("2. Testando propriedade de invariante para qualquer transação...");
  const testCases = [
    { qty: 200, maxCost: 100, item: 'comida' },
    { qty: 50, maxCost: 20, item: 'madeira' },
    { qty: 30, maxCost: 25, item: 'pedra' },
    { qty: 20, maxCost: 15, item: 'ferro' }
  ];

  for (const tc of testCases) {
    const s = createMockState();
    const initSD = s.weeklyLedger.silverdew;
    const initFood = s.weeklyLedger.food;

    const cmd = createTestCommand({
      commandId: `cmd_prop_${tc.item}`,
      actorId: 'char_01',
      action: 'TRADE',
      objectId: tc.item,
      parameters: {
        quantity: tc.qty,
        maxCost: tc.maxCost
      }
    });

    const res = resolveNarrativeCommand(cmd, s);
    assert(res.report.status === 'REJECTED', `Transação excedendo teto deve ser REJECTED (${tc.item})`);
    assert(res.actionMutatedState === false, "actionMutatedState deve ser false");
    assert(res.mutated === false, "mutated deve ser false");
    assert(res.report.stateChanges.length === 0, "Zero stateChanges");
    assert(res.state.weeklyLedger.silverdew === initSD, "Silverdew inalterado");
    assert(res.state.weeklyLedger.food === initFood, "Comida inalterada");
  }
  console.log("  ✅ Propriedade de invariante aprovada em todos os tipos de insumo.");

  // --------------------------------------------------------------------------
  // 3. Regressões Históricas do Playtest (T11 e T16)
  // --------------------------------------------------------------------------
  console.log("3. Executando testes de regressão dos Turnos 11 e 16...");

  // T11
  const stateT11 = createMockState();
  const cmdT11 = createTestCommand({
    commandId: 'cmd_t11',
    actorId: 'char_01',
    action: 'TRADE',
    objectId: 'alimentos',
    parameters: {
      quantity: 100, // Lote de 100 FSU = 150 SD
      maxCost: 100
    }
  });
  const resT11 = resolveNarrativeCommand(cmdT11, stateT11);
  assert(resT11.report.status === 'REJECTED', "T11 deve ser REJECTED");
  assert(resT11.actionMutatedState === false, "T11 actionMutatedState deve ser false");
  assert(resT11.state.weeklyLedger.silverdew === 300, "T11 não gastou 150 SD indevidamente");
  assert(resT11.state.weeklyLedger.food === 120, "T11 não adicionou comida");
  console.log("  ✅ Regressão T11 Aprovada: Violação de orçamento P0 impedida na Engine.");

  // T16
  const stateT16 = createMockState();
  const cmdT16 = createTestCommand({
    commandId: 'cmd_t16',
    actorId: 'char_01',
    action: 'TRADE',
    objectId: 'alimentos',
    parameters: {
      quantity: 100,
      maxCost: 100,
      rejectIfExceeds: true
    }
  });
  const resT16 = resolveNarrativeCommand(cmdT16, stateT16);
  assert(resT16.report.status === 'REJECTED', "T16 deve ser REJECTED");
  assert(resT16.actionMutatedState === false, "T16 actionMutatedState deve ser false");
  assert(resT16.state.weeklyLedger.silverdew === 300, "T16 silverdew preservado");
  console.log("  ✅ Regressão T16 Aprovada: Recusa limpa sem débito.");

  // Contra-teste (maxCost = 150)
  const stateCounter = createMockState();
  const cmdCounter = createTestCommand({
    commandId: 'cmd_counter',
    actorId: 'char_01',
    action: 'TRADE',
    objectId: 'alimentos',
    parameters: {
      quantity: 100,
      maxCost: 150
    }
  });
  const resCounter = resolveNarrativeCommand(cmdCounter, stateCounter);
  assert(resCounter.report.status === 'ACCEPTED', "Contra-teste deve ser ACCEPTED");
  assert(resCounter.actionMutatedState === true, "actionMutatedState deve ser true");
  assert(resCounter.state.weeklyLedger.silverdew === 150, "Silverdew debitado corretamente (300 - 150 = 150)");
  assert(resCounter.state.weeklyLedger.food === 220, "Comida creditada corretamente (120 + 100 = 220)");
  console.log("  ✅ Contra-teste Aprovado: Transação autorizada aceita quando custo <= maxCost.");

  // --------------------------------------------------------------------------
  // 4. M28.1 Telemetria: Separação Semântica Action vs. System
  // --------------------------------------------------------------------------
  console.log("4. Testando telemetria de mutação separada...");
  const stateInfo = createMockState();
  const cmdInfo = createTestCommand({
    commandId: 'cmd_info',
    actorId: 'char_01',
    action: 'INFORMATION',
    objectId: 'tropas'
  });
  const resInfo = resolveNarrativeCommand(cmdInfo, stateInfo);
  assert(resInfo.report.status === 'ACCEPTED', "INFORMATION deve ser ACCEPTED");
  assert(resInfo.actionMutatedState === false, "INFORMATION actionMutatedState deve ser false");
  assert(resInfo.mutated === false, "INFORMATION mutated deve ser false");
  console.log("  ✅ Telemetria M28.1 Aprovada: actionMutatedState=false em consultas e recusas.");

  console.log("=== TODOS OS TESTES DE INVARIANTE M28.0/M28.1 PASSARAM COM SUCESSO ===");
}

if (process.argv[1]?.endsWith('TradeBudgetInvariant.test.ts')) {
  runTradeBudgetInvariantTests();
}
