---
name: aos-narrative-pipeline
description: Guidelines and validation for the sensory projection pipeline, semantic contracts, and mechanical silence.
---

# Narrative Projection Pipeline

## Unidirectional Architectural Flow
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

## Authority and Fidelity Principles
1. **The LLM Holds Zero Mechanical Authority**:
   - The LLM acts strictly as a sensory post-processor.
   - The narrative may transform mechanical semantics into visceral, diegetic language (Iron Chronicle), but **must NEVER invent mechanical facts**, casualties, resources, or events not present or strictly implied by the authoritative `ExecutionReport` and semantic contract.

2. **Absolute Mechanical Silence**:
   - No technical data or RPG/code jargon must ever leak into the player narrative surface, including:
     - Acronyms & currencies: `SD`, `FSU`, `AC`, `XP`
     - Rule mechanics: `RNG`, `roll`, `dice`, `DCs`, `modifiers`
     - Metadata: `internal IDs`, `class/service names`, `implementation details`
   - Exception: Screens explicitly designated for debug or structured technical ledger panels (e.g. LedgerViewer).

## Contract Validation
- `npx tsx tests/NarrativeContracts.test.ts`
- `npx tsx tests/SemanticInputContract.test.ts`
- `npx tsx tests/NarrativeProjection.test.ts`
- `npx tsx tests/ExecutionReport.test.ts`
