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
