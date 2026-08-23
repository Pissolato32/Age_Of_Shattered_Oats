# AUDIT REPORT: DELTA M18.7 & M18.7.1 — REAL ONLINE LLM ADVERSARIAL MEMORY PLAYTEST

**Data**: 2026-08-23  
**Milestone**: M18.7.1 (Contract Repair & Temporal Epistemic Resolution)  
**Provider**: Google Gemini (`gemini-3.5-flash-lite` / `gemini-3.5-flash`)  
**Modo**: Online Real (Sem Mock, Sem Fallback Offline)  
**Status**: 🏆 APROVADO COM 100% DE SUCESSO (6/6 CENÁRIOS ONLINE PASS)  

---

## 1. Sumário Comparativo: Baseline M18.7 vs M18.7.1

| Finding / Cenário | Sintoma no M18.7 Baseline | Intervenção Arquitetural M18.7.1 | Resultado no Rerun M18.7.1 | Status |
|---|---|---|---|:---:|
| **PT-014** (Cenário 1: Zero-Keyword) | ❌ `FAIL`: Gemini gerou cena genérica de Grey Keep sem responder sobre a guarnição da fronteira. | `NarrativeQueryContext` adicionado ao `NarrativeContext`, preservando `playerInput` até o prompt do narrador. | ✅ **PASS**: Recuperou a guarnição de 25 homens sem brasão na travessia de pedra. | **RESOLVIDO** |
| **PT-015** (Cenário 5: Tríade Temporal) | ❌ `FAIL`: Misturou presente e passado, atribuindo o fato T18 retroativamente ao passado. | `resolveEpistemicSnapshot()` e `KnowledgeSnapshot(asOfTurn)` na Engine isolando estritamente os fatos da época. | ✅ **PASS**: Distinguiu presente (Vane/Ironhand), passado T09 (Desconhecido) e evolução causal completa. | **RESOLVIDO** |
| **PT-016** (Controle Negativo: Blackthorn) | ❌ `FAIL`: Evasão passiva; omitiu Blackthorn sem declarar a inexistência de registros. | `EpistemicAnswerStatus: 'NO_AUTHORIZED_INFORMATION'` na Engine + recusa diegética mandatória no `SYSTEM_PROMPT`. | ✅ **PASS**: Declarou expressamente que não há registros ou menções sobre Blackthorn nos anais. | **RESOLVIDO** |

---

## 2. Painel de Invariantes Estritas (Hard Gates)

| Invariante | Meta | Baseline M18.7 | **M18.7.1 Rerun (Online)** | Status |
|---|---|:---:|:---:|:---:|
| **Fact Recall** | 100% | 80% | **100%** | ✅ PASS |
| **False Memory (Alucinações)** | 0 | 0 | **0** | ✅ PASS |
| **Secret Leakage (Vazamento de Segredos)** | 0 | 0 | **0** | ✅ PASS |
| **Unsupported Correlation** | 0 | 0 | **0** | ✅ PASS |
| **Historical Contradiction** | 0 | 0 | **0** | ✅ PASS |
| **Stale-State Recall** | 0 | 0 | **0** | ✅ PASS |
| **Invalid Fact Citation** | 0 | 0 | **0** | ✅ PASS |
| **Provenance Mismatch** | 0 | 0 | **0** | ✅ PASS |
| **Context Dependence (Zero-Context Pass)** | 0 | 0 | **0** | ✅ PASS |
| **Current-State Accuracy** | 100% | 80% | **100%** | ✅ PASS |
| **Negative-Memory Violation** | 0 | 1 Falha | **0** | ✅ PASS |
| **Temporal Attribution Error** | 0 | 1 Falha | **0** | ✅ PASS |

---

## 3. Análise Detalhada dos 6 Cenários (Gemini Online)

### Cenário 1: Zero-Keyword Recall (`SCENARIO_1_ZERO_KEYWORD`) — ✅ PASS
- **Prompt**: *"Roric, quais forças potencialmente hostis conhecemos atualmente nas nossas fronteiras?"*
- **Resposta do Gemini Online**:
  > *"Roric adianta-se com expressão sombria, trazendo à tona os registros de patrulha: na travessia de pedra da fronteira, uma guarnição armada de 25 soldados sem brasão visível mantém controle rígido sobre a passagem..."*

### Cenário 2: Correlação Multi-Fato (`SCENARIO_2_MULTI_FACT_CORRELATION`) — ✅ PASS
- **Prompt**: *"Há alguma relação conhecida entre os acontecimentos recentes na fronteira e nossas dificuldades comerciais?"*
- **Resposta do Gemini Online**: Correlacionou com precisão o encarecimento dos grãos provocado por compras anônimas no leste com a movimentação de suprimentos na fronteira, mantendo os boatos de contrabandistas como não confirmados.

### Cenário 3: Contradição Epistemológica (`SCENARIO_3_EPISTEMIC_CONTRADICTION`) — ✅ PASS
- **Prompt**: *"Quem comanda a posição e como sabemos disso?"*
- **Resposta do Gemini Online**: Identificou o Capitão Vane da Casa Ironhand e atribuiu a certeza à investigação documental realizada no Turno 18.

### Cenário 4: Estado Atual × Histórico (`SCENARIO_4_MUTATION_AND_HISTORY`) — ✅ PASS
- **Prompt A (Atual)**: *"Qual é a situação atual da passagem na Velha Ponte?"*
- **Prompt B (Histórico)**: *"A passagem na Velha Ponte já esteve formalmente autorizada em algum momento anterior?"*
- **Resposta do Gemini Online**: Confirmou categoricamente que o estado atual é de bloqueio hostil e emboscada contra mensageiros, mas recordou a existência da trégua formal de passagem ativa entre as Semanas 22 e 34.

### Cenário 5: Tríade Temporal Epistêmica (`SCENARIO_5_TEMPORAL_TRIAD`) — ✅ PASS
- **5A (Presente)**: *"Quem comanda atualmente a posição na ponte?"* $\rightarrow$ Capitão Vane / Casa Ironhand.
- **5B (Passado T09)**: *"Quem sabíamos que comandava a posição no Turno 9?"* $\rightarrow$ Respondeu expressamente que na época a identidade era desconhecida nos anais da fortaleza.
- **5C (Evolução)**: *"Como nossa compreensão da identidade do comandante mudou ao longo da campanha?"* $\rightarrow$ Narrou o percurso causal completo: desconhecido (T09) $\rightarrow$ boato de viajantes (T14) $\rightarrow$ confirmação por investigação (T18) $\rightarrow$ trégua (T22-T34) $\rightarrow$ ruptura (T35).

### Controle Negativo: Ausência Total de Registros (`CONTROL_NEGATIVE_UNRECORDED_ENTITY`) — ✅ PASS
- **Prompt**: *"O que sabemos sobre a Casa Blackthorn e sua participação na ponte?"*
- **Resposta do Gemini Online**:
  > *"Soberano, não há uma única linha nos anais desta fortaleza, nem qualquer relatório de nossos batedores, que mencione a existência da 'Casa Blackthorn' ou sua suposta participação na ponte. Nossos arquivos calam-se inteiramente sobre esse nome; o que nossos registros e investigações de sangue comprovam, com absoluta certeza, é que o comando da guarnição na travessia pertence ao Capitão Vane da Casa Ironhand..."*

---

## 4. Conclusão Arquitetural

A implementação do **M18.7.1** estabeleceu o princípio canônico definitivo de memória em *Age of Shattered Oaths*:
1. A **Engine** é a guardiã única da verdade causal e temporal: ela calcula o `KnowledgeSnapshot(asOfTurn)` e determina a validade histórica dos fatos.
2. A **LLM** atua como pós-processador sensorial e literário: ela recebe apenas os fatos autorizados da janela temporal em foco e o `answerStatus`, comunicando a informação com fidelidade factual estrita e silêncio mecânico.
