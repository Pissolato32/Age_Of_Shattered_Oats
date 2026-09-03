---
name: aos-narrative-pipeline
description: Guidelines and validation for the sensory projection pipeline, semantic contracts, mechanical silence, epistemic fidelity, and narrative discipline (NAR-001/NAR-002).
---

# Narrative Projection & Discipline Pipeline

## Architectural Flow (NAR-001 & NAR-002)

```text
Engine / Intent Resolution (interpretIntentHeuristically)
  ↓
ExecutionReport / ObserverProjection
  ↓
Salience Gate (filterContextBySalience — Context Budget <= 2 mems, <= 2 facts, <= 1 rel)
  ↓
LLM.narrate() (Sensory Translation with Action Category Budget)
  ↓
NarrativeJudge & NarrativeQualityEvaluator (Mechanical Silence, Grounding, Clichés, Hard Max)
  ↓
Controlled Regeneration (Attempt 2) / Deterministic Safe Fallback (buildSafeFallbackNarrative)
  ↓
Crônica Output (Strict Hard Max Enforcement — UI Gate)
```

## Authority and Epistemic Fidelity (NAR-001)

1. **Zero Mechanical Authority**:
   - The LLM acts strictly as a sensory post-processor.
   - The narrative may transform mechanical semantics into visceral, diegetic language (Iron Chronicle), but **must NEVER invent mechanical facts**, casualties, resources, or events not present or strictly implied by the authoritative `ExecutionReport`.

2. **Axioma Epistêmico de Ouro**:
   - A narrativa nunca pode afirmar como fato aquilo que a projeção disponível ao observador não sustenta.
   - Separação epistêmica estrita: fato observado, informação recuperada, inferência permitida, rumor, desconhecimento e flavor sensorial.
   - Em relatórios `REJECTED`: proibição estrita de antecipar tratados/banquetes futuros, criar desculpas fictícias divergentes do código autoritativo de recusa, ou alucinar sucesso material.

3. **Absolute Mechanical Silence**:
   - No technical data or RPG/code jargon must ever leak into the player narrative surface, including:
     - Acronyms & currencies: `SD`, `FSU`, `AC`, `XP`
     - Rule mechanics: `RNG`, `roll`, `dice`, `DCs`, `modifiers`
     - Metadata: `internal IDs`, `class/service names`, `implementation details`
   - Exception: Screens explicitly designated for debug or structured technical ledger panels (e.g. `LedgerViewer`).

## Narrative Discipline & Salience (NAR-002)

1. **Salience Gate (Context Filtering)**:
   - **Contexto Disponível ≠ Contexto Narrativamente Relevante**.
   - `filterContextBySalience`: poda nobreza externa e memórias espúrias em ações mecânicas (`BUILD`, `RECRUIT`, `TRAVEL`, `MILITARY`, `HARVEST`).
   - Mantém estritamente a relação e memória da entidade-alvo em ações diplomáticas/sociais.
   - Budget de contexto injetado: `<= 2` memórias, `<= 2` conhecimentos, `<= 1` relação (target: 150–350 tokens).

2. **Word Budgets & Hard Max Enforcement**:
   - Limites calibrados por categoria em `ACTION_NARRATIVE_BUDGETS`:
     - **MECHANICAL**: Target 35–65 palavras | Hard Max: **85 palavras**
     - **COMMERCE**: Target 30–55 palavras | Hard Max: **75 palavras**
     - **DIPLOMACY**: Target 50–90 palavras | Hard Max: **110 palavras**
     - **INFORMATION**: Target 40–80 palavras | Hard Max: **100 palavras**
     - **REJECTION**: Target 25–45 palavras | Hard Max: **60 palavras**
   - **Regra de Ouro da Interface**: Texto que ultrapassa o Hard Max **NUNCA chega à UI**.

3. **Detecção de Clichês**:
   - `FORBIDDEN_CLICHE_PATTERNS` bloqueia preâmbulos poéticos decorativos (*"O vento gélido...", "Sob o céu cinzento...", "As sombras se alongam...", "Com o peso de antigos juramentos..."*).

4. **Ciclo de Recuperação em Duas Camadas**:
   - `Attempt 1`: Geração padrão orientada pelo orçamento da categoria.
   - `NarrativeJudge`: Valida concisão, ausência de clichês, silêncio mecânico e factual grounding.
   - `Attempt 2`: Se houver violação, dispara regeneração concisa forçada (`REGENERAÇÃO CONCISA:`).
   - `Fallback Seguro`: Se persistir violação na 2ª tentativa, ativa `buildSafeFallbackNarrative` determinístico e grounded.

## Test & Validation Suites

- `npx tsx tests/narrative/NAR001_NarrativeFidelity.test.ts` (Fidelidade, silêncio e limites epistêmicos)
- `npx tsx tests/narrative/NAR002_NarrativeDiscipline.test.ts` (Saliência, budgets, detecção de clichês e regeneração)
- `npx tsx tests/intent/INT001_IntentResolution.test.ts` (Resolução semântica, clarificação e Drift Guard)
- `npx tsx tests/NarrativeCycle.test.ts` (Ciclo de integração ponta a ponta)
- `npx tsx tests/NarrativeContracts.test.ts`
- `npx tsx tests/NarrativeProjection.test.ts`
- `npx tsx tests/ExecutionReport.test.ts`
