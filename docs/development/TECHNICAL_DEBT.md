# Technical Debt and Deferred Findings

This document is the canonical repository backlog for verified technical findings, architectural observations, and deferred items identified during audits, simulations, and milestone gates that are intentionally not being implemented immediately.

---

## 1. Governance Rules

1. **Evidence-Based Only:** Only document findings supported by concrete repository code, benchmark results, or reproducible audit traces. Speculative features or hypothetical concerns must never be recorded here.
2. **Canonical Ownership:** Every finding must explicitly identify its canonical component owner (`src/` path, state slice, or contract).
3. **No Automatic Implementation:** The mere presence of an item in this document does NOT authorize writing code to fix it.
4. **Milestone Relevance:** A deferred item may only be implemented when its priority (`P0`–`P3`) or a scheduled milestone makes it directly relevant.
5. **Verified Resolution:** An item is removed or marked as resolved only after automated tests demonstrate that the underlying issue is fixed without side effects.
6. **No Duplication:** This document is the single source of truth for technical debt in Age of Shattered Oaths.

---

## 2. Classification Matrix

### Priority Levels
* **P0 — Critical:** Violates Mechanical Truth, corrupts state, or breaks core engine execution. (Fix immediately).
* **P1 — High:** Knowledge-boundary violation, campaign continuity failure, or player agency usurpation. (Must be resolved before next milestone release).
* **P2 — Medium:** Measurable narrative quality degradation, edge-case resolver inconsistency, or observable GM behavioral defect.
* **P3 — Low / Optimization:** Technical optimization, retention policies, long-term scalability, or non-blocking calibration.

### Disposition Status
* `FIX NOW` — Scheduled for immediate implementation in current gate.
* `FIX LATER` — Verified technical debt deferred to a future milestone when impact becomes relevant.
* `OBSERVE` — Potential future bottleneck or validation gap; requires metric monitoring before code changes.
* `RESOLVED` — Audited, implemented, and verified by automated tests.

---

## 3. Deferred Technical Findings & Audit Resolutions

### DEBT-001: Historical Linear Growth of `worldLedger.majorEvents`

* **Priority:** P3
* **Status:** `OBSERVE` (Verified: 10,000-turn simulation footprint is 44.27 KB)
* **Canonical Owner:** `state.worldLedger.majorEvents` / [src/engine.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/engine.ts)
* **Source:** M13 Gate 4 / M14 Gate 1 & 2 Audits / HistoricalLifecycleStress Test
* **Finding:**
  The `state.worldLedger.majorEvents` array grows monotonically as turns, succession events, expired vows, and resolved consequences are appended across the campaign lifecycle.
* **Empirical Validation:**
  In `tests/domain/HistoricalLifecycleStress.test.ts`, a full 10,000-turn simulation with successions, events, and treaty recording grew from 15.38 KB (Turn 1) to 44.27 KB (Turn 10,000).
* **Conclusion:**
  Payload growth is negligible. Aggressive historical compaction is deferred until multi-century campaigns demonstrate token or performance degradation.

---

### DEBT-002: Intra-Year Turn Indexing Calibration in `getAbsoluteCampaignTurn`

* **Priority:** P1 (Resolved)
* **Status:** `RESOLVED`
* **Canonical Owner:** `getAbsoluteCampaignTurn` / [src/engine.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/engine.ts)
* **Resolution:**
  Updated `getAbsoluteCampaignTurn(year, month, week)` to compute strictly monotonic ticks: `(year - 342) * 48 + monthIdx * 4 + safeWeek`.

---

### DEBT-003: M26 — LLM / Engine Authority & Billing Guard Integrity

* **Priority:** P0 (Resolved)
* **Status:** `RESOLVED`
* **Canonical Owner:** [src/llm/validators/BillingGuard.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/llm/validators/BillingGuard.ts), [src/lib/gameplayPipeline.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/lib/gameplayPipeline.ts), [src/llm/adapters/UnifiedNarrativeLLM.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/llm/adapters/UnifiedNarrativeLLM.ts)
* **Source:** M26 Architectural Audit
* **Resolutions:**
  1. **Strict CostStatus Verification:** Updated `BillingGuard.assertZeroCost` to reject `COST_UNVERIFIED` in strict billing mode and reject any cost > $0.00.
  2. **CLI Argument Parsing:** Added `--billing=strict` and `--billing=free-tier` in [LLMBenchmarkRunner.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/tools/LLMBenchmarkRunner.ts).
  3. **Fallback Candidate Validation:** Ensured every fallback model passes `BillingGuard.assertFreeModel` before invocation in `ModelRegistry` and adapters.
  4. **Unified Production Pipeline Bridge:** Created [UnifiedNarrativeLLM.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/llm/adapters/UnifiedNarrativeLLM.ts) connecting `server.ts` directly to canonical `LLMAdapter` and `BillingGuard`.
  5. **Defensive Hash-Based State Integrity:** Fixed [gameplayPipeline.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/lib/gameplayPipeline.ts) to verify `hashBefore !== hashAfter` on mutations and `hashBefore === hashAfter` on non-mutating actions.
  6. **Typed Historical Model:** Explicitly typed `historicalCharacters` and `genealogy` in [src/types.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/types.ts), removing `as any` casts.
  7. **Roster Reload Invariant:** Fixed [HistoricalLifecycleStress.test.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/tests/domain/HistoricalLifecycleStress.test.ts) to re-acquire the deserialized roster reference after every `JSON.parse` cycle.
  8. **CI Workflow:** Added [.github/workflows/ci.yml](file:///c:/Projetos/Age_Of_Shattered_Oats/.github/workflows/ci.yml) for automated lint, unit tests, mock benchmarks, and security validations.

---

## 4. Active Defect Summary

| Priority | Count | Status |
| :--- | :--- | :--- |
| **P0 (Mechanical Truth Violation)** | 0 | None active |
| **P1 (Boundary / Agency / Continuity)** | 0 | None active |
| **P2 (GM Behavior / Narrative Quality)** | 0 | None active |
| **P3 (Deferred Technical Debt / Optimization)** | 1 | DEBT-001 (Deferred / Observed) |
