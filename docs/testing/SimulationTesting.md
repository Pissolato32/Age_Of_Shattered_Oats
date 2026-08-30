# Simulation Testing Documentation

This document outlines the testing strategy for the simulation engine, covering various testing layers:

## 1. Stress Tests
- Runs the simulation for a large number of ticks (e.g., 10 000, 50 000, 100 000).
- Checks deterministic invariants such as economy balances, travel day calculations, and random service seeding.
- Generates a markdown report in `logs/`.

## 2. Snapshot Generation
- Enabled with the `--snapshot` flag (or `snapshot:*` npm scripts).
- Saves a JSON snapshot every **1000 ticks** (configurable via `SNAPSHOT_INTERVAL`).
- Snapshots are stored under `logs/snapshots/` as `snapshot_<tick>.json`.

## 3. Replay Validation
- The `ReplayValidator` tool loads all snapshots, computes a SHA‑256 hash of each snapshot’s state, and verifies deterministic ordering.
- Run via `npm run snapshot:compare`.

## 4. Snapshot‑Replay Integration Test
- Executes a short snapshot run (`npm run snapshot:short`).
- Immediately validates the generated snapshots with `ReplayValidator`.
- Ensures the pipeline works end‑to‑end in CI.

## 5. Documentation & Invariants
- All test scripts are documented in `package.json` under `scripts`.
- The `docs/SimulationTesting.md` file serves as a single source of truth for developers and CI pipelines.

---

### How to Use
```bash
# Run a full stress test
npm run stress:long

# Run a short snapshot generation
npm run snapshot:short

# Validate the replay of snapshots
npm run snapshot:compare
```

> **Note**: The snapshot interval can be adjusted in `src/tools/StressTestRunner.ts` by changing the `SNAPSHOT_INTERVAL` constant.
