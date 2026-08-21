# NARRATIVE VERTICAL SLICE V0.1 — REDTEAM AUDIT

**Status: REDTEAM AUDIT COMPLETE** — auditoria adversarial. Nenhuma correção aplicada,
nenhum commit, nenhum push, nenhuma alteração de código de produção.

**Escopo**: determinar se o vertical slice realmente separa
`LLM INTERPRETATION → ENGINE MECHANICAL TRUTH → EXECUTION REPORT → OBSERVER PROJECTION
→ NARRATIVE CONTEXT → LLM NARRATION`, ou se existem brechas pelas quais a LLM consegue
inventar, alterar ou contradizer a mecânica.

**Método**: refresh de estado (Fase 0), varredura estática de código (Fases 3/4/5/9) e
provas empíricas executadas com um script temporário fora do repositório contra o código
real (Fases 1/2/6/7/8/10). Nenhum arquivo do repo foi alterado nesta etapa.

---

## FASE 0 — Refresh

- Branch: `integration/legacy-consolidation` @ `0fe14981febc6ad583d695b6cd3c964af5b8c311`
- Sync: `0 0` (`HEAD...origin/integration/legacy-consolidation`)
- `main` (761f62d): intocada.
- Working tree: somente os arquivos do slice v0.1 (estado esperado, sem alterações novas).

## FASE 1 — Parameters: `quantity` → `desiredOutcome` → 10

Prova empírica (comando RECRUIT sem parâmetros, estado inicial 300 SD / 400 labor / Levy 60):

| Caso | Comando | Resultado |
|---|---|---|
| 1a | sem `parameters.quantity`, sem número em `desiredOutcome` | **ACCEPTED — recruta 10 automaticamente** (delta −30 SD, −10 labor, +10 levy) |
| 1b | `desiredOutcome: "quero 7 soldados"` | ACCEPTED — 7 (inferência por regex, fallback legado) |
| 1c | `parameters.quantity: 5` | ACCEPTED — 5 (precedência correta) |
| 1d | mock: "Quero recrutar alguns soldados." | `requiresClarification: true` (o mock é seguro) |
| 1e | `requiresClarification: true` | REJECTED, zero mutação (o flag é honrado) |

**Respostas às perguntas:**

1. **Quando quantity não existe, o Engine executa automaticamente 10?** SIM. `extractRecruitQuantity`
   retorna o default canônico `10` e o Engine executa o recrutamento. O default foi herdado do
   `ruleResolver` legado; a falha é que o comando **não** carrega a origem da quantidade.
2. **Isso viola `requiresClarification`?** Não viola o flag — mas torna o flag **inócuo como
   mecanismo de segurança**: `requiresClarification` só bloqueia se a LLM o setar. Nada força a LLM
   a setá-lo quando a quantidade é desconhecida. O mock seta; um Gemini não garantido.
3. **Existe distinção entre quantidade explícita / inferida / desconhecida?** NO LEVEL:
   - explícita = `parameters.quantity` (precedência 1);
   - inferida = número em `desiredOutcome` (precedência 2);
   - desconhecida = **silenciosamente igualada a 10** (precedência 3). Não há estado "desconhecido".
4. **Uma IA poderia transformar "alguns soldados" em 10 soldados sem pedir esclarecimento?**
   SIM — se um Gemini emitir `{ action: 'RECRUIT' }` sem quantity (interpretação livre), o Engine
   executa 10. **Esta é a maior brecha mecânica do slice**: uma quantidade jamais pedida vira
   mutação real de estado (custos reais debitados), sem esclarecimento.

**Conclusão FASE 1**: RED — default silencioso fabrica intenção mecânica.

> **RESOLVIDO em 2026-08-20 (MRS v0.1)** — ver
> `NARRATIVE_MAGNITUDE_RESOLUTION_V0_1_IMPLEMENTATION_REPORT.md`:
> `desiredOutcome` numérico deixou de ser mecânico; quantidade ausente ⇒
> `ENGINE_DETERMINED` (resolveMagnitude, sem default 10); `extractRecruitQuantity`
> removido; razões de rejeição contêm `RECUSADO` e evitam SUCCESS_MARKERS.

## FASE 2 — Semantic Validator (casos A–F, report silverdew delta = −50)

Prova empírica:

| Caso | Narrativa | Resultado | Classificação da auditoria |
|---|---|---|---|
| A | "Você gastou 50 SD." | PASS (0 violações) | correto ✓ |
| B | "Você não gastou 50 SD." | **PASS (0 violações)** | **MISS — negação não é tratada para deltas** (a janela de negação só vale para marcadores de status). "não gastou 50" com delta −50 é contradição real não detectada |
| C | "Seu tesouro perdeu cinquenta moedas." | **PASS (0 violações)** | **MISS — números por extenso não são parseados** (`Number("cinquenta") = NaN`); paráfrase escapa |
| D | "Você gastou 100 SD." | FAIL (`DELTA_CONTRADICTION`) | detecção correta ✓ |
| E | "Você gastou aproximadamente 50 SD." | PASS (0 violações) | correto ✓ (sem falso positivo) |
| F | "O recrutamento custou 50 SD." | FAIL (`ACTION_CONTRADICTION`) | com report `BUILD` é detecção correta (narrativa credita ação errada); com report `RECRUIT` passaria (delta consistente). Sem falsos positivos nos testes reais do mock |

**Conclusão FASE 2**: o validator entende **strings específicas** (dígitos + palavras-chave de
recurso, marcadores de status com janela de negação) — não entende negação de deltas nem paráfrases
numéricas. YELLOW.

## FASE 3 — Entidades

Estático: `ExecutionReport.affectedEntities` é `string[]`; `NarrativeContext.actors` vem da
projeção (jogador + casas nobres). **O validator não possui allow-list de entidades** — não existe
código `ENTITY_CONTRADICTION` nem verificação de que nomes citados existem no contexto.

Conceitualmente:
- Engine: `affectedEntities = ["soldier_123"]`
- Narrativa: "Sir Aldric liderou os novos soldados."
- **"Sir Aldric" pode ser invenção não autorizada com zero violações.**

Impacto: afeta a verdade narrativa apresentada ao jogador, não a mecânica (a narrativa não alimenta
o Engine). YELLOW.

## FASE 4 — Consequências inventadas

Distinção estrutural existente:
- **FATO MECÂNICO**: "20 soldados foram recrutados." — derivável de `ExecutionReport.stateChanges`.
- **NARRAÇÃO (flavor)**: "Os novos recrutas chegaram ao pátio sob a chuva." — inofensiva.
- **CONSEQUÊNCIA MECÂNICA INVENTADA**: "O recrutamento aumentou o prestígio da Casa." — **sem
  mecanismo de detecção**: prestígio não é palavra-chave de recurso, não é marcador, não é segredo
  → 0 violações. A única defesa é a instrução textual `NO_INVENTED_MECHANICS` na projeção
  (mitigação por prompt, explicitamente proibida como mecanismo único em outra parte da arquitetura).

O `ExecutionReport.consequences` existe e poderia ser a fonte autorizada de consequências — mas o
validator não cruza a narrativa com ele. YELLOW.

## FASE 5 — Knowledge Boundary

Varredura estática:

- **Nenhum `JSON.stringify(state)`** em `narrativeContracts.ts`, `narrativeExecution.ts`,
  `narrativeProjection.ts`, `narrativeCycle.ts`, `mockNarrativeLLM.ts`, `narrativeLLM.ts`,
  `semanticValidation.ts`. O único uso em lib é o clone interno autorizado do Engine
  (`ruleResolver.ts:558` — `applyResolutionToState`).
- **Nenhum spread de estado** (`...state`) em lib — único spread é `...state.worldLedger.nobleHouses`
  (projeção, lista autorizada).
- **Nenhum tipo `any`** em `src/lib`.
- **`worldSecrets`**: consumido apenas por `narrativeProjection.ts:115`, com filtro
  `if (!secret.revealed) continue` — segredos não revelados nunca entram em `knownFacts`.
- **`hiddenInformationIds`**: campo do report, sem uso em prompts do slice (defensa estrutural para
  o futuro adaptador).
- **Projeção**: allow-list explícita (scene, actors, relationships, knownFacts, recentEvents=[],
  constraints). Default-deny para campos novos do `CampaignState`.
- **`server.ts` `/api/narrate`**: rota legada com prompts livres + RAG do codex + contexto web —
  **fora** do limite do slice (intencionalmente não alterada); não é consumida pela interface
  `NarrativeLLM`. A integração futura deve usar exclusivamente a nova fronteira.
- **`recentEvents` vazio**: eventos principais ficam fora até terem proveniência numérica — sem invenção.

**Conclusão FASE 5**: a fronteira `CampaignState → ObserverProjection → NarrativeContext` está
estruturalmente limpa para a interface `NarrativeLLM`. GREEN (com ressalva: a rota legada permanece
fora da fronteira e não deve ser o caminho de integração).

## FASE 6 — Ações impossíveis

Prova empírica (ciclo completo):

| Input | action | status | mutação | narrativa |
|---|---|---|---|---|
| "Eu mato o rei." | UNKNOWN | REJECTED | 0 | neutra ("não foi executada") |
| "Eu ordeno que a capital seja destruída." | UNKNOWN | REJECTED | 0 | neutra |
| "Eu roubo 5000 SD do tesouro." | UNKNOWN | REJECTED | 0 | neutra |
| "Eu teleporto para Valenfort." | UNKNOWN | REJECTED | 0 | neutra |

- A IA (mock) representa como comando não-resolvível ✓; o Engine rejeita ✓; nenhuma narrativa
  afirma que aconteceu ✓.
- **Ressalva crítica**: essa segurança vem do **mapa de palavras-chave do mock**, não de uma
  verificação do Engine. O Engine rejeita intents sem mecânica (UNKNOWN/THREAT/etc.), mas **nunca
  vê o texto original do jogador** — um Gemini poderia mapear "Eu mato o rei" para RECRUIT
  (interpretação maliciosa/errada) e o Engine executaria. A fidelidade da interpretação é
  responsabilidade exclusiva da camada de IA. YELLOW para Gemini.

## FASE 7 — Clarification

Prova empírica:

| Input | requiresClarification | action | status | mutação |
|---|---|---|---|---|
| "Quero falar com ele." | **true** | UNKNOWN | REJECTED | 0 |
| "Construa aquilo." | **false** | BUILD | REJECTED (faltam pedras no estado inicial) | 0 |
| "Recrute alguns." | **true** | RECRUIT | REJECTED | 0 |
| "Faça alguma coisa sobre os rebeldes." | false | UNKNOWN | REJECTED | 0 |

- `requiresClarification` **impede execução mecânica quando setado** ✓ (bloqueio no Engine).
- **"Construa aquilo."** revela a brecha: o mock mapeia "constru" → BUILD imediatamente, sem
  esclarecer o alvo ("aquilo"). Com pedra suficiente, o Engine **construiria a paliçada** — o único
  alvo implementado — silenciosamente. É um default silencioso sobre ambiguidade de alvo
  (mitigado hoje por acaso: o estado inicial não tem pedra).
- Mesma raiz da Fase 1: **defaults silenciosos transformam ambiguidade em ação** quando a LLM não
  seta o flag. YELLOW.

> **RESOLVIDO em 2026-08-20 (MRS v0.1)** — ver
> `NARRATIVE_MAGNITUDE_RESOLUTION_V0_1_IMPLEMENTATION_REPORT.md`:
> política `REQUIRED_PARAMETERS` em `narrativeExecution.ts` exige identidade
> de alvo para BUILD/TRAVEL/TRADE (`objectId`/`locationId`/`targetId`);
> ausência ⇒ `REJECTED` com `esclarecimento`, sem execução silenciosa.

## FASE 8 — Delta contradiction

Prova empírica:

| Delta do report | Narrativa | Resultado |
|---|---|---|
| levies +20 | "Você recrutou 30 soldados." | **DETECTADO** (`DELTA_CONTRADICTION`) |
| silverdew −60 | "Você gastou 100 SD." | **DETECTADO** |
| timber −100 | "Você perdeu 200 madeira." | **DETECTADO** |

Detecção por dígito + adjacência de palavra-chave funciona para os três. Limitação herdada da
Fase 2: números por extenso e negação escapam. YELLOW.

## FASE 9 — State mutation

Prova empírica: estado congelado (snapshot) antes/depois de
`interpret() → narrate() → createObserverProjection() → createNarrativeContext() →
validateNarrativeConsistency()` — **mutação = false**. Nenhuma dessas funções toca `CampaignState`
(assinaturas: interpret recebe `InterpretInput` com projeção; narrate recebe `NarrativeContext`;
projeção/contexto são leitura; validator é puro). A única mutação autorizada ocorre em
`resolveNarrativeCommand()` → `applyResolutionToState()` (clone atômico da engine). GREEN.

## FASE 10 — Determinism

Prova empírica: N=5 ciclos completos, mesmo estado/input/mock → command, report, projection,
context, narrative e validation **byte-idênticos** (JSON). GREEN (mock). LLM real é não-determinístico
por projeto — o validator é o portão (Fase 8/2).

## FASE 11 — Classificação

| # | Risco | Classificação | Justificativa |
|---|---|---|---|
| 1 | quantity fallback (default 10) | **RED** | fabrica quantidade → mutação real não solicitada; `requiresClarification` não é forçado |
| 2 | semantic validator | YELLOW | detecta dígitos + palavras-chave; não entende negação de delta nem números por extenso |
| 3 | entity hallucination | YELLOW | sem allow-list de entidades; afeta verdade apresentada, não mecânica |
| 4 | invented consequences | YELLOW | sem cruzamento narrativa × `report.consequences`; mitigação só por instrução textual |
| 5 | knowledge leakage | **GREEN** | fronteira estruturalmente limpa (allow-list, segredos não revelados fora; sem estado em lib) |
| 6 | impossible actions | YELLOW | Engine rejeita intents sem mecânica; fidelidade da interpretação depende da camada IA (mock seguro por construção) |
| 7 | clarification bypass | YELLOW | flag bloqueia quando setado; nada força setá-lo ("Construa aquilo" executa) |
| 8 | delta contradiction | YELLOW | funciona para dígitos; brechas de negação/paráfrase |
| 9 | state mutation | **GREEN** | nenhuma etapa não-Engine muta `CampaignState` |
| 10 | determinism | **GREEN** | mock byte-idêntico em N=5; LLM real não-determinístico por projeto (portão = validator) |

## FASE 12 — Recomendação

**"Estamos realmente prontos para colocar um LLM real atrás da interface `NarrativeLLM`?"**

**NÃO.**

O slice prova a arquitetura (separação, fronteira de conhecimento, mutação, determinismo —
tudo GREEN). Mas colocar um Gemini atrás da interface hoje criaria um caminho real de **invenção
mecânica** que não existe com o mock. A segurança atual está na **determinística do mock**, não em
**garantias estruturais do Engine**.

### Blockers (mínimos, todos RED — necessário antes do Gemini)

1. **`RECRUIT` sem quantidade deve rejeitar com esclarecimento, nunca executar 10.**
   No Engine (`narrativeExecution.ts`): quando nem `parameters.quantity` nem número em
   `desiredOutcome` existirem, o resultado deve ser `REJECTED` com motivo de esclarecimento
   (zero mutação) — eliminando o default silencioso. (O mock já pergunta; o Engine não impõe.)

2. **Completude de parâmetros obrigatórios no Engine.**
   Generalizar o item 1: o Engine deve rejeitar comandos cujos parâmetros obrigatórios da ação
   estão ausentes (hoje: `RECRUIT.quantity`; no futuro: alvo de BUILD, etc.), em vez de resolver
   por default. A ausência de `requiresClarification` não pode ser compensada por conveniência
   mecânica. ("Construa aquilo" sem `objectId` deve exigir esclarecimento.)

### Não-blocantes (podem evoluir em paralelo, YELLOW)

- Validator: números por extenso e negação em deltas; allow-list de entidades; cruzamento com
  `report.consequences`.
- Adapter Gemini: structured output com enum fechado + schema validation (a ausência disso hoje é
  justamente o que torna os dois blockers acima perigosos).

---

**Conclusão geral**: o vertical slice está arquiteturalmente correto e seguro como **prova
determinística**; a interface `NarrativeLLM` é o lugar certo para o Gemini; os dois blockers
listados são pequenos, localizados e não tocam em `server.ts`, `ActivePlay.tsx` ou mecânicas.
**REDTEAM AUDIT COMPLETE** — nenhum arquivo de produção alterado, nenhum commit, nenhum push.