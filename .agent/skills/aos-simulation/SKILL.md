---
name: aos-simulation
description: Operational procedure to select the appropriate level of validation, stress tests, magnitude analysis, and long-horizon narrative simulations (SIM-001).
---

# Validation and Simulation Procedure

## Fundamental Principle of Validation
> **Simulation is not a proof of mechanical correctness.**  
> Simulations and stress tests serve to discover emergent behaviors, statistical drift, and regressions at scale. Formal guarantees of conservation properties and resource bounds are the exclusive domain of **invariant tests**.

---

## Simulation Modalities & Scopes

### 1. Mechanical Stress Tests (High-Frequency Ticks)
- **Purpose**: Validates raw throughput, loop boundaries, memory leaks, and CPU overhead over massive iterations (`10k / 50k / 100k ticks`).
- **Scope**: Internal game loops, fast batch processing, garbage collector resilience.

### 2. Statistical Magnitude Simulations (MRS)
- **Purpose**: Validates statistical distributions, dice bounds, roll spread, and formula calibrations.
- **Scope**: `magnitudeSimulation.ts`, `GenericResolutionSimulation.ts`.

### 3. Long-Horizon Campaign Simulation & Longitudinal Narrative Drift (SIM-001)
- **Purpose**: Validates full system stability and narrative drift across **1.000 turns** (1 turno = 1 semana de calendário de campanha).
- **Synthetic Archetypes**: 4 agentes sintéticos gerando intenções e ordens em linguagem natural:
  - *Builder*: Fortificações, celeiros, obras estruturais.
  - *Militarist*: Recrutamento, patrulhas de fronteira, guarnições.
  - *Diplomat*: Missivas, alianças, sondagem de casas nobres.
  - *Balanced*: Rotação integrada entre comércio, infraestrutura, defesa e conselho.
- **Narrative Telemetry**:
  - Hard Max compliance (100% das narrativas entregues dentro do teto).
  - Target range adherence (target: `>= 85%`).
  - Taxa de regeneração concisa (target: `<= 10%`).
  - Taxa de fallback seguro (target: `<= 2%`).
  - Incidência de clichês na 1ª tentativa (target: `< 5%`).
  - Repetição estrutural / n-gram repetition streak (alerta se streak `>= 15`).
- **Context & Memory Lifecycle**:
  - Salience Gate: `<= 2` memórias, `<= 2` conhecimentos, `<= 1` relação em 100% dos turnos.
  - Context tokens: Estimativa de payload de 150–350 tokens (outliers reportados).
  - Memory decay: Aplicação de decaimento temporal em registros envelhecidos.
- **Mechanical Determinism vs. LLM Variability**:
  - **Engine Replay**: 100% de paridade mecânica bit-a-bit sob mesma semente PRNG (recursos, holdings, ledger, estado).
  - **Narrativa LLM**: Avaliada por estabilidade estatística e conformidade com métricas de qualidade, sem exigir igualdade de string literal em execuções reais.

---

## Decision Matrix: Change Type → Required Validation

| Change Type | Minimum Required Validation | Commands / Tests |
| :--- | :--- | :--- |
| **Small Domain Rule** | Targeted test + related suite | `npx tsx tests/domain/<Domain>.test.ts` |
| **`engine.ts` (Loop / Orchestrator)** | Integration tests + Replay validation | `npx tsx tests/integration/*` and `npm run replay:validate` |
| **Narrative Pipeline / Prompt / LLM** | Fidelity & Discipline suites | `npx tsx tests/narrative/NAR001_NarrativeFidelity.test.ts` and `NAR002_NarrativeDiscipline.test.ts` |
| **Intent / Clarification** | Intent resolution suite | `npx tsx tests/intent/INT001_IntentResolution.test.ts` |
| **Longitudinal Drift / Memory / State** | Long-Horizon Simulation (1.000 turnos) | `npx tsx tests/simulation/SIM001_LongHorizonNarrativeDrift.test.ts` |
| **RNG / Determinism** | Deterministic replay + Magnitude simulation | `npm run replay:validate` and `npm run sim:magnitude` |
| **Combat / Statistics** | Domain tests + Magnitude simulation | `npx tsx tests/domain/CombatStatsCalculator.test.ts` and `npm run sim:magnitude` |
| **Economy / Resources** | Domain tests + Long-horizon / stress simulation | `npx tsx tests/domain/Commerce.test.ts` and `npx tsx tests/simulation/SIM001_LongHorizonNarrativeDrift.test.ts` |
| **State / Persistence** | Persistence audit + Replay validation | `npx tsx tests/M25StatePersistenceAudit.test.ts` and `npm run replay:validate` |
| **Cross-Cutting Change** | Full test suite | `npm test` |
| **Performance Optimization** | Mechanical stress test suite | `npm run stress:short` / `npm run stress:medium` / `npm run stress:long` |

---

## Command Catalog
- **Long-Horizon Simulation & Narrative Drift (SIM-001)**: `npx tsx tests/simulation/SIM001_LongHorizonNarrativeDrift.test.ts`
- **Replay Validation**: `npm run replay:validate`
- **Magnitude Simulation**: `npm run sim:magnitude`
- **Short Stress (10k ticks)**: `npm run stress:short`
- **Medium Stress (50k ticks)**: `npm run stress:medium`
- **Long Stress (100k ticks)**: `npm run stress:long`
- **Full Suite**: `npm test`
