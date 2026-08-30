# Auditoria de Delta: M18.4 — Resolução Semântica por Papéis (Semantic Role Resolution)

**Data**: 2026-08-23  
**Status**: CONCLUÍDO COM SUCESSO (100% PASS)  
**ID de Achado**: `PT-013`

---

## 1. Contexto e Motivação

Durante as verificações causais do marco M18.4, identificou-se que a abordagem puramente baseada em listas literais de palavras-chave criava um ciclo de débito semântico (*Semantic Resolution Debt*):
1. **Substantivos sequestravam intenções**: a presença de substantivos de recursos (ex: `"madeira"`) disparava erroneamente o domínio `BUILD`, mesmo quando a ação verbal era `"Adquira..."` (`TRADE`).
2. **Affordance de agentes não atuava adequadamente**: ordens a conselheiros perdiam o contexto funcional quando a ordem continha verbos indiretos.
3. **Fragilidade morfológica**: formas flexionadas ou nominais em português (`abasteça`, `edifique`, `desembolse`) exigiam adições infinitas de termos se não operassem por lemas funcionais invariantes.

---

## 2. Arquitetura Implementada

A resolução semântica offline (usada de forma idêntica pelo `MockNarrativeLLM` e pelo `GeminiNarrativeLLM.fallbackInterpret()`) foi reestruturada em 3 camadas determinísticas:

- **Camada 1: Parsing Semântico e Normalização**:
  - Extração de Agente/Endereço (`Roric`, `Aldren`, `Gerold`, `Tobin`, `Ren`, `Mara`).
  - Extração de Famílias de Lemas Funcionais com alternâncias ortográficas (`c/ç`, `c/qu`, `g/gu`).
  - Extração de Entidades (Materiais, Estruturas, Tropas, Trabalhadores) e Modificadores (Negações, Consultas, Silêncio).
- **Camada 2: Hierarquia Causal de Desempate (Semantic Arbiter)**:
  - `Ação Verbal Explícita > Papéis Semânticos Objeto/Contexto > Affordance do Agente (Desempate) > Fallback Seguro (UNKNOWN)`.
- **Camada 3: Validação Contratual e Grounding**:
  - Garantia de que `classifiedAction === actionExecuted`.
  - Silêncio mecânico absoluto na narrativa e preservação da não-mutação em consultas.

---

## 3. Matriz de Resultados

| Suíte de Testes | Casos | Status |
| :--- | :---: | :---: |
| `tests/SemanticRoleResolution.test.ts` (Adversarial + Generalização) | 40+ | ✅ 100% PASS |
| `tests/SemanticInputContract.test.ts` (Contratos e Regressões PT-001..15) | 15/15 | ✅ 100% PASS |
| `tests/OnlineOfflineParity.test.ts` (Paridade Mock vs Gemini Fallback) | 25/25 | ✅ 100% PASS |
| `npm test` (Bateria completa Vitest de todos os domínios do motor) | Todos | ✅ 100% PASS |
| `npx tsc --noEmit` (Checagem estrita de tipos TypeScript) | Zero erros | ✅ 100% PASS |
| `npm run build` (Bundle de produção Vite + Server CJS) | Sucesso | ✅ 100% PASS |

---

## 4. Estado da Campanha

- **Turnos 1 a 8**: Concluídos, auditados e persistidos em `artifacts/playtest_campaign_state.json`.
- **Turno 9**: Mantido congelado aguardando autorização após revisão desta auditoria.
