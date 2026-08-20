# Documentation Audit

## 1. Legacy Documentation Structure
The legacy repository (`legacy/main`) contains 36 documentation and schema definition files organized into three primary layers:
- `docs/01_Knowledge/`: Raw YAML game data definitions (buildings, holdings, resource patches, items, mounts, ships, names, professions, simulation tables).
- `docs/02_Canon/`: Core campaign rules (`rules.yaml`) and climate data (`climate.yaml`).
- `docs/`: Root architectural specs (`ARCHITECTURE_FREEZE.md`, `KNOWLEDGE_FILTER.md`, `SimulationTesting.md`, `FEATURE_COVERAGE.yaml`).
- `docs/compiled/`: Runtime pre-compiled JSON tables generated from YAML definitions.

---

## 2. Documentation Categories

| Document / Folder | Category | Purpose & Description | Target Status |
|---|---|---|---|
| `docs/ARCHITECTURE_FREEZE.md` | Architecture | Freezes core engine tooling, RTM traceability, and milestone roadmap | Historical Reference → `docs/architecture/` |
| `docs/KNOWLEDGE_FILTER.md` | Game Design / AI | 3-Way Knowledge Filter blueprint (GM omniscient, NPC local POV, Player sensory POV) | Canonical Blueprint → `docs/design/` |
| `docs/SimulationTesting.md` | Testing | Guidelines for deterministic snapshot testing and simulation validation | Canonical Guide → `docs/testing/` |
| `docs/01_Knowledge/` | Domain / Data | YAML definitions for buildings, items, mounts, ships, names, and professions | Legacy Source (Requires Adaptation) |
| `docs/02_Canon/` | Domain / Canon | Core rules (`rules.yaml`) and climate tables (`climate.yaml`) | Legacy Source (Requires Adaptation) |
| `docs/compiled/` | Runtime Artifacts | Compiled JSON runtime data tables | Pre-compiled Data Tables |
| `*_AUDIT.md`, `*_READINESS.md`, `*_REPORT.md` | Migration | Process audits, domain selection evaluations, and post-migration reports | Active Migration Docs → `docs/migration/` |

---

## 3. Documents Worth Preserving
- **`KNOWLEDGE_FILTER.md`**: Directly maps to the project's Golden Rule (*Engine = Single Source of Truth, AI = Sensory Post-Processor*). Preserved in `docs/design/`.
- **`ARCHITECTURE_FREEZE.md`**: Provides historical context on engine milestones and RTM coverage goals. Preserved in `docs/architecture/`.
- **`SimulationTesting.md`**: Provides testing standards for determinism and replay validators. Preserved in `docs/testing/`.
- **`docs/01_Knowledge/` & `docs/02_Canon/`**: Essential data reference for game tables (buildings, items, climate, mounts).

---

## 4. Documents Requiring Adaptation
- **`FEATURE_COVERAGE.yaml`**: Must be updated to reflect current target migration status:
  - `character`: Migrated & Integrated
  - `relationship`: Migrated & Integrated (`5a345bc`)
  - `npc_ai`: Migrated & Integrated (`370f91b`)
  - `visibility`: Migrated & Integrated (`9a696ab`)
  - `narrator`: Explicitly Rejected (2-way disk mutation violation)
  - `world`: Explicitly Rejected (Engine duplication)
  - `region`: Explicitly Rejected (Disk I/O legacy)
- **Database / Repository Specs**: Specs describing SQLite schemas or TypeORM migrations must be adapted to target's in-memory `CampaignState` + deterministic Engine architecture.

---

## 5. Legacy-only Documents
- Specifications for `SqliteCharacterRepository`, `IEventStore` SQLite tables, and `StateApplicator` 2-way disk state mutation logic are classified as **Legacy-Only** and will not be migrated to the target architecture.

---

## 6. Recommended Target Documentation Structure

```text
docs/
├── architecture/     # Permanent architectural decision records (ADRs), system blueprints
├── domains/          # Pure domain specifications and business rule definitions
├── design/           # Game design specs, UI/UX guidelines, 3-way Knowledge Filter
├── development/      # Setup guides, coding standards, CLI usage
├── testing/          # Test guidelines, determinism verification, ReplayValidator specs
├── operations/       # Build pipelines, deployment scripts, server configuration
└── migration/        # Consolidation scorecards, readiness audits, domain reports
```

---

## 7. Migration Document Consolidation Matrix

All 13 migration process documents previously located in the project root are consolidated under `docs/migration/`:

| Original Location (Root) | Consolidated Location | Document Role |
|---|---|---|
| `DOMAIN_MIGRATION_SCORECARD.md` | `docs/migration/DOMAIN_MIGRATION_SCORECARD.md` | Canonical migration tracking scorecard |
| `LEGACY_DOMAIN_GRAPH.md` | `docs/migration/LEGACY_DOMAIN_GRAPH.md` | Legacy domain dependency graph |
| `SECOND_DOMAIN_REUSE_AUDIT.md` | `docs/migration/SECOND_DOMAIN_REUSE_AUDIT.md` | Relationship domain evaluation audit |
| `THIRD_DOMAIN_SELECTION_AUDIT.md` | `docs/migration/THIRD_DOMAIN_SELECTION_AUDIT.md` | NPC AI selection audit |
| `FOURTH_DOMAIN_SELECTION_AUDIT.md` | `docs/migration/FOURTH_DOMAIN_SELECTION_AUDIT.md` | Visibility selection audit |
| `NARRATOR_MIGRATION_READINESS.md` | `docs/migration/NARRATOR_MIGRATION_READINESS.md` | Narrator rejection readiness report |
| `NPC_AI_INTEGRATION_READINESS.md` | `docs/migration/NPC_AI_INTEGRATION_READINESS.md` | NPC AI readiness report |
| `NPC_AI_MIGRATION_REPORT.md` | `docs/migration/NPC_AI_MIGRATION_REPORT.md` | NPC AI migration report |
| `NPC_AI_POST_MIGRATION_AUDIT.md` | `docs/migration/NPC_AI_POST_MIGRATION_AUDIT.md` | NPC AI post-migration audit |
| `RELATIONSHIP_MIGRATION_REPORT.md` | `docs/migration/RELATIONSHIP_MIGRATION_REPORT.md` | Relationship migration report |
| `RELATIONSHIP_POST_MIGRATION_AUDIT.md` | `docs/migration/RELATIONSHIP_POST_MIGRATION_AUDIT.md` | Relationship post-migration audit |
| `VISIBILITY_INTEGRATION_READINESS.md` | `docs/migration/VISIBILITY_INTEGRATION_READINESS.md` | Visibility readiness report |
| `VISIBILITY_MIGRATION_REPORT.md` | `docs/migration/VISIBILITY_MIGRATION_REPORT.md` | Visibility migration report |
