# AUDIT-DELTA-001 — Age of Shattered Oaths (Engine)

> Baseline: Code Review + Tech Debt Audit original (`Pissolato32/Age_Of_Shattered_Oats`)
> Este documento não substitui o baseline — ele registra o estado atual de cada finding e introduz uma nova categoria de débito descoberta via playtest.

---

## 1. Status por finding (baseline → delta)

| # | Finding original | Categoria | Situação atual | Nota |
|---|---|---|---|---|
| 1 | `globalRNG` sem import em `ruleResolver.ts` | Code debt | ✅ Corrigido | Import adicionado no topo de `ruleResolver.ts` e verificado via grep em todo o arquivo. |
| 2 | `globalRNG` sem import em `ActivePlay.tsx` (~24 call sites) | Code debt | ✅ Corrigido | `Math.random()` e `globalRNG` auditados; zero chamadas não declaradas em `ActivePlay.tsx`. |
| 3 | IDs aleatórios nas tropas iniciais em `engine.ts` | Code debt | ✅ Corrigido | `createInitialState()` usa IDs determinísticos estáticos (`"u_1"`, `"levy_skeleton_1"`). |
| 4 | `createInitialState()` chamado com 3 args em vez de 2 (testes/stress) | Test debt | ✅ Corrigido | Todas as suítes e ferramentas de estresse normalizadas para 2 argumentos. |
| 5 | `tsc --noEmit` falhando | Infra debt | ✅ Verde | Compilação com zero erros de tipo (`npx tsc --noEmit`). |
| 6 | Golden Suite falsamente verde (rodava com archetype inválido) | Test debt | ⚠️ Melhorado | Suítes `SemanticInputContract` e `GenericResolution` com asserts estritos de runtime. |
| 7 | Ausência de CI (lint/test em PR) | Infra debt | ⏳ Roadmap | Planejado para automação de pipeline. |
| 8 | CSP com `unsafe-inline`/`unsafe-eval` | Security/infra debt | ⏳ Roadmap | Manter no roadmap de hardening. |
| 9 | Sem rate limiting / auth nas rotas `/api/*` | Security/infra debt | ⏳ Roadmap | Maior exposição é `/api/narrate` (custo de API externa). |
| 10 | `ActivePlay.tsx` god-component (2906 linhas) | Architecture debt | ⏳ Débito estrutural | Não bloqueante; isolado do core determinístico da Engine. |
| 11 | `ruleResolver.ts` baseado em keyword matching (`if/includes`) | Code debt (baseline) | ⚠️ **Reclassificado — ver Seção 2** | Evidência de playtest mostra que é uma fonte de erro semântico e causal (`Semantic Resolution Debt`). |
| 12 | `searchCodex` com scan linear, sem cache | Performance debt | ⏳ Roadmap | Baixa urgência no volume atual de nós. |
| 13 | Defesa de prompt injection via regex simples | Security/hardening debt | ⏳ Roadmap | A separação de capabilities (`isMechanicalAllowed: false`) é a proteção real da Engine. |

---

## 2. Nova categoria: Semantic Resolution Debt

O baseline tratou `ruleResolver.ts` como um problema de **legibilidade/manutenção** (keyword matching é frágil de estender). O playtest mostrou que o problema é mais fundo: é uma **fonte real de erro semântico e causal** — o resolver classifica ações mecânicas reais como `INFORMATION`, o que significa que o jogador *pensa* que agiu no mundo, mas nenhuma mutação de estado ocorreu.

### Evidência coletada em playtest

```text
"aprofunde a investigação"                     → INFORMATION
"comitiva formal ... trégua"                   → INFORMATION
"mobilize ... piquete ... bloqueio"             → INFORMATION
"compre madeira ... melhor preço"              → TRADE → INFORMATION
"mobilize os 20 trabalhadores para reparar..."  → MILITARY (sequestro de 'mobiliz')
```

Em todos os casos, o input tem intenção acional clara (investigar, negociar trégua, mobilizar tropas, comprar, reparar), mas o resolver — por depender de palavras-gatilho como "quanto", "preço", "como funciona", "mobilizar" — colidia com branches errados e nunca chegava a aplicar os efeitos mecânicos devidos.

### Reclassificação de prioridade

| Item | Antes | Depois |
|---|---|---|
| `ruleResolver.ts` keyword matching | Code debt · Priority 15 | **Semantic Resolution Debt · Alta prioridade** (Impact 5, Risk 5, Effort 3 → Priority ~40) |

---

## 3. Milestone M18.4 — Semantic Resolution & Causal Playtest Hardening

### Objetivo
Substituir/complementar o keyword matching do `ruleResolver.ts` por uma cadeia de resolução que preserva o determinismo (nada de LLM decidindo mecânica), mas elimina colisões entre intenção informativa e intenção acional.

### Escopo

**3.1 Intent classification**
- Eliminar colisões `INFORMATION × ACTION` (prioridade semântica entre branches: ação explícita > pergunta de preço > flavor).
- Reconhecer morfologia de comando (verbos no imperativo: "mobilize", "compre", "inicie", "aprofunde") como sinal forte de ação.
- Desambiguação contextual de agentes e recursos (ex: `Aldren` + `trabalhadores` $\rightarrow$ `BUILD`; `Roric` + `soldados` $\rightarrow$ `MILITARY`).
- Distinguir pergunta genuinamente informativa ("quanto custa X") de comando com restrição ("compre X pelo melhor preço").

**3.2 Compound commands**
- Separar objetivo primário de objetivos secundários dentro de um único input.
- Extrair restrições (ex: "pelo melhor preço", "sem alertar a guarnição") como condições da resolução.
- Capturar stance/condição declarada pelo jogador junto ao comando.

**3.3 Causal execution contract**
Contrato explícito de pipeline, para que cada resolução seja auditável ponta a ponta:
```text
playerInput
  → classifiedIntent
  → actionExecuted
  → executionReport
  → stateMutation
  → weeklyResolution
  → persistedState
  → groundedNarrative
```

**3.4 Narrative grounding**
- Nenhuma "descoberta" narrada sem que exista um `discoveredInformation` correspondente no estado.
- Nenhuma consequência mecânica inventada pela camada de narração.
- Nenhum segredo vazado além do que a resolução determinística explicitamente liberou.

**3.5 Playtest coverage**
Suite estruturada cobrindo:
- 13 domínios de ação do jogo.
- Resultados SUCCESS / FAILURE / CRITICAL FAILURE.
- Comandos com restrições (constraints) e ordens negativas ("não avance", "não ataque").
- Interações cross-domain (ex: `TRADE` $\rightarrow$ `BUILD`).

---

## 4. Cadeia de rastreabilidade

```text
AUDIT-BASELINE-001
        ↓ correções
AUDIT-DELTA-001 (este documento)
        ↓ playtest causal
M18.4 (execução)
        ↓
AUDIT-DELTA-002 (próxima revisão, pós-M18.4)
```

---

## 5. Paridade Arquitetural Online/Offline e Hardening do LLM

| Ponto Auditado | Status | Correção Aplicada |
|---|---|---|
| **Paridade Offline Total** | ✅ Fechado | `GeminiNarrativeLLM.fallbackInterpret` delega para `interpretInput()` (Single Source of Truth para todos os 14 domínios). |
| **Determinismo em Classificação** | ✅ Fechado | `interpret()` no Gemini invocado com `generationConfig: { temperature: 0.0 }`. |
| **Sanitização Estrita de Schema** | ✅ Fechado | Validação contra `CANONICAL_DOMAINS` no retorno JSON (ações inválidas colapsam seguramente para `UNKNOWN`). |
| **Segurança de Credenciais** | ✅ Fechado | Chave de API migrada de query param para header `x-goog-api-key`. |
| **Unificação de Modelos** | ✅ Fechado | `GEMINI_CANDIDATE_MODELS` compartilhado e sincronizado. |

