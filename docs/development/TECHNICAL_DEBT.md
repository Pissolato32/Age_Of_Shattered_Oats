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
* `REJECT` — Audited and determined to be out of scope or working as intended.

---

## 3. Deferred Technical Findings (Proven Technical Debt)

### DEBT-001: Historical Linear Growth of `worldLedger.majorEvents`

* **Priority:** P3
* **Status:** `FIX LATER` (Deferred)
* **Canonical Owner:** `state.worldLedger.majorEvents` / [src/engine.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/engine.ts)
* **Source:** M13 Gate 4 / M14 Gate 1 & 2 Audits
* **Finding:**
  The `state.worldLedger.majorEvents` array grows monotonically as turns, succession events, expired vows, and resolved consequences are appended across the campaign lifecycle.
* **Current Impact:**
  Zero corruption, zero performance failure, zero determinism violation, and zero memory leaks observed in the 520-week (10-year) simulation and 120-action continuous tests.
* **Reason for Deferral:**
  The memory/payload growth is negligible during standard campaign durations (10–20 years). It becomes relevant primarily in multi-century campaigns (100+ years).
* **Do Not Implement Yet.**
* **Revisit Trigger:**
  When long-duration simulation (> 2,500 weeks / 50+ years) demonstrates measurable memory, JSON serialization, or narrative-context token degradation.
* **Required Invariants Before Implementation:**
  - Preserve historical truth and EventStore consistency.
  - Preserve 100% replay determinism.
  - Avoid creating a parallel event store or duplicate archiving subsystem.

---

### DEBT-002: Intra-Year Turn Indexing Calibration in `getAbsoluteCampaignTurn`

* **Priority:** P1 (Resolved)
* **Status:** `RESOLVED`
* **Canonical Owner:** `getAbsoluteCampaignTurn` / [src/engine.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/engine.ts)
* **Source:** M14 Gate 2 Audit & Campaign Time Indexing Gate
* **Finding:**
  `getAbsoluteCampaignTurn(year, week)` previously omitted the campaign month and calculated `(year - 342) * 52 + week`. In the canonical calendar where each month has 4 weeks (`week` resets from 4 to 1 each month across 12 months = 48 weeks/year), the turn index was resetting back to 1 at every month boundary instead of advancing monotonically.
* **Resolution:**
  Updated `getAbsoluteCampaignTurn(year, month, week)` to compute strictly monotonic ticks: `(year - 342) * 48 + monthIdx * 4 + safeWeek`, mapping string month names (e.g. "Frostwane", "Greening") and 1-based numeric indices to `monthIdx: 0..11`.
* **Validation:**
  Verified in `tests/integration/VisibilityEngineIntegration.test.ts` across month boundaries and full-year transitions (Week 1 -> Turn 1, Month 12 Week 4 -> Turn 48, Year 343 Month 1 Week 1 -> Turn 49), and validated across all consumers (`Relationship`, `MemoryLog`, `pendingConsequences`, `VisibilityService`, `EventStore`).

---

## 4. Future Validation & Stress Coverage (Validation Gaps)

*These items represent test-coverage and stress-validation extensions, NOT code defects.*

### VAL-001: Multi-Decade / Secular Campaign Stress Validation (50–200 Years)
* **Category:** Future Stress Coverage
* **Target:** 2,500 to 10,000 weekly turn simulation with dynastic successions, demographic turnover, and compound treasury balance tracking.

### VAL-002: Low-Frequency Subsystem Long-Run Continuous Exercise
* **Category:** Future Integration Coverage
* **Target:** Ensure low-frequency canonical services (`CommanderAIService` tactical AI, `AdventureEngine`, `MarketService` price fluctuation trends, `BreedingService`) are continuously exercised inside the interactive 1,000-cycle campaign loop.

---

## 5. Active Defect Summary

| Priority | Count | Status |
| :--- | :--- | :--- |
| **P0 (Mechanical Truth Violation)** | 0 | None active |
| **P1 (Boundary / Agency / Continuity)** | 0 | None active |
| **P2 (GM Behavior / Narrative Quality)** | 0 | None active |
| **P3 (Deferred Technical Debt / Optimization)** | 1 | DEBT-001 (Deferred) |
