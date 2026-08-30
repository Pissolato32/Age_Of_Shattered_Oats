# Protocolo de Playtest Causal e Validação Contínua

## 1. Princípios Fundamentais

1. **Mechanical Truth System (Verdade Mecânica):**
   * O que não foi computado pela Engine (`engine.ts`, `ruleResolver.ts`, `genericResolution.ts`) e gravado no ledger **não existe** no mundo da campanha.
2. **Invariante Causal:**
   * `classifiedAction === actionExecuted`. Qualquer divergência exige **interrupção imediata (STOP)** e diagnóstico causal.
3. **Proibição Estrita de Mutações Manuais:**
   * Nenhuma sessão de playtest pode alterar estados intermediários antes de chamar a Engine. Toda transição deve fluir estritamente pela cadeia:
     $$\text{Player Input} \longrightarrow \text{Classifier} \longrightarrow \text{Engine} \longrightarrow \text{Weekly Turn} \longrightarrow \text{State Persisted} \longrightarrow \text{Narrative Projection}$$
4. **Factual Grounding (Anti-Fanfiction):**
   * A narrativa não pode inventar segredos, nomes de entidades conspiradoras, baixas ou desfechos de inteligência que não estejam presentes no `ExecutionReport.discoveredInformation`.
5. **Persistência Semanal Integral:**
   * O estado gravado no disco ao fim do turno deve ser estritamente `weeklyReport.updatedState`, aplicando renda, manutenção de holdings, soldos, perdas em celeiros e avanço de data.

## 2. Tipos Canônicos de Falhas no Playtest

| Classe | Descrição | Exemplo |
| :--- | :--- | :--- |
| **A. Semantic Failure** | A intenção do jogador foi mal interpretada pelo classificador semântico. | `"Aprofunde a investigação"` $\rightarrow$ `INFORMATION` |
| **B. Resolution Failure** | A intenção foi identificada, mas a Engine resolveu outro domínio mecânico. | `classifiedAction = TRADE` $\rightarrow$ `actionExecuted = INFORMATION` |
| **C. Grounding Failure** | A Engine executou a ação, mas a narrativa inventou consequências não autorizadas. | `MILITARY SUCCESS` $\rightarrow$ narrativa afirma: *"seguiram o mensageiro até Ironpeak"* |

## 3. Ciclo de Resolução de Desvios

$$\text{Ocorrência} \longrightarrow \text{Diagnóstico} \longrightarrow \text{Registro em PLAYTEST\_FINDINGS.md} \longrightarrow \text{Correção Mínima} \longrightarrow \text{Teste de Regressão} \longrightarrow \text{Reexecução Causal}$$
