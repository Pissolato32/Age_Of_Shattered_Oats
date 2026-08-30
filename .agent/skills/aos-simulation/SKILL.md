---
name: aos-simulation
description: Procedimento operacional para selecionar o nível adequado de validação, testes de estresse, simulação e replays determinísticos.
---

# Procedimento de Validação e Simulação

## Princípio Fundamental de Validação
> **Simulação não é prova de correção mecânica.**
> Simulações e testes de estresse servem para encontrar comportamentos emergentes, deriva estatística e regressões em escala. A garantia formal de propriedades e conservação de recursos é responsabilidade dos **testes de invariantes**.

---

## Matriz de Decisão: Mudança → Validação Necessária

| Tipo de Alteração | Validação Mínima Exigida | Comandos / Testes |
| :--- | :--- | :--- |
| **Regra de domínio pequena** | Teste específico + suite relacionada | `npx tsx tests/domain/<Domain>.test.ts` |
| **`engine.ts` (Loop / Orquestrador)** | Testes de integração + Replay | `npx tsx tests/integration/*` e `npm run replay:validate` |
| **RNG / Determinismo** | Replay determinístico + Simulação | `npm run replay:validate` e `npm run sim:magnitude` |
| **Combate / Estatísticas** | Testes de domínio + Magnitude | `npx tsx tests/domain/CombatStatsCalculator.test.ts` e `npm run sim:magnitude` |
| **Economia / Recursos** | Testes de domínio + Simulação longa | `npx tsx tests/domain/Commerce.test.ts` e `npm run stress:long` |
| **Estado / Persistência** | Auditoria de persistência + Replay | `npx tsx tests/M25StatePersistenceAudit.test.ts` e `npm run replay:validate` |
| **Alteração transversal** | Suite completa de testes | `npm test` |
| **Otimização de performance** | Suite de testes de estresse | `npm run stress:short` / `npm run stress:medium` / `npm run stress:long` |

---

## Catálogo de Comandos
- **Validação de Replay**: `npm run replay:validate`
- **Simulação de Magnitude**: `npm run sim:magnitude`
- **Stress Curto (10k ticks)**: `npm run stress:short`
- **Stress Médio (50k ticks)**: `npm run stress:medium`
- **Stress Longo (100k ticks)**: `npm run stress:long`
- **Suite Completa**: `npm test`
