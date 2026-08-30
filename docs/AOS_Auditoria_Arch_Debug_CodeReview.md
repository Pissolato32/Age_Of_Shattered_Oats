# Age of Shattered Oaths — Auditoria Combinada (Arquitetura + Debug + Code Review)

**Repositório analisado:** `Pissolato32/Age_Of_Shattered_Oats` — branch `main` (commit `761f62d`)
**Data:** 2026-08-29

> ⚠️ **Aviso de staleness:** este repositório público está atrás do seu trabalho local. Achados anteriores de auditoria (globalRNG sem import, IDs aleatórios das Crowns) que você já havia corrigido na branch `integration/legacy-consolidation` **ainda aparecem aqui como bugs vivos** — o push para `main` não aconteceu. Os módulos novos (`narrativeLLM.ts`, `semanticValidation.ts`, `intentHeuristics.ts`, `tests/SemanticInputContract.test.ts`) também não existem neste branch. Trato os achados abaixo como referentes ao estado *público*, não ao seu HEAD local.

---

## PARTE 1 — Debug Report (bug crítico confirmado)

### Debug Report: Crash de recrutamento para arquétipo Necromancer

**Expected**: Emitir um comando de recrutamento ("recrutar 20 soldados") deveria adicionar/atualizar uma unidade `Levy` no army ledger via `applyResolutionToState`.

**Actual**: Para uma campanha iniciada com `archetype === "Necromancer"`, o mesmo comando lança `ReferenceError: globalRNG is not defined` e quebra o pipeline de gameplay no cliente.

**Steps to reproduce**:
1. Criar campanha com `createInitialState("Necromancer", region)` — a unidade inicial do exército recebe `type: "Skeletons"` (engine.ts, linha ~74), não `"Levy"`.
2. No `ActivePlay.tsx` (linha 519), digitar um comando que caia na intenção `RECRUIT` (ex: "recrutar 20 soldados") → `executeGameplayPipeline` → `ruleResolver.resolveAction` (CASO C, linha ~195) → `applyResolutionToState`.
3. Em `applyResolutionToState` (ruleResolver.ts, linha 573-592), o efeito `army.units.levies` procura `newState.army.units.find(u => u.type === 'Levy')`. Como o Necromancer só tem `"Skeletons"`, `existingUnit` é `undefined` → cai no `else` (linha 579) que chama `globalRNG.nextInt(0, 1000000)`.
4. **`globalRNG` nunca é importado em `ruleResolver.ts`** — o arquivo só importa `searchCodex`, `CodexSearchResult`, `StructuredCodexNode` e `CampaignState`. Comparar com `engine.ts` linha 3, que faz `import { globalRNG } from "./core/RandomService"` corretamente.

**Root Cause**: Uso de um símbolo global (`globalRNG`) sem importá-lo no módulo `ruleResolver.ts`. Em TypeScript/ESM isso não é pego em tempo de build a menos que `noImplicitAny`/`strict` com resolução de módulos rígida acuse — e como `tsc --noEmit` no seu HEAD local já está limpo (0 erros, conforme você validou), é bem provável que esse import já exista na sua branch local e simplesmente não foi portado para `main`. Ainda assim, é o tipo de erro que `tsc --noEmit` roda regularmente aqui **deveria** pegar (uso de identificador não declarado/importado é erro de compilação padrão do TS) — vale rodar `npm run lint` diretamente contra este branch `main` para confirmar se ele já pegava isso.

**Por que só afeta o Necromancer**: personagens não-Necro começam com uma unidade `type: "Levy"` (`"Landed Levy"`, engine.ts linha ~73), então o `if (existingUnit)` sempre é satisfeito e o branch problemático nunca executa — isso mascarou o bug em playtests com o arquétipo padrão.

**Fix**:
```ts
// src/lib/ruleResolver.ts — topo do arquivo
import { globalRNG } from '../core/RandomService';
```

**Prevention**:
- Adicionar um teste dourado específico para `RECRUIT` com estado inicial de Necromancer (sem unidade `Levy` pré-existente) — nenhum dos testes atuais (`GoldenScenarios.test.ts`) parece cobrir esse caminho, já que o bug sobreviveu até este snapshot.
- Cobrir a branch `else` de `army.units.levies` explicitamente, para qualquer arquétipo cujo array `army.units` não contenha `type === 'Levy'`.
- Ao portar correções da branch `integration/legacy-consolidation` para `main`, considerar CI rodando `tsc --noEmit` + `npm test` no push, para pegar regressões de import antes de chegar ao branch público.

---

## PARTE 2 — Code Review

### Summary
Núcleo determinístico (engine + RNG seedado + rule resolver) é uma decisão sólida para o objetivo do projeto ("sistema de verdade mecânica"), e a separação Engine/IA está bem documentada em `AGENTS.md`. Mas há inconsistências entre os módulos de auditoria/integridade (`EventStore` vs `SnapshotStore`) e o classificador de intenção segue baseado em substring matching, o que já é rastreado por você como dívida técnica (Semantic Resolution Debt). Achado novo relevante: o "hash" de auditoria do `EventStore` não hasheia nada.

### Critical Issues

| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|
| 1 | `src/lib/ruleResolver.ts` | 581 | `globalRNG` usado sem import → `ReferenceError` em runtime para army sem unidade `Levy` (ver Debug Report acima) | 🔴 Critical |
| 2 | `src/core/EventStore.ts` | 26-29 | `rawContent` é montado (`JSON.stringify({sequence, type, payload, week})`) só para ser descartado — o `hash` real é `evt_${counter}_${random}`, não uma função de `rawContent`. O comentário promete "hash determinístico para encadeamento de auditoria", mas o valor não deriva do conteúdo do evento nem referencia o hash do evento anterior. Qualquer adulteração de `payload` passa despercebida por esse mecanismo. | 🔴 Critical |
| 3 | `src/lib/ruleResolver.ts` + `src/lib/intentParser.ts` | múltiplas | Classificação de intenção via `string.includes()` encadeado (ex.: `'homens'`, `'soldado'`, `'preco'`) — mesma classe de bug que você já documentou como "Semantic Resolution Debt" (M18.4). Ex.: qualquer frase contendo a substring `'preco'` (mesmo dentro de outra palavra ou combinada com uma ação real) cai em `INFORMATION` antes de chegar às checagens de `RECRUIT`/`TRADE`/`BUILD`, porque os `if` de INFORMATION/FLAVOR vêm primeiro no arquivo. | 🟡 Alto (já rastreado) |

### Suggestions

| # | File | Line | Suggestion | Category |
|---|------|------|------------|----------|
| 1 | `src/core/SnapshotStore.ts` | 3, 25 | Módulo nunca é importado por nenhum outro arquivo (`grep` confirma zero consumidores) — é código morto. Além disso usa `import * as crypto from 'crypto'` (built-in do Node) dentro de `src/`, que é o diretório empacotado pelo Vite para o **cliente**. `vite.config.ts` não tem nenhum plugin de polyfill de Node — no momento em que alguém importar `SnapshotStore` de um componente React, o build do cliente vai quebrar (ou o bundler vai reclamar de módulo Node ausente no browser). Se o snapshot/replay é para rodar só no lado servidor (faz sentido, dado que usa hash real), mover para uma pasta separada do bundle do cliente (ex.: `server/` ou `tools/`) e importar só a partir de `server.ts`/scripts. | Maintainability / Build risk |
| 2 | `src/core/EventStore.ts` vs `src/core/SnapshotStore.ts` | — | Duas noções de "hash" convivendo no mesmo core: `SnapshotStore` usa SHA-256 real do estado serializado (correto), `EventStore` usa um rótulo pseudoaleatório rotulado de "hash" (incorreto). Isso é confuso para quem for debugar integridade depois — sugiro renomear o campo do `EventStore` para algo como `auditId` (não é um hash) ou implementar de fato `crypto.createHash('sha256').update(rawContent).digest('hex')`, encadeando com o hash do evento anterior se o objetivo é uma cadeia auditável. | Correctness / Naming |
| 3 | `src/core/RandomService.ts` | 18-21 | O gerador é um LCG clássico (`seed = seed*9301+49297 % 233280`) com período de apenas 233.280 valores. Seu próprio `StressTestRunner` roda até 100.000 ticks (`stress:long`); dependendo de quantos `globalRNG.next()` são consumidos por tick (combate, eventos, nomes), uma campanha longa pode ciclar o gerador e repetir sequências de "aleatoriedade". Não é um problema de segurança (não é uso criptográfico), mas pode produzir padrões perceptíveis em campanhas de sessão muito longa. Considerar um PRNG de período maior (ex.: `mulberry32`/`xorshift128`) mantendo a mesma interface. | Correctness (quality) |
| 4 | `src/core/EventStore.ts` | 29, 32 | Cada `record()` consome duas chamadas de `globalRNG` só para gerar IDs/labels de auditoria. Isso mistura entropia de bookkeeping com entropia de mecânica de jogo no mesmo stream determinístico — funciona hoje (replay determinístico se a ordem de chamadas for idêntica), mas acopla "quantos eventos foram logados" ao resultado dos próximos dados rolados. Se algum dia vocês pularem/adicionarem um log de auditoria condicionalmente, isso desalinha silenciosamente todos os rolls seguintes. Sugiro um RNG separado (ou um contador simples) só para IDs de auditoria, sem tocar no `globalRNG` mecânico. | Architecture |
| 5 | `src/lib/gameplayPipeline.ts` | 55-57 | `integrityOk = mutated ? true : verifyStateIntegrity(...)` — quando o estado é mutado, a integridade é marcada `true` sem nenhuma verificação real (o hash "antes" nem é comparado contra o hash "depois" nesse branch). Como o objetivo declarado do pipeline é "Validação Defensiva de Integridade por Hash", vale realmente comparar o hash mecânico esperado (estado antigo + delta aplicado) contra o hash do `updatedState`, em vez de assumir sucesso sempre que `mutated === true`. | Correctness |

### What Looks Good
- Separação clara entre resolução mecânica determinística (`engine.ts`, `ruleResolver.ts`) e camada de flavor/IA (`webFlavorService`, prompts em `AGENTS.md`) — a "Regra de Ouro" está bem operacionalizada no código, não só documentada.
- `applyResolutionToState` tem garantia de zero-mutação para decisões `DENIED`/`NOT_FOUND`, com clone profundo antes de mutar — evita side effects acidentais.
- `SnapshotStore` (apesar de não usado) implementa hashing real via SHA-256 corretamente.
- `RandomService` é uma abstração limpa e testável sobre `Math.random()`, essencial para o objetivo de campanhas replayáveis.
- Sanitização básica contra prompt injection em `sanitizeActionText` — simples, mas mostra que a superfície de risco (texto livre do jogador indo para regras/IA) foi considerada.

### Verdict
**Request Changes** — o crash do Necromancer (Critical #1) é bloqueante para qualquer campanha nesse arquétipo neste branch; o hash inerte do `EventStore` (Critical #2) mina a garantia de auditoria que o próprio design promete e vale corrigir antes de tratar `main` como "verdade" para playtest.

---

## PARTE 3 — ADR: Modelo de Autoridade de Estado e Classificação de Intenção

### ADR-000 (proposto): Onde deve viver a "verdade mecânica" — cliente, servidor, ou ambos?

**Status:** Proposed
**Date:** 2026-08-29
**Deciders:** você (autor/único dev do projeto)

#### Context
O `AGENTS.md` estabelece a "Regra de Ouro": só existe no mundo o que a engine determinística computou e gravou no ledger. Hoje, porém, `engine.ts`, `ruleResolver.ts` e `globalRNG` rodam **inteiramente no bundle do cliente** (`ActivePlay.tsx` os importa e chama diretamente) — `server.ts` só expõe endpoints para `searchCodex`, `resolveAction` (leitura/consulta) e flavor via Gemini, não para `resolveWeeklyTurn`/`applyResolutionToState`. Não há autoridade de servidor sobre o estado mecânico.

Para uma ferramenta de campanha single-player/local isso provavelmente é aceitável — não há adversário tentando trapacear contra outro jogador. Mas vale decidir isso explicitamente, porque afeta diretamente o Achado #1 do Debug Report (o crash acontece no cliente, sem rede de segurança do servidor) e a arquitetura de "Session Flow" que você está desenhando para o mestre local via Player2/Antigravity.

#### Decision (a ser tomada)
Duas opções realistas, dado o estágio do projeto:

#### Option A: Manter engine 100% client-side (status quo)
| Dimension | Assessment |
|-----------|------------|
| Complexity | Baixa — já implementado |
| Cost | Nenhum custo adicional de infra |
| Scalability | Não relevante (single-player local) |
| Team familiarity | Alta (você já conhece 100% do código) |

**Pros:** Simplicidade, zero latência, funciona offline (alinhado com o uso do Player2 local/DeepSeek local).
**Cons:** Erros não tratados (como o do Debug Report) derrubam a UI sem fallback; nada impede alteração manual de `localStorage`/estado via devtools, o que é um problema filosófico para um sistema cuja premissa central é "verdade mecânica imutável".

#### Option B: Engine roda só no servidor (`server.ts`), cliente só envia comandos e renderiza resultado
| Dimension | Assessment |
|-----------|------------|
| Complexity | Média-alta — exige mover `resolveWeeklyTurn`/`applyResolutionToState`/`simulateCombatRound` para trás de endpoints, e versionar o `CampaignState` como fonte de verdade do servidor |
| Cost | Baixo (mesmo processo Express que já existe) |
| Scalability | Não é o motivador aqui |
| Team familiarity | Requer refatorar `ActivePlay.tsx` para chamadas assíncronas em vez de chamadas de função síncronas locais |

**Pros:** A "Regra de Ouro" passa a ser tecnicamente inviolável pelo cliente (que só vê o resultado já processado); erros de engine ficam isolados no servidor com stack traces/logs centralizados; abre caminho natural para persistência real de campanha (hoje é local/localStorage, segundo sua memória de projeto) e para multiplayer futuro (`player2`) sem reescrever o núcleo.
**Cons:** Mais um salto de rede por comando; exige lidar com estado de sessão/campanha no servidor (hoje inexistente); trabalho de refatoração não trivial dado que `ActivePlay.tsx` já tem 2900+ linhas acopladas ao fluxo síncrono atual.

#### Trade-off Analysis
Se o uso real é "eu jogando sozinho, localmente, com um LLM local", Option A é pragmática e o Debug Report vira só "corrigir o import e adicionar teste", sem motivo para reescrita. Option B só se paga se você pretende (a) abrir a ferramenta para outro jogador acessando remotamente, ou (b) quer que travas de engine nunca derrubem a UI do jogador (um erro no servidor pode ser capturado e devolvido como "ação negada" educadamente, em vez de tela quebrada). Dado que você mencionou querer jogar com um `player2` (segundo jogador humano) usando um LLM local como mestre, uma arquitetura cliente-servidor real (Option B) se alinha melhor com esse objetivo de médio prazo do que o modelo atual.

#### Consequences
- Se ficar em A: documentar explicitamente (em `AGENTS.md` ou README) que o modelo de confiança é "single-player, sem proteção contra adulteração client-side" — isso já é implicitamente verdade, só não está escrito.
- Se migrar para B: o milestone M18.4 (Semantic Resolution & Causal Playtest Hardening) que você já planejou é o momento natural para essa migração, já que o "causal execution contract" (playerInput → classifiedIntent → ... → persistedState) que você desenhou já pressupõe uma fronteira clara entre entrada e persistência — essa fronteira é exatamente onde entraria um servidor autoritativo.

#### Action Items
1. [ ] Decidir A vs B e registrar a decisão (mesmo que seja "A, por enquanto")
2. [ ] Corrigir o import de `globalRNG` em `ruleResolver.ts` (independente da decisão acima)
3. [ ] Corrigir o hash inerte do `EventStore` para reforçar a garantia de auditoria já documentada
4. [ ] Se optar por B: mapear quais chamadas de `ActivePlay.tsx` (`resolveWeeklyTurn`, `executeGameplayPipeline`, `simulateCombatRound`) viram endpoints, e qual formato de erro o servidor devolve para o cliente quando a engine falha (hoje, uma exceção não tratada quebra a tela)
