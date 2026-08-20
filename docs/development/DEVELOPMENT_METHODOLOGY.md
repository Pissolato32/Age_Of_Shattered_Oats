# AI-Assisted Solo Development Methodology — Age of Shattered Oaths

> **Validity Note**: This is the current active methodology during the consolidation phase and may be revised upon completion of domain migration.

---

## 1. Overview and Core Principles

This methodology establishes the formal workflow, validation gates, and architectural discipline for the development and consolidation of the **Age of Shattered Oaths** project.

Designed specifically for the **AI-assisted solo development model (AI + Human Pair Programming)**, its purpose is to guarantee maximum code quality, 100% mechanical determinism, full documentation traceability, and complete absence of technical debt or rule duplication, without imposing unnecessary bureaucracy.

---

## 2. Process Model: Selective Scrumban & Task Workflow

Progress is managed through a continuous 9-stage workflow (Scrumban), guided by task directives, readiness specifications, and explicit human approval gates:

$$\text{BACKLOG} \longrightarrow \text{/goal} \longrightarrow \text{ANALYSIS/TRIAGE} \longrightarrow \text{READINESS AUDIT} \longrightarrow \text{HUMAN APPROVAL} \longrightarrow \text{IMPLEMENTATION PROMPT} \longrightarrow \text{IMPLEMENTING} \longrightarrow \text{VALIDATING} \longrightarrow \text{AUDITING} \longrightarrow \text{DONE}$$

### Stage Descriptions:
1. **BACKLOG**: List of requirements, feature ideas, and legacy domain candidates.
2. **`/goal`**: High-level strategic task definition specifying the overarching outcome.
3. **ANALYSIS / TRIAGE**: Technical investigation, legacy code analysis, and target gap mapping.
4. **READINESS AUDIT**: Formal specification and audit report produced in `docs/migration/` (e.g., `DOMAIN_INTEGRATION_READINESS.md`).
5. **HUMAN APPROVAL**: Explicit human authorization gate before initiating any code edits in `src/`.
6. **IMPLEMENTATION PROMPT**: Detailed execution prompt providing constraints, refresh requirements, and target boundaries.
7. **IMPLEMENTING**: Selective incremental coding (pure domain logic and Engine facades only).
8. **VALIDATING**: Execution of unit test suites, integration tests, `npm test`, `npm run build`, and `ReplayValidator.ts`.
9. **DONE**: Code committed, pushed to feature branch, and migration matrix updated.

---

## 3. AI-Assisted Task Control Protocol: `/goal` vs Detailed Execution Prompt

To ensure clarity and prevent scope creep during AI-assisted development, tasks are controlled using a strict two-part protocol:

### 3.1 `/goal` (Strategic Objective)
- **Definition**: The high-level strategic objective and desired outcome of a large or multi-stage task.
- **Answers**: *"What are we trying to accomplish?"*
- **Characteristics**: Concise, stable throughout the task duration, and high-level.
- **Example**: `/goal Consolidate the next approved legacy domain while preserving CampaignState as the single source of truth.`

### 3.2 Detailed Execution Prompt (Execution Contract)
- **Definition**: The detailed, actionable execution contract outlining technical constraints, repo refresh steps, scope boundaries, validation gates, and deliverables.
- **Answers**: *"How must this objective be executed?"*
- **Characteristics**: Highly specific, technical, self-contained, and explicit.

### 3.3 Protocol Relationship
- **`/goal` = STRATEGIC OBJECTIVE** | **Detailed Prompt = EXECUTION CONTRACT**
- The detailed prompt MUST NOT silently redefine or alter the strategic `/goal`.
- The `/goal` command MUST NOT be treated as a sufficient technical specification for complex migrations; a readiness audit and execution contract are required.

---

## 4. Repository Refresh Rule

Before generating or executing any major migration prompt, the current repository state **must be refreshed** to ensure synchronization across sessions or agent instances:

1. Execute Git verification commands: `git fetch --all --prune`, `git branch --show-current`, `git status --short`, `git log -10 --oneline`.
2. Inspect target codebase: `src/domain/`, `src/engine.ts`, `src/types.ts`, `src/data.ts`, `src/components/ActivePlay.tsx`, `tests/`, and `docs/`.
3. Verify untracked files and local tool configurations (e.g., `.agent/`).
4. **Rule**: Never rely exclusively on past audits or previous transcript context when current code differs.

---

## 5. Selective Domain-Driven Design (DDD) & Engine Architecture

To maintain code clarity and prevent both sprawling God Objects and premature micro-file fragmentation:

- **Cohesive Domain Modules**: Business rules must reside in cohesive domain files under `src/domain/<domain_name>/` (e.g., `CombatStatsCalculator.ts`, `SuccessionService.ts`, `MarketService.ts`).
- **Engine as Authoritative Facade**: `src/engine.ts` functions as the single public API facade and `CampaignState` orchestrator. It delegates pure calculation rules to domain modules rather than accumulating them.
- **Architectural Organization Rule (No Line-Count Threshold)**:
  - Do **NOT** use an arbitrary line-count threshold (such as 1,500 lines) as a mandatory rule to split `src/engine.ts`.
  - Line count may serve as a warning signal, but module extraction must be justified by genuine cohesion, reuse, testability, or dependency isolation.
  - Avoid both uncontrolled God Objects and premature micro-file fragmentation.
- **Golden Mechanical Rule**:
  $$\text{GAME ENGINE} = \text{SINGLE SOURCE OF TRUTH}$$

---

## 6. Layered Architecture and Responsibilities

$$\text{UI (ActivePlay.tsx)} \longrightarrow \text{Engine (src/engine.ts)} \longrightarrow \text{Domain (src/domain/*)} \longleftrightarrow \text{Data (src/data.ts)}$$

| Layer | File / Directory | Exclusive Responsibility | Strict Prohibitions |
|---|---|---|---|
| **Presentation (UI)** | `src/components/ActivePlay.tsx` | Visual rendering, UI state, and player intent dispatch | **PROHIBITED**: Calculating mechanical rules or making domain decisions in the UI. |
| **Facade / Orchestration** | `src/engine.ts` | Authoritative public API, `CampaignState` mutation, and orchestration | **PROHIBITED**: Concentrating pure calculation logic instead of delegating to domain modules. |
| **Pure Domain** | `src/domain/*` | 100% pure business decision functions, calculators, and sorters | **PROHIBITED**: Accessing DB, disk I/O, mutating global state, or using direct unseeded RNG. |
| **Catalogs & Data** | `src/data.ts` | Single source of truth for static spec tables, equipment data, and constants | **PROHIBITED**: Duplicating catalog constants in code or secondary JSON files. |
| **Authoritative State** | `src/types.ts` (`CampaignState`) | Single unified state container for the campaign | **PROHIBITED**: Creating parallel state slices or duplicate state representations. |

---

## 7. Determinism Guarantee

The simulation engine is **100% deterministic** to guarantee replayability, auditability, and reproducible tests.

1. **Pure Domain Modules**: Prohibits `Math.random()`, `Date.now()`, `performance.now()`, `randomUUID()`, `fs.*`, `sqlite`, or `EventStore` inside `src/domain/` files.
2. **Controlled Randomness**: When a rule requires randomness, it must be injected using the Engine's official PRNG generator (`globalRNG`) with a deterministic seed.
3. **Calculation vs. Resolution Separation**:
   $$\text{Modifier Calculation (Pure)} \neq \text{Dice Resolution (Engine PRNG)}$$
4. **Replay Gate**: The `npx tsx src/tools/ReplayValidator.ts` utility is a **mandatory validation gate** for all milestone steps.

---

## 8. Automated Validation Gates

Before any migration step or feature is marked complete, all 9 gates must pass without exception:

```
[1] Domain Unit Tests  ──► [2] Integration Tests  ──► [3] npm test (Full Suite)
                                                                 │
[6] Determinism Audit  ◄── [5] ReplayValidator.ts  ◄── [4] npm run build
         │
         ▼
[7] Duplication Audit ──► [8] Documentation Update ──► [9] Semantic Commit & Push
```

---

## 9. Human Approval Gates

To preserve project integrity and prevent over-engineering or speculative features:

- **AI Autonomy**: The AI may autonomously investigate, search code, analyze legacy files, prepare readiness specifications, write test suites, and generate documentation.
- **Mandatory Human Approval**:
  - Selection and start authorization for migrating any new domain.
  - Significant architectural decisions (e.g., structural refactoring of `src/engine.ts`).
  - Structural modifications to `CampaignState` or breaking API contracts.
- **Inclusion Criterion**: Legacy code must not be migrated simply because it exists; a **real functional gap** in the target must be demonstrated.

---

## 10. Git Workflow

1. **Working Branch**: All consolidation work takes place on the `integration/legacy-consolidation` feature branch.
2. **Branch Protection (`main`)**: The `main` branch remains **100% untouched** throughout the consolidation phase.
3. **Semantic Commits**: Small, frequent, and semantically descriptive commits (e.g., `feat: integrate kingdom production domain into engine`).
4. **Push Condition**: Executing `git push origin integration/legacy-consolidation` requires a clean working tree after all validation gates pass and reports are finalized.

---

## 11. Strict Documentation Organization

All repository documentation must strictly follow the standard directory structure:

| Directory | Documentation Type | Examples |
|---|---|---|
| `docs/migration/` | **Temporary & operational** documentation for the consolidation phase | Readiness audits, migration reports, triage, migration matrix. |
| `docs/architecture/` | **Permanent** system architecture specifications | `ARCHITECTURE_FREEZE.md`. |
| `docs/design/` | Game rules, design vision, and canonical filters | `KNOWLEDGE_FILTER.md`. |
| `docs/domains/` | PERMANENT SPECIFICATIONS for consolidated domains | Post-migration functional domain specifications. |
| `docs/testing/` | Test strategies, regression suites, and replay procedures | `SimulationTesting.md`. |
| `docs/development/` | Methodologies, development guides, and coding standards | `DEVELOPMENT_METHODOLOGY.md`. |

*Prohibitive Rule*: Never create temporary reports or audit documents in the repository root.

---

## 12. Strict Criteria for Legacy Code Migration

A legacy component is **eligible for migration** if and only if it satisfies all 6 criteria:

1. **Fills a Real Gap**: The code solves a concrete gameplay requirement in the target.
2. **Clear Single Responsibility**: It has well-defined domain boundaries.
3. **Infrastructure Decoupling**: It can be stripped of `RuntimeLogger`, SQLite, `EventStore`, and disk File I/O.
4. **Defined Integration Boundary**: It can be cleanly consumed via a simple facade function in `src/engine.ts`.
5. **Determinism & Testability**: It can be covered by pure unit tests and integration tests.
6. **Zero Duplication**: It does not introduce a second source of truth.
