import * as fs from 'fs';
import * as path from 'path';
import { ModelRegistry, RegisteredModelConfig } from '../../src/llm/registry/ModelRegistry';
import { ProviderDiscovery, DiscoveredCandidate } from '../../src/llm/registry/ProviderDiscovery';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

export function runProviderDiscoveryAndLifecycleTests() {
  console.log("=== EXECUTANDO SUÍTE DE TESTES: M28.2 PROVIDER DISCOVERY & DYNAMIC BILLING ELIGIBILITY ===");

  // --------------------------------------------------------------------------
  // 1. Separação Estrita entre Health (Conectividade) e Billing (Cobrança)
  // --------------------------------------------------------------------------
  console.log("1. Testando desacoplamento entre Health e Billing...");

  // HTTP 200 + FREE -> ELIGIBLE
  const candFree: DiscoveredCandidate = {
    id: 'cand-free-test',
    provider: 'openrouter',
    model: 'meta/llama-3-8b:free',
    discoveredAt: Date.now(),
    billing: { mode: 'FREE', eligible: true },
    health: { status: 'UNKNOWN' },
    lifecycle: 'DISCOVERED',
    enabled: true
  };
  const res200Free = ProviderDiscovery.processHealthEvent(candFree, { httpStatus: 200 });
  assert(res200Free.health.status === 'ONLINE', "HTTP 200 deve marcar status ONLINE");
  assert(res200Free.lifecycle === 'ELIGIBLE', "HTTP 200 + FREE deve resultar em ELIGIBLE");
  console.log("  ✅ HTTP 200 + FREE -> ELIGIBLE");

  // HTTP 200 + PAID -> PAID (Inelegível)
  const candPaid: DiscoveredCandidate = {
    id: 'cand-paid-test',
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    discoveredAt: Date.now(),
    billing: { mode: 'PAID', eligible: false },
    health: { status: 'UNKNOWN' },
    lifecycle: 'DISCOVERED',
    enabled: true
  };
  const res200Paid = ProviderDiscovery.processHealthEvent(candPaid, { httpStatus: 200 });
  assert(res200Paid.health.status === 'ONLINE', "HTTP 200 deve marcar status ONLINE");
  assert(res200Paid.lifecycle === 'PAID', "HTTP 200 + PAID DEVE resultar em PAID (inelegível)");
  console.log("  ✅ HTTP 200 + PAID -> PAID (Inelegível)");

  // HTTP 200 + UNKNOWN -> HEALTHY (Fail-closed, inelegível para free-tier)
  const candUnknown: DiscoveredCandidate = {
    id: 'cand-unknown-test',
    provider: 'openrouter',
    model: 'some/new-model',
    discoveredAt: Date.now(),
    billing: { mode: 'UNKNOWN', eligible: false },
    health: { status: 'UNKNOWN' },
    lifecycle: 'DISCOVERED',
    enabled: true
  };
  const res200Unknown = ProviderDiscovery.processHealthEvent(candUnknown, { httpStatus: 200 });
  assert(res200Unknown.health.status === 'ONLINE', "HTTP 200 deve marcar status ONLINE");
  assert(res200Unknown.lifecycle === 'HEALTHY', "HTTP 200 + UNKNOWN deve ser HEALTHY mas não ELIGIBLE");
  console.log("  ✅ HTTP 200 + UNKNOWN -> HEALTHY (Fail-closed)");

  // HTTP 404 + FREE -> UNAVAILABLE
  const res404Free = ProviderDiscovery.processHealthEvent(candFree, { httpStatus: 404 });
  assert(res404Free.health.status === 'OFFLINE', "HTTP 404 deve marcar status OFFLINE");
  assert(res404Free.lifecycle === 'UNAVAILABLE', "HTTP 404 deve resultar em UNAVAILABLE");
  console.log("  ✅ HTTP 404 + FREE -> UNAVAILABLE");

  // --------------------------------------------------------------------------
  // 2. Transições Dinâmicas de Billing (FREE <-> PAID)
  // --------------------------------------------------------------------------
  console.log("2. Testando transições de billing sem edição de JSON...");

  const registry = new ModelRegistry();

  // Registrar modelo gratuito
  const dynamicModel: DiscoveredCandidate = {
    id: 'dynamic-model-01',
    provider: 'openrouter',
    model: 'dynamic/free-model:free',
    discoveredAt: Date.now(),
    billing: { mode: 'FREE', eligible: true },
    health: { status: 'ONLINE' },
    lifecycle: 'ELIGIBLE',
    capabilities: {
      interpreterScore: 9.9,
      narratorScore: 9.9,
      mechanicalSilenceScore: 10,
      factualGroundingScore: 10,
      reliabilityScore: 9.9,
      avgLatencyMs: 500
    },
    enabled: true
  };
  registry.registerDiscoveredCandidate(dynamicModel);

  // Provedor configurado temporário para teste
  process.env.OPENROUTER_API_KEY = 'test-key-valid';

  // Deve selecionar o dynamic-model-01 pois tem score 9.9
  const selectedBefore = registry.resolveModelForTask('INTERPRET_INTENT');
  assert(selectedBefore.id === 'dynamic-model-01', "Router deve selecionar modelo dinâmico elegível");
  console.log("  ✅ Candidato dinâmico registrado e selecionado pelo Router.");

  // Provedor muda modelo para PAID
  registry.recordBillingUpdate('dynamic-model-01', 'PAID');
  const candAfterPaid = registry.getCandidate('dynamic-model-01');
  assert(candAfterPaid?.billing.mode === 'PAID', "Billing deve atualizar para PAID");
  assert(candAfterPaid?.lifecycle === 'PAID', "Lifecycle deve atualizar para PAID");

  // Router DEVE parar imediatamente de selecionar o modelo PAID
  const selectedAfterPaid = registry.resolveModelForTask('INTERPRET_INTENT');
  assert(selectedAfterPaid.id !== 'dynamic-model-01', "Router DEVE desqualificar modelo que virou PAID");
  console.log("  ✅ Transição FREE -> PAID desqualifica candidato imediatamente do Router.");

  // Provedor retorna modelo para FREE
  registry.recordBillingUpdate('dynamic-model-01', 'FREE');
  const candAfterRestored = registry.getCandidate('dynamic-model-01');
  assert(candAfterRestored?.billing.mode === 'FREE', "Billing deve retornar para FREE");
  assert(candAfterRestored?.lifecycle === 'ELIGIBLE', "Lifecycle deve retornar para ELIGIBLE");

  const selectedAfterRestored = registry.resolveModelForTask('INTERPRET_INTENT');
  assert(selectedAfterRestored.id === 'dynamic-model-01', "Router deve reabilitar modelo restaurado para FREE");
  console.log("  ✅ Transição PAID -> FREE reabilita candidato para seleção no Router.");

  // --------------------------------------------------------------------------
  // 3. Eventos de Saúde (429 RateLimit, Timeout, 5xx, Auth Failure)
  // --------------------------------------------------------------------------
  console.log("3. Testando eventos de saúde e resiliência em tempo de execução...");

  // HTTP 429 com cooldown curto de 50ms para teste
  registry.recordHealthEvent('dynamic-model-01', { httpStatus: 429, cooldownMs: 50 });
  const cand429 = registry.getCandidate('dynamic-model-01');
  assert(cand429?.lifecycle === 'RATE_LIMITED', "HTTP 429 deve marcar RATE_LIMITED");
  assert(registry.getModelStatus('dynamic-model-01') === 'RATE_LIMITED', "getModelStatus deve refletir RATE_LIMITED");

  // Router deve fazer failover imediato para o próximo modelo elegível
  const fallbackDuring429 = registry.resolveModelForTask('INTERPRET_INTENT');
  assert(fallbackDuring429.id !== 'dynamic-model-01', "Router deve fazer failover durante RATE_LIMITED");
  console.log("  ✅ Failover transparente durante 429 RateLimit verificado.");

  // Aguardar cooldown de 60ms para verificar recuperação automática
  const waitMs = (ms: number) => new Promise(res => setTimeout(res, ms));
  // Simular passagem de tempo expirando o cooldown
  if (cand429?.health) {
    cand429.health.rateLimitedUntil = Date.now() - 10;
  }
  const candRecovered = registry.getCandidate('dynamic-model-01');
  assert(candRecovered?.lifecycle === 'ELIGIBLE', "Após cooldown, candidato deve recuperar status ELIGIBLE");
  console.log("  ✅ Recuperação automática após expiração de cooldown verificada.");

  // Timeout -> DEGRADED
  registry.recordHealthEvent('dynamic-model-01', { isTimeout: true, errorMessage: 'Gateway timeout' });
  const candTimeout = registry.getCandidate('dynamic-model-01');
  assert(candTimeout?.lifecycle === 'DEGRADED', "Timeout deve marcar DEGRADED");
  console.log("  ✅ Timeout -> DEGRADED.");

  // 500 Server Error -> UNAVAILABLE
  registry.recordHealthEvent('dynamic-model-01', { httpStatus: 500 });
  const cand500 = registry.getCandidate('dynamic-model-01');
  assert(cand500?.lifecycle === 'UNAVAILABLE', "HTTP 500 deve marcar UNAVAILABLE");
  console.log("  ✅ HTTP 500 -> UNAVAILABLE.");

  // Auth Failure -> UNAVAILABLE
  registry.recordHealthEvent('dynamic-model-01', { isAuthFailure: true, errorMessage: 'Invalid API Key' });
  const candAuth = registry.getCandidate('dynamic-model-01');
  assert(candAuth?.lifecycle === 'UNAVAILABLE', "Auth failure deve marcar UNAVAILABLE");
  console.log("  ✅ Auth Failure -> UNAVAILABLE.");

  // --------------------------------------------------------------------------
  // 4. Verificação de Isolamento Absoluto da Engine
  // --------------------------------------------------------------------------
  console.log("4. Verificando isolamento arquitetural da Engine...");
  const enginePath = path.resolve(process.cwd(), 'src/engine.ts');
  const ruleResolverPath = path.resolve(process.cwd(), 'src/lib/ruleResolver.ts');
  const engineCode = fs.readFileSync(enginePath, 'utf8');
  const resolverCode = fs.readFileSync(ruleResolverPath, 'utf8');

  assert(!engineCode.includes('ProviderDiscovery'), "engine.ts não deve referenciar ProviderDiscovery");
  assert(!engineCode.includes('ModelRegistry'), "engine.ts não deve referenciar ModelRegistry");
  assert(!engineCode.includes('openrouter'), "engine.ts não deve conter nomes de provedores");
  assert(!resolverCode.includes('ProviderDiscovery'), "ruleResolver.ts não deve referenciar ProviderDiscovery");
  assert(!resolverCode.includes('ModelRegistry'), "ruleResolver.ts não deve referenciar ModelRegistry");
  console.log("  ✅ Isolamento da Engine confirmado: 0 contaminações de provedores ou descoberta.");

  console.log("=== TODOS OS TESTES DE PROVIDER DISCOVERY & BILLING M28.2 PASSARAM COM SUCESSO ===");
}

if (process.argv[1]?.endsWith('ProviderDiscoveryAndLifecycle.test.ts')) {
  runProviderDiscoveryAndLifecycleTests();
}
