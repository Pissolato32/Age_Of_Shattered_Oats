# MRS v0.1 - Magnitude Resolution Simulation Report

Config: RECRUITMENT_MRS_CONFIG v0.2.0
Runtime: 55160ms (target: <= 60000ms)
Phase times: pure=6020ms | e2e=43986ms | sequential=4886ms | determinism=268ms

## Acceptance criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1_0_rejected | 1_0_rejected | PASS |
| 2_median_within_envelope | 2_median_within_envelope | PASS |
| 3_95_percent_within_envelope | 3_95_percent_within_envelope | PASS |
| 4_max_within_caps | 4_max_within_caps | PASS |
| 5_treasury_labor_never_negative | 5_treasury_labor_never_negative | PASS |
| 6_sanity_45_1 | 6_sanity_45_1 | PASS |
| 7_determinism | 7_determinism | PASS |
| 8_runtime_60s | 8_runtime_60s | PASS |
| 9_cap_dominance_flagged | 9_cap_dominance_flagged | medianWithinEnvelope=true; capPinnedRate=0.000/0.000/0.000/0.000/0.000; v0.2 contextual scaling verified |

## Categories

| Category | Tier | Median | p05 | p95 | Min | Max | Cap-pinned | Within envelope | E2E accepted | E2E rejected |
|----------|------|--------|-----|-----|-----|-----|------------|-----------------|--------------|--------------|
| Aldeia | 2 | 15 | 15 | 15 | 15 | 15 | 0.0% | 100.0% | 2000/2000 | 0/2000 |
| Vila | 2 | 17 | 15 | 18 | 15 | 18 | 0.0% | 100.0% | 2000/2000 | 0/2000 |
| Cidade | 3 | 37 | 30 | 45 | 30 | 45 | 0.0% | 100.0% | 2000/2000 | 0/2000 |
| Cidade grande | 4 | 63 | 51 | 74 | 50 | 75 | 0.0% | 100.0% | 2000/2000 | 0/2000 |
| Capital | 4 | 95 | 90 | 100 | 90 | 100 | 0.0% | 100.0% | 2000/2000 | 0/2000 |

## Sequential (20 weeks)

| Category | Median batch | Treasury min (SD) | Labor exhaustion week | Final unit size | Final maxSize |
|----------|--------------|-------------------|-----------------------|-----------------|---------------|
| Aldeia | 15 | 124.5 | n/a (20 weeks) | 322 | 322 |
| Vila | 16 | 330.5 | n/a (20 weeks) | 364 | 364 |
| Cidade | 35 | 1017.5 | n/a (20 weeks) | 790 | 790 |
| Cidade grande | 55 | 2732 | n/a (20 weeks) | 1233 | 1233 |
| Capital | 95 | 9426 | n/a (20 weeks) | 2002 | 2002 |

## Determinism: verified (200 runs x 5 categories, identical JSON)