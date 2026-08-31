# Development Workflow: Personal Kanban (WIP=1) & Human Playtest Gate

This rule governs the development and task lifecycle for **Age of Shattered Oaths**.

## 1. Core Principles

1. **The AI can decide HOW to implement the item; it CANNOT decide alone that the item is DONE.**
2. **The Backlog can grow at any time; WIP (Work In Progress) CANNOT.**

---

## 2. Formal State Machine

```text
                    ┌──────────────────────┐
                    │       BACKLOG        │ (Continuous registration & refinement)
                    └──────────┬───────────┘
                               │ Pull highest priority item
                               ▼
                    ┌──────────────────────┐
                    │    IN_PROGRESS       │
                    │       WIP = 1        │ (Strictly 1 active item)
                    └──────────┬───────────┘
                               │
                     Minimal implementation
                     + Proportional technical tests
                               │
                               ▼
                    ┌──────────────────────┐
                    │  TECHNICALLY_DONE    │ (Clean tsc + relevant tests passing)
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  PLAYTEST_REQUIRED   │ (AI MUST STOP and hand over to human)
                    └───────┬────────┬─────┘
                            │        │
                   Blocking │        │ Approved
                     Issue  │        │
                            ▼        ▼
                     IN_PROGRESS    DONE
```

---

## 3. State Invariants

### `BACKLOG`
- **Registration is NEVER blocked:** Any new idea, discovered edge case, desired refactor, or theoretical audit can be logged immediately into the Backlog.
- Items in Backlog do NOT consume WIP.

### `IN_PROGRESS` (WIP = 1)
- The AI works exclusively on the single active item.
- The AI is **forbidden** from starting or executing any secondary task or opening parallel milestones while `IN_PROGRESS` is occupied.
- Implementation must follow the minimal sufficient change principle.

### `TECHNICALLY_DONE`
- `tsc --noEmit` exits with 0 errors.
- Relevant existing test suites pass with 0 regressions.
- Proportional testing: New tests are written strictly for the altered behavior (no unnecessary test suites or artificial test bloat).

### `PLAYTEST_REQUIRED`
- **AI Stop Rule:** Upon reaching `TECHNICALLY_DONE`, the AI MUST STOP coding, must NOT invent speculative follow-ups, and must prompt the human user for live browser/gameplay validation.
- The item remains in WIP=1 until human playtest verdict.

---

## 4. Playtest Finding Triage Matrix

When feedback is received during `PLAYTEST_REQUIRED`:

| Finding Classification | Definition | Action & Destination |
| :--- | :--- | :--- |
| **Blocking Defect** | Prevents the direct goal of the current item from working as intended. | Remains in the current item. State transitions to `IN_PROGRESS` (WIP stays 1). |
| **Non-Blocking Finding** | Minor visual nuance, styling preference, or cosmetic tweak not impeding the core goal. | Logged into `BACKLOG`. Current item transitions to `DONE`. |
| **New Feature / Idea** | Expansion, new mechanics, or secondary enhancement. | Logged into `BACKLOG`. Current item transitions to `DONE`. |
| **Preventive Refactoring / Audit** | Theoretical cleanup or architectural review not required by current bug. | Logged into `BACKLOG`. Current item transitions to `DONE`. |
