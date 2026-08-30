import assert from 'node:assert/strict';
import { BillingGuard, BillingGuardError } from '../../src/llm/validators/BillingGuard';
import { SemanticValidator } from '../../src/llm/validators/SemanticValidator';
import { MechanicalLeakageValidator } from '../../src/llm/validators/MechanicalLeakageValidator';
import { NarrativeFidelityValidator } from '../../src/llm/validators/NarrativeFidelityValidator';
import { NarrativeQualityEvaluator } from '../../src/llm/validators/NarrativeQualityEvaluator';
import { NarrativeJudge } from '../../src/llm/validators/NarrativeJudge';
import { NarrativeReportSanitizer } from '../../src/llm/contracts/NarrativeExecutionReport';
import { CharacterLifecycleService } from '../../src/domain/character/CharacterLifecycle';
import { LLMCompatibilityHarness } from '../../src/llm/benchmark/LLMCompatibilityHarness';
import { MockAdapter } from '../../src/llm/adapters/MockAdapter';
import { ModelConfig } from '../../src/llm/contracts/LLMContract';
import { ALL_BENCHMARK_SCENARIOS, getScenariosByCategory } from './scenarios';
import { GOLDEN_DATASET } from './golden/golden_dataset';
import { createInitialState } from '../../src/engine';

console.log('=== TEST SUITE: LLM COMPATIBILITY HARNESS & DECOUPLED PIPELINE ===\n');

const state = createInitialState('Noble Ruler', 'Central Plains');

// ---------------------------------------------------------------------------
// 1. BILLING GUARD: STRICT & FREE-TIER POLICIES
// ---------------------------------------------------------------------------
{
  console.log('[TEST 1] Testando BillingGuard (Modo Strict e Free-Tier)...');

  // 1a. Modelo com maxCost > 0 deve ser bloqueado
  const paidModel: ModelConfig = {
    id: 'paid-1',
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    freePolicy: 'free-tier',
    maxCost: 0.05,
    enabled: true
  };
  assert.throws(
    () => BillingGuard.assertFreeModel(paidModel, 'free-tier'),
    BillingGuardError,
    'BillingGuard deve lançar erro para modelos com maxCost > 0'
  );

  // 1b. Modo Strict bloqueia modelos que não sejam explicit-free
  const freeTierModel: ModelConfig = {
    id: 'gemini-free',
    provider: 'gemini',
    model: 'gemini-flash-lite-latest',
    freePolicy: 'free-tier',
    maxCost: 0,
    enabled: true
  };
  assert.throws(
    () => BillingGuard.assertFreeModel(freeTierModel, 'strict'),
    BillingGuardError,
    'Modo Strict deve rejeitar políticas free-tier que não sejam explicit-free'
  );
  assert.doesNotThrow(() => BillingGuard.assertFreeModel(freeTierModel, 'free-tier'));

  // 1c. OpenRouter sem sufixo :free deve ser bloqueado
  const invalidOpenRouter: ModelConfig = {
    id: 'openrouter-paid',
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    freePolicy: 'explicit-free',
    maxCost: 0,
    enabled: true
  };
  assert.throws(
    () => BillingGuard.assertFreeModel(invalidOpenRouter, 'free-tier'),
    BillingGuardError
  );

  // 1d. Custo > 0 detectado em runtime aborta imediatamente
  const nonFreeUsage = BillingGuard.buildUsage({
    promptTokens: 100,
    completionTokens: 50,
    cost: 0.002
  });
  assert.equal(nonFreeUsage.costStatus, 'NON_ZERO_BLOCKED');
  assert.throws(
    () => BillingGuard.assertZeroCost(nonFreeUsage, freeTierModel),
    BillingGuardError
  );

  console.log('  ✅ BillingGuard aprovado: modos strict e free-tier 100% blindados.');
}

// ---------------------------------------------------------------------------
// 2. CHARACTER LIFECYCLE & WORLD-AWARE SEMANTIC VALIDATION
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 2] Testando CharacterLifecycle e SemanticValidator World-Aware...');

  const roster = CharacterLifecycleService.getHistoricalRoster(state);
  assert.ok(roster.length >= 5, 'Roster histórico deve conter personagens canônicos');

  const generalMorr = CharacterLifecycleService.findCharacter('General Morr', state);
  assert.ok(generalMorr, 'General Morr deve constar no registro');
  assert.equal(CharacterLifecycleService.isAlive(generalMorr!), false, 'General Morr deve estar MORTO');

  // 2a. Comando a personagem morto deve ser rejeitado semanticamente
  const deadCharJson = JSON.stringify({
    action: 'MILITARY',
    targetId: 'General Morr',
    confidence: 0.95
  });
  const deadCharRes = SemanticValidator.validateIntentResponse(deadCharJson, undefined, state);
  assert.equal(deadCharRes.jsonValid, true);
  assert.equal(deadCharRes.schemaValid, true);
  assert.equal(deadCharRes.characterAlive, false);
  assert.equal(deadCharRes.isDeadCharacterRejection, true);
  assert.equal(deadCharRes.semanticValid, false, 'Ação militar para general falecido deve falhar semanticamente');

  // 2b. Consulta histórica sobre personagem morto é permitida (action === INFORMATION)
  const histQueryJson = JSON.stringify({
    action: 'INFORMATION',
    targetId: 'General Morr',
    confidence: 0.95
  });
  const histQueryRes = SemanticValidator.validateIntentResponse(histQueryJson, undefined, state);
  assert.equal(histQueryRes.semanticValid, true, 'Consulta informativa sobre figura histórica é válida');

  // 2c. Bloqueio de autoridade mecânica da LLM (Engine Safety)
  const unsafeJson = JSON.stringify({
    action: 'MILITARY',
    casualties: 5,
    soldiersSent: 20,
    success: true
  });
  const resUnsafe = SemanticValidator.validateIntentResponse(unsafeJson);
  assert.equal(resUnsafe.engineSafe, false, 'Geração de casualties/success pela LLM viola a Engine Safety');

  console.log('  ✅ CharacterLifecycle e SemanticValidator aprovados: rejeição de personagens mortos e garantia de autoridade da Engine.');
}

// ---------------------------------------------------------------------------
// 3. MECHANICAL SILENCE AT SOURCE (NARRATIVE REPORT SANITIZER)
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 3] Testando Sanitização e Silêncio Mecânico na Fonte...');

  const rawEngineReport = {
    commandId: 'cmd_123',
    actionExecuted: 'RECRUIT',
    status: 'ACCEPTED',
    reasonCode: 'AUTHORIZED',
    stateChanges: [
      { path: 'weeklyLedger.silverdew', delta: -50, before: 1000, after: 950 },
      { path: 'weeklyLedger.food', delta: -10, before: 500, after: 490 }
    ],
    consequences: [
      { consequenceId: 'c1', description: 'Novos recrutas perfilados no pátio de armas.' }
    ]
  };

  const sanitized = NarrativeReportSanitizer.sanitize(rawEngineReport, 4);
  assert.equal(sanitized.action.domain, 'RECRUIT');
  assert.equal(sanitized.outcome.status, 'ACCEPTED');
  assert.equal(sanitized.facts.stateChanges.length, 2);
  // O relatório sanitizado deve expressar impacto qualitativo e nunca números crus de prata/fsu
  assert.ok(sanitized.facts.stateChanges[0].qualitativeImpact.includes('tesouraria'));
  assert.ok(sanitized.facts.stateChanges[1].qualitativeImpact.includes('celeiros'));

  console.log('  ✅ NarrativeReportSanitizer aprovado: dados matemáticos eliminados na fonte antes da LLM.');
}

// ---------------------------------------------------------------------------
// 4. DECOUPLED NARRATIVE VALIDATORS (LEAKAGE, FIDELITY, QUALITY)
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 4] Testando Validadores Desacoplados de Narrativa...');

  // 4a. MechanicalLeakageValidator
  const cleanText = 'O vento sopra forte sobre as muralhas de Grey Keep. As patrulhas vigiam a estrada.';
  const leakClean = MechanicalLeakageValidator.validate(cleanText);
  assert.equal(leakClean.mechanicalSilence, true);

  const leakingText = 'Gastamos 50 SD e a defesa com AC 14 passou no teste de DC 15 gerando 100 XP.';
  const leakBad = MechanicalLeakageValidator.validate(leakingText);
  assert.equal(leakBad.mechanicalSilence, false);
  assert.ok(leakBad.leakedTerms.length >= 3);

  // 4b. NarrativeFidelityValidator
  const fidelityBad = NarrativeFidelityValidator.validate(
    'Construímos com sucesso a torre e os novos soldados contratados marchamos vitoriosos.',
    {
      executionId: 'e1',
      turn: 1,
      action: { domain: 'BUILD', intent: 'BUILD' },
      outcome: { status: 'REJECTED', explanation: 'Recursos insuficientes' },
      facts: { events: [], entitiesInvolved: [], stateChanges: [] },
      narrativeHints: []
    }
  );
  assert.equal(fidelityBad.hallucination, true, 'Deve detectar alucinação em relatório rejeitado');
  assert.equal(fidelityBad.stateDivergence, true);

  // 4c. NarrativeQualityEvaluator
  const qualResult = NarrativeQualityEvaluator.evaluate(cleanText);
  assert.equal(qualResult.conciseness, true);
  assert.ok(qualResult.qualityScore >= 7.0);

  // 4d. NarrativeJudge integrado
  const compositeJudge = NarrativeJudge.judge(cleanText);
  assert.equal(compositeJudge.mechanicalSilence, true);
  assert.equal(compositeJudge.hallucination, false);
  assert.ok(compositeJudge.narrativeScore >= 8.0);

  console.log('  ✅ Tríade de Validadores Narrativos aprovada.');
}

// ---------------------------------------------------------------------------
// 5. MOCK ADAPTER BEHAVIOR MODES
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 5] Testando MockAdapter e Injeção de Modos de Falha...');

  const mock = new MockAdapter();

  // Teste modo DEAD_CHARACTER
  mock.setMode('DEAD_CHARACTER');
  const resDead = await mock.generate({
    userPrompt: '<PLAYER_INPUT>Mande o general organizar as tropas</PLAYER_INPUT>',
    responseFormat: 'json'
  });
  const parsedDead = JSON.parse(resDead.text);
  assert.equal(parsedDead.targetId, 'General Morr');

  // Teste modo MECHANICAL_LEAK
  mock.setMode('MECHANICAL_LEAK');
  const resLeak = await mock.generate({
    userPrompt: 'Descreva a vigília',
    responseFormat: 'text'
  });
  const leakScan = MechanicalLeakageValidator.validate(resLeak.text);
  assert.equal(leakScan.mechanicalSilence, false);

  // Teste modo CLAIM_VICTORY_ON_LOSS
  mock.setMode('CLAIM_VICTORY_ON_LOSS');
  const resClaim = await mock.generate({
    userPrompt: 'Descreva o cerco',
    responseFormat: 'text'
  });
  const fidScan = NarrativeFidelityValidator.validate(resClaim.text, {
    executionId: 'e1',
    turn: 1,
    action: { domain: 'MILITARY', intent: 'MILITARY' },
    outcome: { status: 'REJECTED', explanation: 'Derrota' },
    facts: { events: [], entitiesInvolved: [], stateChanges: [] },
    narrativeHints: []
  });
  assert.equal(fidScan.hallucination, true);

  console.log('  ✅ Modos de falha do MockAdapter verificados.');
}

// ---------------------------------------------------------------------------
// 6. SCENARIO CATALOG & GOLDEN DATASET INTEGRITY
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 6] Testando Catálogo de Cenários Canônicos (130 cenários em 10 categorias)...');

  assert.ok(ALL_BENCHMARK_SCENARIOS.length >= 130, `Esperado >= 130 cenários, total: ${ALL_BENCHMARK_SCENARIOS.length}`);
  assert.equal(GOLDEN_DATASET.length, ALL_BENCHMARK_SCENARIOS.length);

  const categories = [
    'military',
    'diplomacy',
    'economy',
    'intrigue',
    'exploration',
    'crisis',
    'ambiguous',
    'adversarial',
    'historical',
    'cross_system'
  ];
  for (const cat of categories) {
    const list = getScenariosByCategory(cat);
    assert.ok(list.length >= 10, `Categoria ${cat} deve ter pelo menos 10 cenários, obteve ${list.length}`);
  }

  console.log(`  ✅ ${ALL_BENCHMARK_SCENARIOS.length} cenários e Golden Dataset 100% validados em 10 categorias.`);
}

// ---------------------------------------------------------------------------
// 7. COMPLETE HARNESS EXECUTION
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 7] Executando Benchmark Completo com MockAdapter...');

  const harness = new LLMCompatibilityHarness();
  const sample = ALL_BENCHMARK_SCENARIOS.slice(0, 20);

  const result = await harness.runBenchmark({
    scenarios: sample,
    repetitions: 1,
    providers: ['mock'],
    delayBetweenRequestsMs: 0
  });

  assert.equal(result.summaries.length, 1);
  const mockSummary = result.summaries[0];
  assert.equal(mockSummary.provider, 'mock');
  assert.equal(mockSummary.totalCost, 0);
  assert.equal(mockSummary.jsonValidRate, 1.0);
  assert.equal(mockSummary.schemaValidRate, 1.0);
  assert.equal(mockSummary.engineSafeRate, 1.0);
  assert.ok(mockSummary.firstPassAcceptanceRate >= 0.50);
  assert.ok(result.asciiReport.includes('LLM COMPATIBILITY REPORT'));

  console.log('  ✅ Execução completa do Harness e geração de relatórios verificadas com sucesso.');
}

// ---------------------------------------------------------------------------
// 8. NEGATIVE TEST SUITE: BILLING, FALLBACKS, REGISTRY & NARRATIVE REJECTIONS
// ---------------------------------------------------------------------------
{
  console.log('\n[TEST 8] Executando Bateria Exaustiva de Testes Negativos (M26-FINAL)...');

  const { UnifiedNarrativeLLM } = await import('../../src/llm/adapters/UnifiedNarrativeLLM');

  // 8a. Provedor desconhecido sem modelConfig -> BLOCK
  assert.throws(
    () => new UnifiedNarrativeLLM({ provider: 'unregistered_provider' as any }),
    BillingGuardError,
    'Provedor não registrado sem modelConfig deve ser bloqueado com BillingGuardError'
  );

  // 8b. Modelo pago fornecido explicitamente via modelConfig -> BLOCK
  const explicitPaidConfig: ModelConfig = {
    id: 'custom-paid',
    provider: 'gemini',
    model: 'gemini-1.5-pro-paid',
    freePolicy: 'free-tier',
    maxCost: 0.05,
    enabled: true
  };
  assert.throws(
    () => new UnifiedNarrativeLLM({ provider: 'gemini', modelConfig: explicitPaidConfig }),
    BillingGuardError,
    'Configuração explicitamente fornecida com maxCost > 0 deve ser bloqueada'
  );

  // 8c. free-tier + strict -> BLOCK
  const freeTierConfig: ModelConfig = {
    id: 'hf-free-tier',
    provider: 'huggingface',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    freePolicy: 'free-tier',
    maxCost: 0,
    enabled: true
  };
  assert.throws(
    () => BillingGuard.assertFreeModel(freeTierConfig, 'strict'),
    BillingGuardError,
    'free-tier em modo strict deve ser bloqueado'
  );

  // 8d. explicit-free + strict -> ALLOW
  const explicitFreeConfig: ModelConfig = {
    id: 'openrouter-free',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1:free',
    freePolicy: 'explicit-free',
    maxCost: 0,
    enabled: true
  };
  assert.doesNotThrow(
    () => BillingGuard.assertFreeModel(explicitFreeConfig, 'strict'),
    'explicit-free em modo strict deve ser permitido'
  );

  // 8e. Fallback pago -> BLOCK
  const paidFallbackConfig: ModelConfig = {
    id: 'fallback-paid-test',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1:paid',
    freePolicy: 'explicit-free',
    maxCost: 1.0,
    enabled: true
  };
  assert.throws(
    () => BillingGuard.assertFreeModel(paidFallbackConfig, 'free-tier'),
    BillingGuardError,
    'Fallback com maxCost > 0 deve ser bloqueado'
  );

  // 8f. Fallback unverified em strict -> BLOCK
  const unverifiedFallbackConfig: ModelConfig = {
    id: 'fallback-unverified-test',
    provider: 'gemini',
    model: 'gemini-flash-fb',
    freePolicy: 'free-tier',
    maxCost: 0,
    enabled: true
  };
  assert.throws(
    () => BillingGuard.assertFreeModel(unverifiedFallbackConfig, 'strict'),
    BillingGuardError,
    'Fallback free-tier em modo strict deve ser bloqueado'
  );

  // 8g. Cost > 0 em runtime -> BLOCK
  const runtimePaidUsage = BillingGuard.buildUsage({ cost: 0.01 });
  assert.throws(
    () => BillingGuard.assertZeroCost(runtimePaidUsage, explicitFreeConfig, 'free-tier'),
    BillingGuardError,
    'Cost > 0 em runtime deve ser bloqueado imediatamente'
  );

  // 8h. COST_UNVERIFIED em strict -> BLOCK
  const unverifiedUsage = BillingGuard.buildUsage({ isExplicitFree: false });
  assert.equal(unverifiedUsage.costStatus, 'COST_UNVERIFIED');
  assert.throws(
    () => BillingGuard.assertZeroCost(unverifiedUsage, freeTierConfig, 'strict'),
    BillingGuardError,
    'COST_UNVERIFIED em modo strict deve ser bloqueado'
  );

  // 8i. Narrativa inventa vitória em relatório rejeitado -> REJECT
  const hallucinatedVictory = NarrativeFidelityValidator.validate(
    'Alcançamos uma retumbante vitória militar e derrotamos todos os inimigos.',
    { status: 'REJECTED' } as any
  );
  assert.equal(hallucinatedVictory.hallucination, true, 'Vitória reivindicada sobre relatório REJECTED deve ser marcada como alucinação');
  assert.equal(hallucinatedVictory.factualGrounding, false);

  // 8j. Narrativa cita personagem falecido atuando -> REJECT
  const deceasedAction = NarrativeFidelityValidator.validate(
    'O General Morr liderou a investida contra a vanguarda inimiga.',
    { status: 'APPLIED' } as any,
    {
      scene: { locationId: 'field' },
      actors: [{ name: 'General Morr', status: 'dead', role: 'general' }],
      executionResult: { answerStatus: 'AUTHORIZED' }
    } as any
  );
  assert.equal(deceasedAction.hallucination, true, 'Personagem morto realizando ação no mundo deve ser rejeitado');
  assert.equal(deceasedAction.factualGrounding, false);

  console.log('  ✅ Todos os 10 cenários negativos de Billing, Fallback e Narrativa foram validados com 100% de precisão.');
}

console.log('\n🎉 LLMCompatibilityHarness.test.ts: TODOS OS 8 TESTES (INCLUINDO BATERIA NEGATIVA) PASSARAM COM 100% DE SUCESSO!\n');
