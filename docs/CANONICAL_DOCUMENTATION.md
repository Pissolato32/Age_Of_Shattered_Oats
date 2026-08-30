# Canonical Documentation & Authority Model

**Age of Shattered Oaths** establishes a strict, unambiguous documentation governance and authority model. This document defines how agents and contributors determine the canonical truth across all project artifacts.

---

## 1. Documentation Authority Hierarchy

When encountering conflicting statements or differing models between artifacts, the following hierarchy of authority must be applied strictly:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. BEHAVIORAL TRUTH: Source Code & Executable Test Suite    │
│    (src/engine.ts, src/lib/*, tests/*, package.json)        │
├─────────────────────────────────────────────────────────────┤
│ 2. ARCHITECTURAL INTENT & CORE PRINCIPLES                   │
│    (AGENTS.md, docs/CANONICAL_DOCUMENTATION.md, ADRs)       │
├─────────────────────────────────────────────────────────────┤
│ 3. ACTIVE SPECIFICATIONS & CALIBRATION CONTRACTS            │
│    (docs/playtest/*_SPEC.md, docs/development/*_CONTRACTS.md│
├─────────────────────────────────────────────────────────────┤
│ 4. CANONICAL CONSOLIDATION & AUDIT MATRICES                 │
│    (docs/migration/MIGRATION_MATRIX.md, *_REPORT.md)        │
├─────────────────────────────────────────────────────────────┤
│ 5. HISTORICAL, SUPERSEDED & LEGACY ARCHIVES                 │
│    (docs/legacy/*, documents marked SUPERSEDED)             │
└─────────────────────────────────────────────────────────────┘
```

### Hierarchy Breakdown:

1. **Behavioral Truth (Authoritative for Execution)**:
   * Source code (`src/`) and executable automated tests (`tests/`) represent the absolute behavioral truth of the currently running system.
   * If a document describes an implementation detail that differs from executable tests, the code and tests determine runtime execution.

2. **Architectural Intent (Authoritative for System Design)**:
   * [AGENTS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/AGENTS.md) (Mechanical Truth System, Golden Rule, Mechanical Silence) and Active ADRs define the system's design constraints.
   * Documentation in this tier describes how the system **must** behave and the invariants it is required to satisfy.

3. **Active Specifications**:
   * Documents detailing active campaign specifications, simulation checkpoints, or calibration protocol requirements.

4. **Canonical Consolidation Matrices**:
   * Single-source migration and audit indexes (e.g. [MIGRATION_MATRIX.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MIGRATION_MATRIX.md)) that track the integration state of domains.

5. **Historical, Superseded & Legacy Archives**:
   * Artifacts marked `SUPERSEDED`, `HISTORICAL`, or located in `docs/legacy/`.
   * These files are preserved exclusively for provenance and historical reference. They **MUST NOT** be used to infer current system behavior.

---

## 2. Discrepancy Protocol: Behavioral Truth vs. Architectural Intent

A core distinction exists between **Behavioral Truth** (what the code currently does) and **Architectural Intent** (what the system is formally specified to do):

* **When Code and Tests agree with Architectural Intent:**
  The system is in full canonical alignment.
* **When Code diverges from an Architectural Invariant or Formal Specification:**
  The divergence must **NOT** be silently ignored, nor may the specification be casually rewritten to justify buggy or incomplete code without an audit.
  1. The discrepancy must be registered as an architectural/technical finding with severity and causal impact.
  2. If the specification represents a validated core invariant (e.g. *Material Mutation Invariant*), a targeted behavioral fix and regression tests must be scheduled.
  3. If the specification represents an obsolete draft or superseded assumption, the documentation must be formally reconciled or marked `SUPERSEDED`.

---

## 3. Document Classification Statuses

Every document in the `docs/` repository belongs to one of the following canonical classifications:

| Status | Meaning | Authority Level |
|---|---|---|
| `CANONICAL` | Definitive, active source of truth for the designated topic. | High (Tier 2/4) |
| `ACTIVE_SPEC` | Active design contract, playtest specification, or calibration guideline. | High (Tier 3) |
| `AUDIT_RECORD` | Immutable point-in-time assessment or audit report. | Evidentiary |
| `SUPERSEDED` | Replaced by a more recent canonical document; preserved with header note. | Non-authoritative |
| `LEGACY` | Pre-consolidation archive (lore, rules archive, pre-v1.0 models). | Non-authoritative |

---

## 4. Documentation Governance Philosophy

1. **Self-Correction & Rationale**: Documents recording metrics (such as scorecards or debt registers) reflect the **tracked governance backlog**, not proof of absence of unexamined bugs.
2. **Deterministic Golden Rule**: If a fact, resource mutation, or outcome was not computed by the deterministic engine (`src/engine.ts`), it does NOT exist in the campaign state.
3. **No Parallel Authorities**: For any given domain or subsystem, exactly one canonical index exists. Secondary scorecards are deprecated in favor of unified matrices.
