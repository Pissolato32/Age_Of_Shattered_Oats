# DOMAIN_MIGRATION_SCORECARD.md

## Migration Scorecard Overview

This document tracks migration metrics for each legacy domain.

| Domain   | Test/Source Ratio (structural test proxy) | Migration Complexity Indicator | Persistence Coupling | RNG Coupling |
|----------|--------------------------------------------|-------------------------------|----------------------|--------------|
| Character| 1.2                                        | Medium                        | Low                  | Low          |
| Narrator | 1.0                                        | Medium                        | Low                  | Low          |
| Crime    | 0.9                                        | High                          | Medium               | **Uses RandomService** |
| ... (other domains) | - | - | - | - |

**Note:** The RNG coupling column now correctly reflects that the **Crime** domain relies on `RandomService` for its randomness, fixing the previous omission.

---
*Generated on 2026-08-20*
