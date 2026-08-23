# AUDIT REPORT: DELTA M18.5 — LONG-HORIZON CAUSAL PERSISTENCE PLAYTEST

**Data**: 2026-08-23  
**Milestone**: M18.5 (Long-Horizon Causal Persistence & Context Blackout)  
**Status**: ✅ APROVADO COM 100% DE CONFORMIDADE  

---

## 1. Sumário Executivo

O Marco M18.5 executou uma campanha causal contínua de 27 semanas para auditar os limites fundamentais de persistência factual ao longo do tempo, independência estrita de contexto e separação epistêmica entre fatos históricos e estado atual.

A suíte executou com sucesso:
- **T09 (Semana 9)**: Investigação cautelosa da Velha Ponte por Roric (`ESPIONAGE` / `CAUTIOUS`), registrando fatos observados no `CampaignState`.
- **T10 a T19 (10 Semanas)**: Execução de 10 viradas semanais econômicas, militares, diplomáticas e de construção sem menção à ponte.
- **T20 (Semana 20)**: **Context Blackout Real** (serialização JSON, destruição de referências em memória e reinicialização completa sem histórico de chat). Recuperação de fatos com 100% de acurácia (`INFORMATION`).
- **T21 (Semana 21)**: Comparação temporal passado × presente confirmando estabilidade do estado.
- **T22 (Semana 22)**: Mutação real do mundo via tratado diplomático conduzido por Tobin (`DIPLOMACY` / `DIPLOMATIC`), alterando o status da ponte.
- **T23 a T25 (3 Semanas)**: Ações rotineiras de sustentação feudal.
- **T26 (Semana 26)**: Segundo **Context Blackout Real**. Recuperação do novo estado atualizado confirmando o tratado de passagem.
- **T27 (Semana 27)**: Separação epistêmica estrita entre o estado atual e o fato histórico original.

---

## 2. Painel de Métricas Formais

| Métrica | Meta | Resultado Obtido | Status |
|---|---|---|---|
| **Fact Recall** | 100% | **100%** | ✅ PASS |
| **False Memory (Alucinações Factuais)** | 0 | **0** | ✅ PASS |
| **Secret Leakage (Vazamento de Segredos Ocultos)** | 0 | **0** | ✅ PASS |
| **Historical Contradiction (Conflito Temporal)** | 0 | **0** | ✅ PASS |
| **Current-State Accuracy (Precisão do Estado Atual)** | 100% | **100%** | ✅ PASS |
| **Stale-State Recall (Memória Estagnada)** | 0 | **0** | ✅ PASS |
| **Context Dependence (Dependência de Chat/Histórico)** | 0 | **0** | ✅ PASS |
| **Unsupported Mechanical Mutation (Custo em Consulta)** | 0 | **0** | ✅ PASS |

---

## 3. Matriz de Execução Turno a Turno (T09–T27)

| Turno | Comando do Jogador | Ação Classificada | Resolução do Motor | Saldo Final (SD / FSU) |
|---|---|---|---|---|
| **T09** | *"Roric, investigue discretamente a Velha Ponte..."* | `ESPIONAGE` (CAUTIOUS) | `ACCEPTED` | 340.5 SD / 55.5 FSU |
| **T10** | *"Gerold, compre 10 sacas de grãos..."* | `TRADE` | `ACCEPTED` | 340.0 SD / 73.5 FSU |
| **T11** | *"Aldren, use madeira para reparar a paliçada..."* | `BUILD` | `ACCEPTED` | 304.5 SD / 79.5 FSU |
| **T12** | *"Recrute 5 homens de armas..."* | `RECRUIT` | `ACCEPTED` | 303.0 SD / 81.8 FSU |
| **T13** | *"Inspecione os livros fiscais e o tesouro..."* | `INFORMATION` | `ACCEPTED` | 316.5 SD / 85.7 FSU |
| **T14** | *"Tobin, envie mensagem formal a Riverford..."* | `DIPLOMACY` | `ACCEPTED` | 320.0 SD / 88.6 FSU |
| **T15** | *"Viajar para Central Plains em marcha..."* | `TRAVEL` | `ACCEPTED` | 333.5 SD / 90.7 FSU |
| **T16** | *"Gerold, desembolse para trazer ferro..."* | `TRADE` | `REJECTED` (Saldo mantido) | 347.0 SD / 90.3 FSU |
| **T17** | *"Aldren, reforce o portão de madeira..."* | `BUILD` | `REJECTED` (Saldo mantido) | 360.5 SD / 91.0 FSU |
| **T18** | *"Guarneça o desfiladeiro com lanceiros..."* | `MILITARY` | `REJECTED` (Saldo mantido) | 374.0 SD / 90.4 FSU |
| **T19** | *"Inspecione a prontidão geral das muralhas..."* | `INFORMATION` | `ACCEPTED` | 387.5 SD / 92.1 FSU |
| **T20** | **BLACKOUT 1**: *"O que sabemos sobre a Velha Ponte?"* | `INFORMATION` | `ACCEPTED` | 387.5 SD / 92.1 FSU |
| **T21** | *"A situação da Velha Ponte mudou?"* | `INFORMATION` | `ACCEPTED` | 387.5 SD / 92.1 FSU |
| **T22** | *"Tobin, envie delegação propondo trégua..."* | `DIPLOMACY` (DIPLOMATIC) | `ACCEPTED` | 387.5 SD / 92.1 FSU |
| **T23** | *"Compre 10 sacas de trigo para o celeiro."* | `TRADE` | `ACCEPTED` | 389.5 SD / 105.0 FSU |
| **T24** | *"Aldren, conserte as fendas da estacada."* | `BUILD` | `ACCEPTED` | 403.0 SD / 106.0 FSU |
| **T25** | *"Recrute 5 soldados."* | `RECRUIT` | `ACCEPTED` | 401.5 SD / 108.0 FSU |
| **T26** | **BLACKOUT 2**: *"Como está a situação atualmente?"* | `INFORMATION` | `ACCEPTED` | 401.5 SD / 108.0 FSU |
| **T27** | *"Qual era a situação antes da trégua?"* | `INFORMATION` | `ACCEPTED` | 401.5 SD / 108.0 FSU |

---

## 4. Evidências Técnicas Automatizadas

- **Suíte M18.5**: `tests/LongHorizonPersistence.test.ts` (100% PASS)
- **Suíte Adversarial M18.4**: `tests/SemanticRoleResolution.test.ts` (44/44 PASS)
- **Contratos Semânticos**: `tests/SemanticInputContract.test.ts` (15/15 PASS)
- **Paridade Online/Offline**: `tests/OnlineOfflineParity.test.ts` (25/25 PASS)
- **Suíte Completa Vitest**: `npm test` (100% PASS)
- **Compilador TypeScript**: `npx tsc --noEmit` (0 erros)
- **Build de Produção**: `npm run build` (Vite + Server CJS OK)
