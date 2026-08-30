# Narrative Magnitude Resolution System (MRS) v0.1 — Implementation Report

**Status:** IMPLEMENTATION COMPLETE — validated, no commit/push (working tree for review)
**Date:** 2026-08-20
**Branch:** integration/legacy-consolidation
**Prompt:** `NARRATIVE_MAGNITUDE_RESOLUTION_SYSTEM_IMPLEMENTATION_PROMPT.md` (14 sections, normative)
**Calibration source:** `NARRATIVE_MAGNITUDE_CALIBRATION_AUDIT.md` (findings A–D resolved into the frozen config)

---

## 1. Deliverables

| Artifact | Path |
|---|---|
| Frozen configuration (single source of all MRS numbers) | `src/lib/magnitudeConfig.ts` |
| Resolution core (`capacityTier` + `resolveMagnitude`) | `src/lib/magnitudeResolution.ts` |
| Contract types (`MagnitudeMode`, `MagnitudeRequest`, `ResolvedMagnitude`) | `src/lib/narrativeContracts.ts` |
| Engine wiring (policy, required-identity, MRS, report.magnitude) | `src/lib/narrativeExecution.ts` |
| Facade RNG passthrough (`resolveNarrativeCommand(command, state, rng?)`) | `src/engine.ts` |
| Mock LLM (3 magnitude modes + identity fields) | `src/lib/mockNarrativeLLM.ts` |
| Simulation tool (pure / e2e / sequential, criteria 1–9) | `src/tools/magnitudeSimulation.ts` |
| Tests | `tests/MagnitudeResolution.test.ts`, `tests/MagnitudeSimulation.test.ts` (new); `ExecutionReport.test.ts`, `MockNarrativeLLM.test.ts`, `NarrativeCycle.test.ts` (updated) |
| Simulation artifacts | `simulation/magnitude_v01_report.json`, `simulation/magnitude_v01_report.md` |

## 2. Contract changes (NARRATIVE_CONTRACT_VERSION stays 1)

- `NarrativeCommand.magnitude?: MagnitudeRequest` — `{ mode: 'ENGINE_DETERMINED' | 'FIXED' | 'RANGE', value?, min?, max? }`; additive, optional.
- `ExecutionReport.magnitude?: ResolvedMagnitude` — `{ mode, value, source, min, max }`; **present only on `ACCEPTED` reports whose `actionExecuted === 'RECRUIT'`**.
- Resolution precedence: `command.magnitude` (validated) → `parameters.quantity` (deprecated, legacy FIXED-equivalent) → absent ⇒ `ENGINE_DETERMINED`.
- `desiredOutcome` numeric extraction **removed** — prose is narrative, never mechanical (closes red-team FASE 1).
- Required-identity policy (`REQUIRED_PARAMETERS`): BUILD requires `objectId|targetId`; TRAVEL `locationId|targetId`; TRADE `objectId|targetId` — missing ⇒ `REJECTED` with a reason containing `esclarecimento` (mock narrates a clarification).

## 3. Frozen configuration (v0.1.0)

- `coefficient: 0.012` (audit §6.1), envelope `[0.75, 1.25]` (§6.2).
- Tier envelopes `[5,15] / [15,30] / [30,60] / [50,100] / [100,250]` (audit §5 table).
- Blend weights `0.40 / 0.25 / 0.15 / 0.10 / 0.10` (structural / population / labor / military / treasury).
- Thresholds: population `[1000, 2500, 5000, 10000]`, labor `[400, 1000, 2000, 4000]`, military `[100, 250, 500, 1000]`, treasury `[200, 1000, 2500, 5000]`.
- Structural: Bastion 1, Fortified Town 2, Castle 3, Walled City 4.
- Costs `3 SD + 1 labor` per soldier (canonical, ruleResolver). `weeklyCapPerUnit: 10` (§41.6).
- Capacity formula: `C = min(floor(SD / 3), laborPool, 10)`; feasibility vs `[C, C]`; engine caps never clamped by the plausibility layer.

## 4. Documented deviations

### D0 — Cap dominance is the binding constraint (accepted, per prompt §41.6)
`FIXED 23` on the default state (envelope `[15,15]`, cap 10) ⇒ **REJECTED** (never clamped). Simulation confirms: **100% of 10k/100k resolutions in every category are pinned at the weekly cap (10)**; criteria 2/3 fail by design for v0.1 states — the envelope is only reachable when the cap does not bind. Flagged as v0.2 balance candidate (criterion 9).

### D1 — maxSize room cap excluded from Layer 2
The canonical rule grows `unit.maxSize += quantity` on each recruit (per unit), so the room constraint never binds in a rule-legal sequence. Including `maxSize − size` as a Layer 2 cap would reject what the rule itself authorizes and would break the default state (60/60). Documented in the config JSDoc; the rule layer remains the sole authority over room.

### D2 — Inverted plausible envelope collapse
For extreme states where `plausible.min > finalMax` (e.g. population 100 ⇒ plausible `[0,2]` ∩ `[5,15]` = ∅), the resolution collapses to `[finalMax, finalMax]` (i.e. `2`), per the prompt's literal formula `finalMin = min(plausible.min, finalMax)`. Documented edge behavior, covered by a FACTUAL test (no config leakage).

## 5. Rejection reason strings (semantic-validator constraint)

MRS reasons must contain `RECUSADO` and **must not** contain SUCCESS_MARKER substrings (`foi autorizada`, `foi executada`, `recrutou`, `com sucesso`, etc. — `semanticValidation.ts` lines 38–49), or the validator would flag a false `STATUS_CONTRADICTION`. Implemented reasons therefore say **"nenhuma quantidade foi liberada"** (not "autorizada"). Clarification reasons contain `esclarecimento`.

## 6. Simulation methodology & results

`src/tools/magnitudeSimulation.ts` — 5 coherent category states (Aldeia/Vila/Cidade/Cidade grande/Capital, expected tiers 2/2/3/4/4), local seeds `424242 + idx × 7919`, deterministic RNG (global seed saved/restored), three variants:

1. **Pure single-action** (n resolutions per state, no weekly turn) — distribution + criteria 1–4, 6, 9.
2. **E2E sample** (`interpret → resolveNarrativeCommand → applyResolutionToState`, static command `sim-recrut`) — acceptance/rejection + no negative balance.
3. **Sequential 20 weeks** (weekly turn + recruit per week) — batch evolution, treasury floor, unit growth.
4. **Determinism check** — two `200 runs × 5 categories` snapshots, byte-identical JSON.

Final calibration run: `--runs 100000 --e2e 1000 --seq-runs 1000`:

| # | Criterion | Result |
|---|---|---|
| 1 | 0 rejected (infeasible/e2e) | **PASS** (0 / 0, 1000/1000 accepted per category) |
| 2 | median within tier envelope | **FAIL** — all medians 10 (cap-pinned; D0) |
| 3 | ≥95% within envelope | **FAIL** — 0.0% within (cap-pinned; D0) |
| 4 | max within caps | **PASS** (10 ≤ 10) |
| 5 | treasury/labor never negative | **PASS** |
| 6 | sanity (max ≤ 250) | **PASS** |
| 7 | determinism | **PASS** |
| 8 | runtime ≤ 60 s | **FAIL** — 90,122 ms (see phase breakdown) |
| 9 | cap dominance flagged | median == cap, capPinnedRate 1.000/1.000/1.000/1.000/1.000 |

- Phase times: pure 47,835 ms · e2e 23,054 ms · sequential 19,011 ms · determinism 222 ms.
- Sequential outcome: median batch 3/3/6.5/10/10; final unit sizes 129/129/193/293/300; treasury floor 0/0/0/0/8 SD.
- **Convergence**: the 10k default run and the 100k run produce identical distributions (all values 10) — the cap-pinned regime is fully converged.
- Runtime note: criterion 8 as literally stated (full target scale ≤ 60 s) is not achievable while the e2e variant pays the ~4.8 ms `searchCodex` cost per resolution (criterion 8 would need ~500k × 4.8 ms ≈ 40 min). Default CLI (10k/2k/10k) measures 241.7 s. v0.2 candidate: cache/limit codex lookup for command interpretation.

## 7. Finding E — pre-existing treasury regression (out of scope, flagged for owner)

**Symptom:** every weekly turn collapses the treasury to ≈ wages (8 SD) regardless of prior balance. Verified empirically on the default state: `SD 85 → 8` and `SD 300 → 8` after one `resolveWeeklyTurn`; the stress runner's final state is `8 SD` at any tick count.

**Evidence chain:**
- `snapshots/stress_snapshots.json` (tick 1000 = 84,800 SD … tick 10000 = 845,300 SD) shows the linear **+84.5 SD/week** used by the calibration audit §3.1/§4.1 — generated by the engine at commit `be4a243`, which correctly applied `silverdew -= totalWages`.
- Commit `b8affdc` ("feat: integrate kingdom production domain into engine") replaced that line with `s.weeklyLedger.silverdew = treasuryOutcome.expensesDeducted` (engine.ts:1059). `TreasuryService.deductExpenses` returns `expensesDeducted` = **the deducted amount** (wages), not the remaining treasury — the engine assigns it as if it were the remaining balance, resetting the treasury to ≈ wages every week.
- The regression exists in HEAD and in the working tree (git diff of engine.ts shows no change to that line); it is **not** introduced by this slice.
- `ReplayValidator` passes because it replays the recorded snapshots deterministically; it does not regenerate them.

**Impact:** the audit's +84.5 SD/week income proxy is **stale for the current engine** (historical, pre-`b8affdc`). The MRS single-action caps read the pre-turn treasury and are unaffected; the sequential variant faithfully reports what the current engine does (treasury pins at wages → batches 2–3). **Fix is out of scope** (legacy engine, zero-modification prohibitions) — flagged for the owner.

## 8. Validation evidence

- `tests/MagnitudeResolution.test.ts` — config freeze, capacity tiers, 3 modes, FIXED/RANGE validation & infeasibility (incl. `FIXED 23 → REJECTED`), determinism, no config leakage. **PASS**
- `tests/MagnitudeSimulation.test.ts` — smoke (2000 + 200 e2e): invariants, determinism, criteria 1/4/5/7. **PASS**
- `tests/ExecutionReport.test.ts` — TEST A–G + EXTRA: magnitude key-set, ACCEPTED-RECRUIT-only presence, delta correctness, semantic contradictions. **PASS**
- `tests/MockNarrativeLLM.test.ts` — FIXED 20, RANGE, ENGINE_DETERMINED without clarification, identity fields. **PASS**
- `tests/NarrativeCycle.test.ts` — scenarios A–F + non-mutation + determinism + deprecated `quantity` path via allow-list stripping. **PASS**
- Full `npm test` (14 domain/integration suites + 8 narrative suites + ReplayValidator) — **ALL PASS**.
- `npx tsc --noEmit` — 43 pre-existing baseline errors, **unchanged** (no new errors).
- Simulation artifacts regenerated at final scale: `simulation/magnitude_v01_report.json` / `.md`.

## 9. Out of scope / v0.2 backlog

- Fix Finding E (weekly treasury accumulation).
- Rebalance to escape cap dominance (raise `weeklyCapPerUnit` or reduce costs) and reach the tier envelopes.
- e2e runtime budget (codex lookup caching) to meet criterion 8 at target scale.
- Other actions (BUILD/TRAVEL/TRADE) magnitude modes.