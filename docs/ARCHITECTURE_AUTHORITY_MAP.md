# ARCHITECTURE_AUTHORITY_MAP
**Age of Shattered Oaths — Canonical Authority Map**
Version: 2026-09-02 | Status: Post-P1-Consolidation

This document is the architectural constitution of the project.
Every agent, every PR, every new feature MUST consult this map before creating or modifying modules.

---

## RULE: Stop Before Creating

Before creating any new service, store, pipeline, resolver, adapter, validator, or context builder:

1. Search this map for existing canonical authority.
2. If found: reuse or extend it.
3. If two implementations exist: STOP and report duplication. Do NOT create a third.
4. If absent from this map: add an entry BEFORE writing code.

---

## ENGINE LAYER

### State Resolution
| Responsibility | Canonical Module | File |
|---------------|-----------------|------|
| Weekly turn resolution | `resolveWeeklyTurn` | `engine.ts` |
| Narrative command resolution (public boundary) | `resolveNarrativeCommand` | `engine.ts` |
| Narrative command resolution (implementation) | `resolveNarrativeCommand` (core) | `lib/narrativeExecution.ts` |
| Observer projection | `buildObserverProjection` | `engine.ts` → `lib/narrativeProjection.ts` |
| Narrative context builder | `buildNarrativeContext` | `engine.ts` → `lib/narrativeContracts.ts` |

**FORBIDDEN IMPORTS:**
```ts
// VIOLATION — bypasses engine public boundary:
import { resolveNarrativeCommand } from '../lib/narrativeExecution';

// CORRECT:
import { resolveNarrativeCommand } from '../engine';
```

---

## EVENTS

| Responsibility | Canonical Module | File | Notes |
|---------------|-----------------|------|-------|
| Engine mechanical events (audit trail) | `globalEventStore` / `EngineEvent` | `core/EventStore.ts` | Singleton. Types: WEEKLY_TURN_RESOLVED, COMMAND_RESOLVED |
| Campaign historical events (memory) | `memory/EventStore` / `CampaignEvent` | `memory/EventStore.ts` | Composed, not singleton. Rich schema with actorIds, outcome, stateChanges |

**TYPE AUTHORITY:**
- `EngineEvent` → `core/EventStore.ts` (mechanical audit trail, flat schema)
- `CampaignEvent` → `memory/contracts.ts` (historical campaign record, rich schema)

These are intentionally distinct types. Never import one as the other.

---

## MEMORY SYSTEM

| Responsibility | Canonical Module | File |
|---------------|-----------------|------|
| Persistent narrative memory | `MemoryStore` | `memory/MemoryStore.ts` |
| Agent knowledge base | `KnowledgeStore` | `memory/KnowledgeStore.ts` |
| Relationship tracking | `RelationshipStore` | `memory/RelationshipStore.ts` |
| World fact derivation | `WorldFactDeriver` | `memory/WorldFactDeriver.ts` |
| Knowledge propagation | `propagateKnowledge` | `memory/propagation/propagateKnowledge.ts` |
| Memory contracts | `MemoryRecord, KnowledgeRecord, CampaignEvent` | `memory/contracts.ts` |

---

## RETRIEVAL SYSTEM

| Responsibility | Canonical Module | File |
|---------------|-----------------|------|
| Memory context retrieval | `ContextRetrievalService` | `memory/retrieval/ContextRetrievalService.ts` |
| Codex static rule retrieval | `searchCodex` | `lib/codexRetriever.ts` |

---

## NARRATIVE PIPELINE

| Responsibility | Canonical Module | File |
|---------------|-----------------|------|
| Narrative cycle orchestration | `runNarrativeCycle` | `lib/narrativeCycle.ts` |
| Narrative contracts (types) | `NarrativeContext, ExecutionReport, NarrativeCommand` | `lib/narrativeContracts.ts` |
| Observer projection (impl) | `createObserverProjection` | `lib/narrativeProjection.ts` |
| Narrative grounding validation | `validateNarrativeConsistency` | `lib/semanticValidation.ts` |
| Magnitude resolution | `resolveMagnitude` | `lib/magnitudeResolution.ts` |
| Intent classification | `classifyAction` | `lib/actionClassifier.ts` |
| Heuristic intent parsing | `parseIntent` | `lib/intentHeuristics.ts` |

---

## LLM SUBSYSTEM

### Adapter Layer (Canonical)
| Responsibility | Canonical Module | File | Status |
|---------------|-----------------|------|--------|
| Unified narrative LLM | `UnifiedNarrativeLLM` | `llm/adapters/UnifiedNarrativeLLM.ts` | ACTIVE — canonical adapter |
| LLM provider contract | `LLMAdapter` | `llm/adapters/LLMAdapter.ts` | ACTIVE |
| Gemini provider | `GeminiAdapter` | `llm/adapters/GeminiAdapter.ts` | ACTIVE |
| Groq provider | `GroqAdapter` | `llm/adapters/GroqAdapter.ts` | ACTIVE |
| HuggingFace provider | `HuggingFaceAdapter` | `llm/adapters/HuggingFaceAdapter.ts` | ACTIVE |
| OpenRouter provider | `OpenRouterAdapter` | `llm/adapters/OpenRouterAdapter.ts` | ACTIVE |
| OpenCode provider | `OpenCodeAdapter` | `llm/adapters/OpenCodeAdapter.ts` | ACTIVE |
| Mock provider | `MockAdapter` | `llm/adapters/MockAdapter.ts` | ACTIVE |

### Legacy Providers (Pending Migration Decision — P2)
| Module | File | Status |
|--------|------|--------|
| `GeminiNarrativeLLM` | ~~`lib/geminiNarrativeLLM.ts`~~ | DELETED — Fase 4 P2-B (2026-09-02) |
| `HuggingFaceNarrativeLLM` | ~~`lib/huggingFaceNarrativeLLM.ts`~~ | DELETED — Fase 1 P2-B (2026-09-02) |
| `OpenRouterNarrativeLLM` | ~~`lib/openRouterNarrativeLLM.ts`~~ | DELETED — Fase 1 P2-B (2026-09-02) |
| `OpenCodeNarrativeLLM` | ~~`lib/openCodeNarrativeLLM.ts`~~ | DELETED — Fase 1 P2-B (2026-09-02) |
| `CascadingNarrativeLLM` | `lib/cascadingNarrativeLLM.ts` | MANTER — roteador adaptativo com papel único (P2-A) |
| `MockNarrativeLLM` | `lib/mockNarrativeLLM.ts` | MANTER — 20+ testes dependentes; `narrateReport()` gera narrativa procedural contextual (único); `narrateIncident()` único; fallback final do CascadingNarrativeLLM. `interpret()` redundante com MockAdapter (mesma heurística). |

> **P2-A RESOLVIDA (2026-09-02):** `CascadingNarrativeLLM` tem papel único confirmado — é roteador adaptativo que usa `UnifiedNarrativeLLM` internamente. Não é duplicação.
> **P2-B Fase 1 CONCLUÍDA (2026-09-02):** `huggingFaceNarrativeLLM.ts`, `openRouterNarrativeLLM.ts`, `openCodeNarrativeLLM.ts` deletados após confirmação de zero consumidores. Build e regressão passando.
> **P2-B Fase 2 CONCLUÍDA (2026-09-02):** `LiveEvalRunner.ts`, `LiveGameplayAuditor.ts`, `CampaignStressRunner.ts` migrados de `GeminiNarrativeLLM` para `UnifiedNarrativeLLM({ provider: 'gemini' })`. Consumidores código fonte: ZERO. npm test: PASS. Gate intermediário registrado — deleção do arquivo depende de Fase 3 (migração de 8 arquivos de teste) e Fase 4 (remoção do import morto em server.ts + deleção do arquivo).
> **P2-B Fase 3 CONCLUÍDA (2026-09-02):** 8 arquivos de teste migrados: GeminiNarrativeLLM.test.ts (deletado — coberto por LLMCompatibilityHarness), NarrativeLLMProtocol.test.ts (TEST 4/5 removidos — testam implementação específica), OnlineOfflineParity.test.ts, RealOnlineAdversarialMemory.test.ts, RealOnlineLivingWorldEvolution.test.ts, SemanticInputContract.test.ts (TEST 13 migrado), RuntimePlayabilityIntegration.test.ts (RUNTIME 2 reestruturado), EmergentIncidentsNarrative.test.ts. Busca global: ZERO imports/instantiations em código fonte ativo. npm test: PASS. Único vestígio: import morto em server.ts (Fase 4).
> **MICRO-GATE FASE 3 CONCLUÍDO (2026-09-02):** Cobertura auditada — 8 tests deleted/removed, behavior coverage mapping verified against LLMCompatibilityHarness (8 tests) and GeminiAdapter. Coverage gaps identified for adapter-level concerns (fetchFn injection, HTTP error, timeout, missing key) — registered as backlog task LLM-GEMINI-ADAPTER-TESTS. npm test PASS (exit 0, 0 failures). Fase 4 authorized.
> **P2-B Fase 4 CONCLUÍDA (2026-09-02):** Import morto removido de server.ts (linhas 10-13: GeminiNarrativeLLM, OpenCodeNarrativeLLM, OpenRouterNarrativeLLM, HuggingFaceNarrativeLLM). Arquivo `src/lib/geminiNarrativeLLM.ts` DELETADO. M21 inventory atualizado. Busca global pós-deleção: ZERO consumidores em src/ e tests/. npm test: PASS. typecheck: erros apenas pré-existentes (GroqAdapter, ClarificationManager, vitest, scratch). P2-B CONCLUÍDA.
> **P2-C AUDITORIA CONCLUÍDA (2026-09-02):** MockNarrativeLLM auditado. Consumidores: 3 src/ + 20 testes (~70 instâncias). Comparação com MockAdapter: `interpret()` redundante (mesma heurística), mas `narrate()` é único (narrativa procedural contextual por ação, lê executionResult/stateChanges) e `narrateIncident()` é único. CascadingNarrativeLLM depende como fallback final. Decisão: MANTER AMBOS deliberadamente. MockAdapter para pipeline UnifiedNarrativeLLM; MockNarrativeLLM para narrativa procedural e fallback Cascading. Não migrar, não deletar.
> **LLM-GEMINI-ADAPTER-TESTS CONCLUÍDA (2026-09-02):** 11 testes em `tests/llm/GeminiAdapterCoverage.test.ts` cobrindo: response parsing (TEST 1-3), HTTP errors 503/429 (TEST 4-5), fallback para modelo alternativo (TEST 6), empty response (TEST 7), missing API key (TEST 8), timeout/AbortController (TEST 9), JSON mode (TEST 10), temperature/maxTokens (TEST 11). Todos os 4 gaps originais cobertos. npm test: PASS. typecheck: 0 erros novos (38 pré-existentes).
> **GroqAdapter TYPING CORRIGIDA (2026-09-02):** `'groq'` adicionado ao `LLMProviderId` em `LLMContract.ts`. Typecheck: 34 erros pré-existentes (↓4 corrigidos). npm test: PASS.
> **ETAPA 2 EM ANDAMENTO (2026-09-02):** `StartingScenarioService` implementado em `src/domain/startingScenario/`. Status: `TECHNICALLY_DONE (FIX-6B)`. FIX-1 concluído (tipagem estrita e fail-fast). FIX-5A concluído (semântica determinística de fala). FIX-5B concluído (Tom Iron Chronicle sensorial + clareza situacional). FIX-6A concluído (`ActivePlay.tsx` integrado com StartingScenarioService; prólogo legado removido; playtest validado no navegador). FIX-6B concluído (`UnifiedNarrativeLLM.interpret` com enum estrito de ações e sanitização; `narrate` aterrado em recusa factual; `toNarrativeProjection` injeta `reasonCode` em `REJECTED`; `genericResolution` diferencia envio de missiva/sondagem de comitiva presencial em DIPLOMACY e remove desculpa fictícia de soldados cansados em MILITARY; novo teste `SemanticBoundaryAudit.test.ts` passando). npm test: PASS. typecheck: 0 erros novos. Próximo gate: human playtest do FIX-6B.
> **LLM-001 CONCLUÍDO (2026-09-02):** Consumo de contexto estruturado pela LLM implementado. `runNarrativeCycle` aciona `ContextRetrievalService` sobre `state.memoryStores` determinístico e injeta `retrievedContext` no `UnifiedNarrativeLLM.interpret` (para desambiguação de entidades/alvos) e `retrievedMemories` / `retrievedKnowledge` / relacionamentos no `UnifiedNarrativeLLM.narrate` (preservando Silêncio Mecânico absoluto e fidelidade autoritativa). Testes em `tests/llm/LLM001_ContextConsumption.test.ts` (4 testes) e bateria de regressão passando.
> **INT-001 CONCLUÍDO (2026-09-03):** Resolução de Intenção e Clarificação fechado e validado. Mapeamento determinístico de comandos textuais para `NarrativeAction`; consultas informativas (`INFORMATION`) estritamente separadas de ações mecânicas com zero efeito colateral material; ciclo fechado de clarificação (`MAX_CLARIFICATION_ROUNDS = 2`) com persistência em `CampaignState.sessionLog.pendingClarification`; recomposição contextual no Round 1; Drift Guard impedindo divergência para ações arbitrárias durante clarificação; e esgotamento fail-safe no Round 2 resolvendo como `UNKNOWN` com recusa limpa e zero mutação material. Suíte `tests/intent/INT001_IntentResolution.test.ts` (6/6 testes) e `tests/ClarificationManager.test.ts` (17/17 testes) integradas ao `npm test` 100% verde.
> **NAR-001 CONCLUÍDO (2026-09-03):** Consistência Narrativa, Projeção Sensorial e Callbacks Diegéticos fechado e validado (8 SP - High Effort). Aplicação rígida do Axioma Epistêmico de Ouro; separação determinística em 6 categorias epistêmicas (fato observado, informação recuperada, inferência permitida, rumor, desconhecimento, flavor); silêncio mecânico absoluto verificado por `MechanicalLeakageValidator`; proteção contra alucinação de vitória em `REJECTED`, contenção temporal em despachos diplomáticos (proibição de antecipar banquete/tratado), bloqueio de desculpas fictícias divergentes do motivo da recusa, e prevenção de memórias sintéticas em `NarrativeFidelityValidator`; invariante de imutabilidade estrita da camada narrativa comprovada (zero mutação em `CampaignState`). Suíte `tests/narrative/NAR001_NarrativeFidelity.test.ts` (7/7 testes) integrada ao `npm test` 100% verde.
> **NAR-002 CONCLUÍDO (2026-09-03):** Disciplina Narrativa, Filtragem de Saliência e Concisão fechado e validado (8 SP - High Effort). Salience Gate (`src/lib/salienceFilter.ts`) separando contexto disponível de contexto narrativamente relevante, podando nobreza externa e memórias espúrias em ações mecânicas; Context Budgeting reduzindo o payload de entrada de ~1500 para 150-350 tokens; Hard Narrative Output Budget calibrado por categoria (`ACTION_NARRATIVE_BUDGETS` em `NarrativeQualityEvaluator.ts`: 85 palavras para mecânica, 75 para comércio, 110 para diplomacia, 100 para informação, 60 para recusa); Detector de Preâmbulos Clichês (`FORBIDDEN_CLICHE_PATTERNS`); Enforcement real com ciclo de recuperação em `runNarrativeCycle` (Tentativa 1 -> Tentativa 2 Regeneração Concisa -> Fallback Seguro); Suíte `tests/narrative/NAR002_NarrativeDiscipline.test.ts` (7/7 testes) integrada ao `npm test` 100% verde.
> **SIM-001 CONCLUÍDO (2026-09-03):** Simulação de Longo Horizonte e Longitudinal Narrative Drift fechado e validado (8 SP - High Effort). Orquestração de 1.000 turnos contínuos (1 turno = 1 semana de campanha) através de 4 arquétipos de agentes sintéticos (Builder, Militarist, Diplomat, Balanced) gerando intenções e linguagem natural; Zero exceções e zero travamentos ao longo de 1.000 semanas; Integridade mecânica absoluta do estado (zero NaN, Infinity ou recursos ilegais); Paridade de Replay 100% bit-a-bit confirmada sob a mesma semente de PRNG; Hard Max Compliance de 100% (todas as 1.000 narrativas respeitando o limite rígido de palavras da categoria); Salience Gate estável em 100% dos turnos (pico de 2 memórias, 1 conhecimento e 0 relações no contexto injetado, média de 180 tokens estimados de payload de contexto com zero outliers > 350 tokens); Taxa de regeneração concisa de 5.4% (meta <= 10%); Taxa de fallback seguro de 0.0% (meta <= 2%); Taxa de clichês iniciais de 1.9% (meta < 5%); Streak de repetição estrutural inicial contido em 4 (limite < 15); Ciclo de vida e decaimento de memória validado (191 memórias decaídas após 40 semanas de inatividade). Suíte `tests/simulation/SIM001_LongHorizonNarrativeDrift.test.ts` (7/7 testes) integrada ao `npm test` 100% verde.


### LLM Contracts
| Responsibility | Canonical Module | File |
|---------------|-----------------|------|
| Engine→LLM report type | `NarrativeExecutionReport` | `llm/contracts/NarrativeExecutionReport.ts` |
| Engine→LLM bridge (crossing point) | `NarrativeReportSanitizer.fromExecutionReport` | `llm/contracts/NarrativeExecutionReport.ts` |
| LLM provider contract types | `LLMContract, ModelConfig` | `llm/contracts/LLMContract.ts` |
| Model registry | `ModelRegistry` | `llm/registry/ModelRegistry.ts` |

**ENGINE → LLM BOUNDARY RULE:**
```ts
// VIOLATION — passes engine type directly to LLM validators:
NarrativeJudge.judge(text, context, executionReport)

// CORRECT — sanitize at the boundary first:
const narrativeReport = NarrativeReportSanitizer.fromExecutionReport(executionReport);
NarrativeJudge.judge(text, context, narrativeReport)
```

### LLM Validators
| Responsibility | Canonical Module | File | Scope |
|---------------|-----------------|------|-------|
| Mechanical leakage detection | `MechanicalLeakageValidator` | `llm/validators/MechanicalLeakageValidator.ts` | LLM output |
| Factual fidelity validation | `NarrativeFidelityValidator` | `llm/validators/NarrativeFidelityValidator.ts` | LLM output |
| Semantic intent validation | `SemanticValidator` | `llm/validators/SemanticValidator.ts` | LLM output |
| Composite narrative judgment | `NarrativeJudge` | `llm/validators/NarrativeJudge.ts` | LLM output |
| Narrative quality evaluation | `NarrativeQualityEvaluator` | `llm/validators/NarrativeQualityEvaluator.ts` | LLM output |
| Billing guard | `BillingGuard` | `llm/validators/BillingGuard.ts` | LLM calls |
| Engine grounding validation | `validateNarrativeConsistency` | `lib/semanticValidation.ts` | Engine cycle |

**Note:** `lib/semanticValidation.ts` (engine scope) and `llm/validators/SemanticValidator.ts` (LLM scope) are intentionally separate with distinct inputs and consumers.

---

## RANDOMNESS (RNG)

| Responsibility | Canonical Module | File |
|---------------|-----------------|------|
| Deterministic PRNG | `RandomService` / `globalRNG` | `core/RandomService.ts` |

**INVARIANT:** `Math.random()` is FORBIDDEN in any mechanical pipeline (engine, rules, combat, economy, recruitment, magnitude resolution). Only `RandomService` is permitted.

**Allowed exceptions:** Non-mechanical ID generation outside the pipeline (e.g., trace IDs).

**Replay:** Pass explicit `seed` to `executePlaytestTurnPristine(input, seed)` for deterministic sessions.

---

## STATE

| Responsibility | Canonical Module | File |
|---------------|-----------------|------|
| Campaign state snapshot | `SnapshotStore` | `core/SnapshotStore.ts` |
| Campaign state types | `CampaignState` | `types.ts` |

---

## DOMAIN SERVICES

| Domain | Service | Location |
|--------|---------|----------|
| Kingdom production | `ProductionService` | `domain/kingdom/services/` |
| Treasury | `TreasuryService` | `domain/kingdom/services/` |
| Construction | `ConstructionService` | `domain/kingdom/services/` |
| Food | `FoodService` | `domain/kingdom/services/` |
| Labor | `LaborService` | `domain/kingdom/services/` |
| Succession | `SuccessionService` | `domain/kingdom/services/` |
| Military payroll | `PayrollService` | `domain/military/services/` |
| Mount breeding | `BreedingService` | `domain/military/services/` |
| Commerce / market | `MarketService` | `domain/commerce/services/` |
| Combat stats | `CombatStatsCalculator` | `domain/items/` |
| NPC commander AI | `CommanderAIService` | `domain/npc_ai/` |
| Visibility | `VisibilityService` | `domain/visibility/` |
| Emergent incidents | `resolveEmergentIncidents` | `domain/events/EmergentIncidentPipeline` |
| Starting scenario / NPC intro | `StartingScenarioService` | `domain/startingScenario/` |

---

## OPEN DECISIONS (P2 — Require Human Approval Before Action)

| # | Decision | Blocker for |
|---|---------|------------|
| P2-A | ~~Confirm `CascadingNarrativeLLM` role vs `UnifiedNarrativeLLM`~~ — RESOLVIDO: MANTER AMBOS (2026-09-02) | ~~LLM provider deprecation~~ |
| P2-B | ~~Deprecation plan for `lib/*NarrativeLLM.ts` legacy providers~~ — RESOLVIDO: CONCLUÍDA (2026-09-02) | ~~Etapa 2 LLM features~~ |
| P2-C | Replace `payload: unknown` with discriminated union in `core/EventStore.ts` (breaking) | Future audit pipeline |

---

## PROHIBITED PATTERNS

```ts
// 1. FORBIDDEN: Bypass engine public boundary
import { resolveNarrativeCommand } from '../lib/narrativeExecution';
// USE: import { resolveNarrativeCommand } from '../engine';

// 2. FORBIDDEN: Math.random() in mechanical pipeline
const rng = new RandomService(Math.random() * 10000);
// USE: new RandomService(seed) with explicit seed parameter

// 3. FORBIDDEN: Pass ExecutionReport directly to LLM validators
NarrativeJudge.judge(text, context, executionReport);
// USE: NarrativeReportSanitizer.fromExecutionReport(executionReport) first

// 4. FORBIDDEN: Create new store/service without checking this map
// CHECK: Does existing canonical module cover this responsibility?

// 5. FORBIDDEN: Using `any` to bridge incompatible types
const x: any = campaignEvent as any;
// USE: Explicit type adapters at defined boundary points
```
