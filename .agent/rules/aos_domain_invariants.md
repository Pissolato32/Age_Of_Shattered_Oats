# Age of Shattered Oaths - Domain & Engineering Invariants

1. **Engine Authority and Mutation Provenance**:
   - `engine.ts` is the authoritative orchestrator of the system.
   - Every persistent mutation in the game state (`CampaignState`) must have deterministic and traceable provenance.
   - `worldLedger` is the canonical source of truth for the data and resources under its ownership.

2. **RNG and Determinism**:
   - All randomness must strictly utilize the canonical deterministic/seeded RNG mechanism of the engine (`RandomService`).
   - Introducing `Math.random()` or non-reproducible randomness sources into the mechanical pipeline is strictly forbidden.

3. **Structural Integrity and Type Safety**:
   - Never create parallel state or redundant fields to bypass existing structures.
   - Using `any` to bypass the type system or mask representation conflicts is strictly prohibited.
   - Never alter the semantics of an existing subsystem merely to make an isolated test pass.

4. **Preservation of Invariants in Testing**:
   - Mechanical changes must preserve all existing conservation invariants and domain business rules.
   - Tests must verify structural properties and invariants, not merely arbitrary or point-in-time outputs.

5. **Narrative Authority and Mechanical Silence**:
   - The LLM possesses zero mechanical authority and acts strictly as a sensory post-processor.
   - Narratives must faithfully reflect the authoritative `ExecutionReport` and observer projection, never inventing mechanical facts, casualties, resources, or unearned outcomes.
   - Absolute Mechanical Silence: Raw numbers, currencies/acronyms (`SD`, `FSU`, `AC`, `XP`), dice rolls, DCs, and internal identifiers must never leak into narrative prose.

6. **Mechanical Replay Determinism vs. Narrative Surface**:
   - Deterministic replay validation guarantees apply strictly to the **mechanical state** (`CampaignState`, resources, ledger, holdings, entities, events, memory stores, and PRNG trajectory), which must demonstrate 100% bit-by-bit reproducibility under an identical seed.
   - Narrative text produced by LLM providers is governed by statistical stability, structural constraints, and quality evaluator thresholds, without requiring literal string identity.
