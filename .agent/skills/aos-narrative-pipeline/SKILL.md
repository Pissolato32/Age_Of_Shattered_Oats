---
name: aos-narrative-pipeline
description: Diretrizes e validação do fluxo de projeção sensorial, contratos semânticos e silêncio mecânico.
---

# Pipeline de Projeção Narrativa

## Fluxo Arquitetural Unidirecional
```
Engine
  ↓
ExecutionReport / Semantic Contract
  ↓
Narrative Projection
  ↓
LLM (Sensory Translation)
  ↓
Post-Processor
  ↓
Narrative Output
```

## Princípios de Autoridade e Fidelidade
1. **O LLM Não Possui Autoridade Mecânica**:
   - O LLM atua estritamente como pós-processador sensorial.
   - A narrativa pode transformar a semântica mecânica em linguagem diegética e visceral (Iron Chronicle), mas **nunca pode inventar fatos mecânicos**, baixas, recursos ou eventos que não estejam presentes ou estritamente implicados pelo `ExecutionReport`/contrato semântico.

2. **Silêncio Técnico Absoluto**:
   - Nenhum dado técnico ou jargão de RPG/código pode vazar para a superfície narrativa do jogador, incluindo:
     - Siglas e moedas: `SD`, `FSU`, `AC`, `XP`
     - Mecânicas de regras: `RNG`, `roll`, `dados`, `DCs`, `modificadores`
     - Metadados: `IDs internos`, `nomes de classes/serviços`, `detalhes de implementação`
   - Exceção: Telas explicitamente reservadas para debug ou painéis técnicos estruturados (ex: Ledger).

## Validação de Contratos
- `npx tsx tests/NarrativeContracts.test.ts`
- `npx tsx tests/SemanticInputContract.test.ts`
- `npx tsx tests/NarrativeProjection.test.ts`
- `npx tsx tests/ExecutionReport.test.ts`
