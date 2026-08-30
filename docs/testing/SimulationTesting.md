# Simulation Testing Documentation [ACTIVE_SPEC]

This document outlines the testing strategy for the deterministic simulation engine, covering continuous stress testing, snapshot generation, and bit-for-bit replay validation.

---

## 1. Deterministic Test Suite
- Standard unit, domain, integration, calibration, and E2E suites are executed via:
  ```bash
  npm test
  ```
- All mechanical invariants are checked across 50+ test suites.

---

## 2. Long-Horizon Stress Tests
- Runs multi-thousand tick continuous simulation runs checking economy balances, travel mechanics, random service seeding, and memory stability:
  ```bash
  # Short run (10,000 ticks)
  npm run stress:short

  # Medium run (50,000 ticks)
  npm run stress:medium

  # Long run (100,000 ticks)
  npm run stress:long
  ```
- Detailed simulation output logs are generated under `logs/` and runtime console.

---

## 3. Snapshot Generation & Persistence
- Snapshots record state slices across execution ticks to ensure deterministic persistence:
  ```bash
  # Run 100k tick snapshot generator
  npm run snapshot:run
  ```
- Snapshots are stored under `snapshots/` or evaluated in-memory.

---

## 4. Replay Validation
- The `ReplayValidator` (`src/tools/ReplayValidator.ts`) verifies bit-for-bit determinism and reproducible state hashes:
  ```bash
  npm run replay:validate
  ```
- Ensures replay executions from identical seeds produce identical mechanical states.

---

## 5. Canonical Reference
- Test scripts and execution triggers are defined canonically in `package.json`.
- This document lives canonically at [docs/testing/SimulationTesting.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/testing/SimulationTesting.md).
