import { applyResolutionToState, hashMechanicalState, verifyStateIntegrity, RuleResolutionResult } from '../../src/lib/ruleResolver';
import { executeGameplayPipeline } from '../../src/lib/gameplayPipeline';
import { createInitialState } from '../../src/engine';
import { CampaignState } from '../../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

export function runMaterialMutationInvariantTests() {
  console.log("=== EXECUTANDO SUÍTE DE TESTES: MATERIAL MUTATION INVARIANT (CAUSAL_INVARIANTS.md) ===");
  const baseState: CampaignState = createInitialState("Noble Ruler", "Stormcrest");

  // --------------------------------------------------------------------------
  // Cenário 1: effects: [] (Lista vazia) -> mutated === false e preservação referencial
  // --------------------------------------------------------------------------
  console.log("1. Testando effects: [] (lista vazia)...");
  const emptyResolution: RuleResolutionResult = {
    intent: 'INFORMATION',
    decision: 'ALLOWED',
    authority: 'CODEX',
    conditions: [],
    effects: [],
    evidence: [],
    mechanicalAllowed: true,
    decisionReason: 'Ação sem efeitos mecânicos.',
    webFlavorAllowed: false
  };
  const emptyRes = applyResolutionToState(baseState, emptyResolution);
  assert(emptyRes.mutated === false, "effects: [] deve retornar mutated: false");
  assert(emptyRes.updatedState === baseState, "effects: [] deve retornar exatamente a mesma referência de estado");
  assert(verifyStateIntegrity(baseState, emptyRes.updatedState), "Integridade de estado deve ser mantida");
  console.log("  ✅ Cenário 1 Aprovado: effects: [] preserva referência e retorna mutated === false.");

  // --------------------------------------------------------------------------
  // Cenário 2: delta === 0 (Efeito numérico neutro) -> mutated === false
  // --------------------------------------------------------------------------
  console.log("2. Testando efeito com delta: 0...");
  const zeroDeltaResolution: RuleResolutionResult = {
    intent: 'TRADE',
    decision: 'ALLOWED',
    authority: 'CODEX',
    conditions: [],
    effects: [
      { resource: 'weeklyLedger.silverdew', delta: 0 }
    ],
    evidence: [],
    mechanicalAllowed: true,
    decisionReason: 'Transação de valor zero.',
    webFlavorAllowed: false
  };
  const zeroRes = applyResolutionToState(baseState, zeroDeltaResolution);
  assert(zeroRes.mutated === false, "delta: 0 deve resultar em mutated: false");
  assert(zeroRes.updatedState === baseState, "delta: 0 deve retornar a referência original do estado (zero clone)");
  assert(hashMechanicalState(baseState) === hashMechanicalState(zeroRes.updatedState), "Hashes mecânicos devem ser idênticos");
  console.log("  ✅ Cenário 2 Aprovado: delta: 0 não altera estado e retorna mutated === false.");

  // --------------------------------------------------------------------------
  // Cenário 3: delta não numérico / inválido (string não numérica) -> mutated === false
  // --------------------------------------------------------------------------
  console.log("3. Testando efeito com delta não numérico...");
  const invalidDeltaResolution: RuleResolutionResult = {
    intent: 'BUILD',
    decision: 'ALLOWED',
    authority: 'CODEX',
    conditions: [],
    effects: [
      { resource: 'materials.timber', delta: "INVALID_NON_NUMERIC" }
    ],
    evidence: [],
    mechanicalAllowed: true,
    decisionReason: 'Delta inválido ignorado.',
    webFlavorAllowed: false
  };
  const invalidRes = applyResolutionToState(baseState, invalidDeltaResolution);
  assert(invalidRes.mutated === false, "delta inválido deve resultar em mutated: false");
  assert(invalidRes.updatedState === baseState, "delta inválido deve preservar a referência do estado original");
  console.log("  ✅ Cenário 3 Aprovado: delta não numérico ignorado com segurança.");

  // --------------------------------------------------------------------------
  // Cenário 4: Mutação Material Real (Σ|Δ| > 0) -> mutated === true
  // --------------------------------------------------------------------------
  console.log("4. Testando mutação material real (silverdew, comida, materiais, tropas)...");
  const realMutationResolution: RuleResolutionResult = {
    intent: 'RECRUIT',
    decision: 'ALLOWED',
    authority: 'CODEX',
    conditions: [],
    effects: [
      { resource: 'weeklyLedger.silverdew', delta: -30 },
      { resource: 'army.units.levies', delta: 10 }
    ],
    evidence: [],
    mechanicalAllowed: true,
    decisionReason: 'Recrutamento aprovado.',
    webFlavorAllowed: true
  };
  const realRes = applyResolutionToState(baseState, realMutationResolution);
  assert(realRes.mutated === true, "Mutação real deve retornar mutated: true");
  assert(realRes.updatedState !== baseState, "Mutação real deve retornar novo objeto de estado");
  assert(realRes.updatedState.weeklyLedger.silverdew === baseState.weeklyLedger.silverdew - 30, "Silverdew deve ser debitado");
  assert(hashMechanicalState(baseState) !== hashMechanicalState(realRes.updatedState), "Hash mecânico deve mudar com mutação real");
  console.log("  ✅ Cenário 4 Aprovado: Mutação material real reflete delta de recursos e mutated === true.");

  // --------------------------------------------------------------------------
  // Cenário 5: Verificação dos Recursos Mecânicos Suportados
  // --------------------------------------------------------------------------
  console.log("5. Testando mutações em food, laborPool e materials...");
  const multiResourceResolution: RuleResolutionResult = {
    intent: 'BUILD',
    decision: 'ALLOWED',
    authority: 'CODEX',
    conditions: [],
    effects: [
      { resource: 'weeklyLedger.food', delta: -10 },
      { resource: 'holdings.laborPool', delta: -5 },
      { resource: 'materials.stone', delta: -20 },
      { resource: 'materials.iron', delta: 15 }
    ],
    evidence: [],
    mechanicalAllowed: true,
    decisionReason: 'Obras aprovadas.',
    webFlavorAllowed: false
  };
  const multiRes = applyResolutionToState(baseState, multiResourceResolution);
  assert(multiRes.mutated === true, "Multi-recursos com deltas válidos devem retornar mutated: true");
  assert(multiRes.updatedState.weeklyLedger.food === Math.max(0, baseState.weeklyLedger.food - 10), "Comida decrementada");
  assert(multiRes.updatedState.holdings.laborPool === baseState.holdings.laborPool - 5, "Mão de obra decrementada");
  assert(multiRes.updatedState.weeklyLedger.materials.stone === baseState.weeklyLedger.materials.stone - 20, "Pedra decrementada");
  assert(multiRes.updatedState.weeklyLedger.materials.iron === baseState.weeklyLedger.materials.iron + 15, "Ferro incrementado");
  console.log("  ✅ Cenário 5 Aprovado: Recursos mecânicos gerenciados com fidelidade.");

  // --------------------------------------------------------------------------
  // Cenário 6: Integração End-to-End com GameplayPipeline
  // --------------------------------------------------------------------------
  console.log("6. Testando integração com gameplayPipeline (Defensive Integrity)...");
  
  // Ação Informativa / No-Op
  const infoPipeline = executeGameplayPipeline("Quanto custa recrutar soldados?", baseState);
  assert(infoPipeline.stateMutated === false, "Ação informativa no pipeline deve ter stateMutated === false");
  assert(infoPipeline.integrityVerified === true, "Ação não mutante deve ter integridade verificada com sucesso");
  assert(infoPipeline.updatedState === baseState, "Ação não mutante deve preservar estado original");

  // Ação Mecânica Real
  const recruitPipeline = executeGameplayPipeline("Quero recrutar 10 soldados", baseState);
  assert(recruitPipeline.stateMutated === true, "Recrutamento válido deve ter stateMutated === true");
  assert(recruitPipeline.integrityVerified === true, "Integridade do pipeline deve ser verdadeira para mutação válida");
  assert(recruitPipeline.updatedState.weeklyLedger.silverdew < baseState.weeklyLedger.silverdew, "Recrutamento deve debitar silverdew");
  console.log("  ✅ Cenário 6 Aprovado: GameplayPipeline orquestra integridade defensiva e mutação material.");

  console.log("===================================================================");
  console.log("🎉 TODAS AS INVARIANTES DE MUTAÇÃO MATERIAL FORAM VALIDADAS COM SUCESSO!");
  console.log("===================================================================");
}

runMaterialMutationInvariantTests();
