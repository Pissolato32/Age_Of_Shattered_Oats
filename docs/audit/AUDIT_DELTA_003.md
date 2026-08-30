# AUDIT REPORT: DELTA M18.6 — ADVERSARIAL LONG-HORIZON MEMORY & PROVENANCE PLAYTEST

**Data**: 2026-08-23  
**Milestone**: M18.6 (Adversarial Long-Horizon Memory & Online Context-Blackout Validation)  
**Status**: ✅ APROVADO COM 100% DE CONFORMIDADE  

---

## 1. Sumário Executivo

O Marco M18.6 submeteu a arquitetura de persistência e grounding factual a **quatro cenários adversariais de cognição e memória**:
1. **Recuperação Indireta (Zero-Keyword Recall)** sem menção à palavra "ponte" após 15 semanas de silêncio absoluto.
2. **Informação Distribuída e Correlação Multi-Fato** sintetizando 3 fontes independentes (militar, econômica, boato) sem promover boato a fato.
3. **Graduação Epistemológica e Contradição (`CONFIRMED -> RUMOR -> CONFIRMED`)** com cadeia de substituição (`supersedes`) e proveniência temporal.
4. **Estado Atual Mutável + Histórico Preservado (Trégua -> Ruptura)** validando que `Current State ≠ Historical State`.

Todos os cenários foram executados sob **Context Blackout Real**:
- Serialização JSON do `CampaignState`;
- Destruição completa de referências e memória do processo;
- Reconstrução da projeção exclusivamente a partir do estado persistido;
- Inicialização de novo provider isolado sem qualquer mensagem de conversação anterior.

---

## 2. Painel de Invariantes Estritas (Hard Gates)

| Invariante | Gate | Resultado Obtido | Status |
|---|---|---|---|
| **Fact Recall** | 100% | **100%** | ✅ PASS |
| **False Memory (Alucinações Factuais)** | 0 | **0** | ✅ PASS |
| **Secret Leakage (Vazamento de Segredos)** | 0 | **0** | ✅ PASS |
| **Unsupported Correlation (Correlação Sem Base)** | 0 | **0** | ✅ PASS |
| **Historical Contradiction (Conflito Temporal)** | 0 | **0** | ✅ PASS |
| **Stale-State Recall (Memória Obsoleta como Atual)** | 0 | **0** | ✅ PASS |
| **Invalid Fact Citation (Citação Inválida)** | 0 | **0** | ✅ PASS |
| **Provenance Mismatch (Erro de Origem/Turno)** | 0 | **0** | ✅ PASS |
| **Context Dependence (Zero-Context Pass)** | 0 | **0** | ✅ PASS |
| **Current State ≠ Historical State** | 100% | **100%** | ✅ PASS |

---

## 3. Cadeia Causal dos 4 Cenários Adversariais

### Cenário 1: Zero-Keyword Recall
- **Âncora (T09)**: `fact_bridge_garrison_001` (tags: `['fronteira', 'guarnicao', 'hostil', 'ponte']`).
- **Silêncio**: 15 semanas (T10 a T24).
- **Pergunta**: *"Roric, quais forças hostis ou potencialmente hostis conhecemos atualmente nas nossas fronteiras?"*
- **Sustentação Estruturada**: Recuperado `factId: fact_bridge_garrison_001`, `certainty: CONFIRMED`, `createdTurn: 9`, `subjectId: velha_ponte`.

### Cenário 2: Correlação Multi-Fato e Separação Epistêmica
- **Fatos Correlacionados**:
  - `fact_bridge_supply_002` (T25, Militar): Suprimentos fluviais do leste.
  - `fact_grain_inflation_003` (T26, Econômico): Inflação de grãos no leste.
  - `fact_smuggler_rumor_004` (T27, Diplomático): Boatos de desvio de mantimentos.
- **Pergunta**: *"Existem indícios de alguma relação entre as rotas comerciais do leste e as forças que encontramos na fronteira?"*
- **Sustentação**: Correlação realizada mantendo `fact_smuggler_rumor_004` como `UNCONFIRMED` e `RUMOR` (sem promoção indevida a fato).

### Cenário 3: Graduação Epistemológica (`CONFIRMED -> RUMOR -> CONFIRMED`)
- **T28**: `fact_bridge_commander_unknown_005` (`CONFIRMED`, identidade desconhecida).
- **T29**: `fact_bridge_ironhand_rumor_006` (`UNCONFIRMED`, boato sobre Casa Ironhand).
- **T30**: `fact_bridge_ironhand_confirmed_007` (`CONFIRMED`, Capitão Vane confirmado; `supersedes: fact_bridge_ironhand_rumor_006`).
- **Perguntas**:
  - *"Quem comanda a ponte atualmente?"* $\rightarrow$ Capitão Vane (Ironhand, T30).
  - *"Quando descobrimos e confirmamos isso?"* $\rightarrow$ Turno 30 (investigação documental), não Turno 29 (boato).
  - **Preservação Histórica**: T28 e T29 permanecem intactos no registro factual.

### Cenário 4: Estado Atual Mutável + Histórico Preservado
- **T31**: `fact_bridge_truce_active_008` (Trégua de verão ativa).
- **T35**: `fact_bridge_truce_broken_009` (Trégua rompida após incidente; `supersedes: fact_bridge_truce_active_008`).
- **Perguntas**:
  - *"Qual é o status atual da passagem?"* $\rightarrow$ Rompida / Hostil (`fact_bridge_truce_broken_009`).
  - *"Houve algum período em que a passagem esteve autorizada?"* $\rightarrow$ Sim, durante a trégua ativa do Turno 31 ao 35 (`fact_bridge_truce_active_008`).

---

## 4. Evidências Técnicas Automatizadas

- **Suíte Adversarial M18.6**: [tests/AdversarialLongHorizonMemory.test.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/tests/AdversarialLongHorizonMemory.test.ts) (100% PASS)
- **Suíte Longitudinal M18.5**: [tests/LongHorizonPersistence.test.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/tests/LongHorizonPersistence.test.ts) (100% PASS)
- **Suíte Adversarial M18.4**: [tests/SemanticRoleResolution.test.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/tests/SemanticRoleResolution.test.ts) (44/44 PASS)
- **Contratos Semânticos**: [tests/SemanticInputContract.test.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/tests/SemanticInputContract.test.ts) (15/15 PASS)
- **Paridade Online/Offline**: [tests/OnlineOfflineParity.test.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/tests/OnlineOfflineParity.test.ts) (25/25 PASS)
- **Suíte Geral Vitest**: `npm test` (100% PASS)
- **TypeScript**: `npx tsc --noEmit` (0 erros)
- **Build de Produção**: `npm run build` (Sucesso Vite + Server CJS)
