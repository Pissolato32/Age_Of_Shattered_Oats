# MRS v0.1 - Magnitude Resolution Simulation Report

Config: RECRUITMENT_MRS_CONFIG v0.1.0
Runtime: 90122ms (target: <= 60000ms)
Phase times: pure=47835ms | e2e=23054ms | sequential=19011ms | determinism=222ms

## Acceptance criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1_0_rejected | 1_0_rejected | PASS |
| 2_median_within_envelope | 2_median_within_envelope | FAIL |
| 3_95_percent_within_envelope | 3_95_percent_within_envelope | FAIL |
| 4_max_within_caps | 4_max_within_caps | PASS |
| 5_treasury_labor_never_negative | 5_treasury_labor_never_negative | PASS |
| 6_sanity_45_1 | 6_sanity_45_1 | PASS |
| 7_determinism | 7_determinism | PASS |
| 8_runtime_60s | 8_runtime_60s | 90122ms > 60000ms |
| 9_cap_dominance_flagged | 9_cap_dominance_flagged | median==cap? true; capPinnedRate=1.000/1.000/1.000/1.000/1.000; recommended v0.2 balance candidate |

## Categories

| Category | Tier | Median | p05 | p95 | Min | Max | Cap-pinned | Within envelope | E2E accepted | E2E rejected |
|----------|------|--------|-----|-----|-----|-----|------------|-----------------|--------------|--------------|
| Aldeia | 2 | 10 | 10 | 10 | 10 | 10 | 100.0% | 0.0% | 1000/1000 | 0/1000 |
| Vila | 2 | 10 | 10 | 10 | 10 | 10 | 100.0% | 0.0% | 1000/1000 | 0/1000 |
| Cidade | 3 | 10 | 10 | 10 | 10 | 10 | 100.0% | 0.0% | 1000/1000 | 0/1000 |
| Cidade grande | 4 | 10 | 10 | 10 | 10 | 10 | 100.0% | 0.0% | 1000/1000 | 0/1000 |
| Capital | 4 | 10 | 10 | 10 | 10 | 10 | 100.0% | 0.0% | 1000/1000 | 0/1000 |

## Sequential (20 weeks)

| Category | Median batch | Treasury min (SD) | Labor exhaustion week | Final unit size | Final maxSize |
|----------|--------------|-------------------|-----------------------|-----------------|---------------|
| Aldeia | 3 | 0 | n/a (20 weeks) | 129 | 129 |
| Vila | 3 | 0 | n/a (20 weeks) | 129 | 129 |
| Cidade | 6.5 | 0 | n/a (20 weeks) | 193 | 193 |
| Cidade grande | 10 | 0 | n/a (20 weeks) | 293 | 293 |
| Capital | 10 | 8 | n/a (20 weeks) | 300 | 300 |

## Determinism: verified (200 runs x 5 categories, identical JSON)