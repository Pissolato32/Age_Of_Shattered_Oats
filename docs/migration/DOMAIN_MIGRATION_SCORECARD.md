> STATUS: HISTORICAL / SUPERSEDED
>
> This scorecard was an early, partial tracking draft covering only 3 preliminary domains with non-standardized metrics.
> It has been permanently superseded by the Central Canonical Migration Matrix.
>
> Canonical Reference: [MIGRATION_MATRIX.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MIGRATION_MATRIX.md)
>
> Discrepancy Note: The preliminary metrics below for `Narrator` (Ratio 1.0, Low coupling) were formally invalidated by [NARRATOR_MIGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/NARRATOR_MIGRATION_READINESS.md) (Actual Ratio 0.40, High/Critical coupling, resulting in domain rejection).

---

# DOMAIN_MIGRATION_SCORECARD.md (Superseded Draft)

## Migration Scorecard Overview (Historical)

This document was an initial draft for tracking migration metrics.

| Domain | Test/Source Ratio (structural test proxy) | Migration Complexity Indicator | Persistence Coupling | RNG Coupling | Status |
|---|---|---|---|---|---|
| Character | 1.2 | Medium | Low | Low | Migrated (`src/domain/character/`) |
| Narrator | 1.0 *(Invalidated: 0.40)* | Medium | Low *(Invalidated: High/Critical)* | Low | **REJECTED** (See readiness report) |
| Crime | 0.9 | High | Medium | **Uses RandomService** | PENDING |
| ... (other domains) | - | - | - | - | Consolidated in [MIGRATION_MATRIX.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MIGRATION_MATRIX.md) |

---
*Archived draft — See [MIGRATION_MATRIX.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MIGRATION_MATRIX.md) for authoritative matrix of all 16 domains.*
