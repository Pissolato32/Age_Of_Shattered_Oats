# AUDIT REPORT: DELTA M18.8 & M18.8.1 — REAL ONLINE LIVING WORLD EVOLUTION & PROVENANCE VALIDATION

**Data**: 2026-08-23  
**Milestone**: M18.8 & M18.8.1 (World State Evolution & Provenance-Aware Validation)  
**Provider**: Google Gemini (`gemini-3.5-flash-lite` / `gemini-3.5-flash`)  
**Modo**: Online Real sob Context Blackout Real com snapshot de 52 semanas  
**Status**: 🏆 100% APROVADO (5/5 PERGUNTAS ONLINE PASS | 100% HARD GATES)  

---

## 1. Tabela Final de Resultados das 5 Perguntas Macroscópicas

| Pergunta | Domínio | Ground Truth (52 Semanas) | Resposta do Gemini Online | Status |
|---|---|---|---|:---:|
| **P1** | *Fronteira (Velha Ponte)* | Trégua na S22 com Capitão Vane (Ironhand); emboscada na S35 rompe o pacto; posto hostil e bloqueado no inverno. | Sintetizou com precisão a trégua de verão e a subsequente quebra hostil por emboscada contra mensageiros, aprovada pela validação de proveniência sem falso positivo. | ✅ **PASS** |
| **P2** | *Feudos & Sucessão* | Morte de Lorde Decimus na S36; sucessão canônica eleva Lord Kenneth Ironhand; postura tensa/hostil. | Identificou a morte de Lorde Decimus, a ascensão do jovem Lord Kenneth e o isolamento diplomático de Ironhold. | ✅ **PASS** |
| **P3** | *Economia Regional* | Compras anônimas no leste na S26 inflacionam os grãos; rigor de inverno encarece as provisões. | Correlacionou as compras anônimas volumosas a leste com a alta abrupta na cotação de cereais e o estrangulamento das rotas. | ✅ **PASS** |
| **P4** | *Status dos Assentamentos* | Grey Keep e defesas de Raven's Watch mantidas; sem criação ou desaparecimento de feudos externos. | Declarou que os mapas mantêm estritamente a configuração original de Raven's Watch sem alucinar fundações ou extinções fictícias. | ✅ **PASS** |
| **P5** | *Controle Negativo* | Nenhuma nova casa ou assentamento registrado nos anais além dos conhecidos. | **Recusa Explícita e Afirmativa**: Declarou que os anais da chancelaria e de Kaelen calam-se sobre novos assentamentos ou casas nobres emergentes. | ✅ **PASS** |

---

## 2. Painel Consolidado de Hard Gates (M18.8 & M18.8.1)

| Métrica | Meta | Resultado Final | Status |
|---|:---:|:---:|:---:|
| **World State Recall (Ground Truth Match)** | 100% | **100%** | ✅ PASS |
| **Current State Accuracy** | 100% | **100%** | ✅ PASS |
| **Historical State Accuracy** | 100% | **100%** | ✅ PASS |
| **Succession Recall** | 100% | **100%** | ✅ PASS |
| **Economic Evolution Recall** | 100% | **100%** | ✅ PASS |
| **Settlement Evolution Recall** | 100% | **100%** | ✅ PASS |
| **Negative-Memory Violation** | 0 | **0** | ✅ PASS |
| **AUTHORIZED_FACT_ACCEPTANCE** | 100% | **100%** | ✅ PASS |
| **False Rejection Rate (Validator)** | 0% | **0%** | ✅ PASS |
| **False Acceptance Rate (Validator)** | 0% | **0%** | ✅ PASS |
| **False Memory (Alucinações)** | 0 | **0** | ✅ PASS |
| **Future-State Leakage** | 0 | **0** | ✅ PASS |
| **Context Dependence (Zero-Context)** | 0 | **0** | ✅ PASS |

---

## 3. Resolução Estrutural do Finding PT-017

- **Causa Raiz Anterior**: O validador semântico `INVENTED_ESPIONAGE` barrava a resposta por conter palavras investigativas (*"investigação comprovou"*), mesmo quando tais afirmações eram citações literais de fatos autorizados presentes em `knownFacts`.
- **Solução Canônica M18.8.1**: O validador em `semanticValidation.ts` agora verifica se afirmações investigativas se ancoram em fatos autorizados da janela temporal permitida (`KnowledgeSnapshot`), preservando a integridade das memórias sem relaxar o bloqueio a alucinações espúrias.
- **Validação Específica**: A suíte [`tests/ProvenanceAwareNarrativeValidation.test.ts`](file:///c:/Projetos/Age_Of_Shattered_Oats/tests/ProvenanceAwareNarrativeValidation.test.ts) aprovou 6/6 casos com 0% de falsa rejeição e 0% de falsa aceitação.
