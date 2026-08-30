# Narrative AI Contracts

## Scope

This document defines the contract foundation for the future flow:

`PLAYER INTENT -> AI SEMANTIC INTERPRETATION -> COMMAND -> ENGINE -> EXECUTION REPORT -> NARRATIVE CONTEXT -> AI NARRATIVE REALIZATION`

This stage does not connect an LLM to gameplay, does not change the existing narrator behavior, and does not move mechanics into AI.

## Status vocabulary

- **IMPLEMENTED**: represented by a typed executable contract and covered by a focused test.
- **PARTIALLY IMPLEMENTED**: a contract exists, but production construction, filtering, or integration is still incomplete.
- **DOCUMENTED ONLY**: the architectural rule exists but has no executable contract or complete implementation.
- **MISSING**: no current contract or implementation exists.

## Command

**Status: IMPLEMENTED as a representation contract; PARTIALLY IMPLEMENTED in gameplay integration.**

`NarrativeCommand` represents an already-interpreted player intention. It contains actor, action, optional target/object/location, optional structured `parameters` (intent parameters such as `{ quantity: 20 }`), motivation, desired outcome, constraints, confidence, ambiguity alternatives, and clarification state.

A command deliberately does not contain `decision`, `mechanicalAllowed`, state deltas, or narrative prose. It may be proposed by a semantic interpreter, but it does not authorize itself. The Engine remains responsible for validity, rule resolution, RNG, and mutation.

**`parameters` (vertical slice v0.1)**: optional, additive, contract version stays `1`. It carries **intent**, never mechanics — the interpreter may extract `quantity: 20` from *"I want to recruit 20 soldiers"* but must never compute `20 × cost`, feasibility, or probability. The Engine enforces a per-action allow-list in `src/lib/narrativeExecution.ts`: `RECRUIT` accepts only `quantity` (integer ≥ 1), `BUILD/TRAVEL/TRADE/INFORMATION/FLAVOR_QUERY` accept none; unknown keys produce the authoritative rejection `UNKNOWN_PARAMETER` and invalid values `INVALID_PARAMETER` — never silent ignoring. Resolution precedence for the recruit quantity: `command.magnitude` (MRS v0.1) → `parameters.quantity` (deprecated, legacy FIXED-equivalent) → absent ⇒ `ENGINE_DETERMINED` (MRS resolves from state; the legacy default `10` was removed).

**`magnitude` (MRS v0.1)**: optional, additive, contract version stays `1`. `MagnitudeRequest` is `{ mode: 'ENGINE_DETERMINED' | 'FIXED' | 'RANGE', value?, min?, max? }` — a declared intent, never a mechanical authorization. The Engine (`resolveMagnitude` in `src/lib/magnitudeResolution.ts`, numbers frozen in `src/lib/magnitudeConfig.ts`) validates the request, resolves the actual quantity against state capacity (`C = min(floor(SD/3), laborPool, 10)`), and rejects infeasible requests — it never clamps. `desiredOutcome` prose is never parsed for mechanics. The mock may attach `magnitude` from player wording; absence is a legitimate state (the Engine decides). `ExecutionReport.magnitude` (`ResolvedMagnitude`) is present **only** on `ACCEPTED` RECRUIT reports. Full detail in `NARRATIVE_MAGNITUDE_RESOLUTION_V0_1_IMPLEMENTATION_REPORT.md`.

The current `ParsedIntent` remains the existing limited parser output. The deterministic `MockNarrativeLLM` (`src/lib/mockNarrativeLLM.ts`) is the first interpreter producing `NarrativeCommand`s (including `parameters`) through the `NarrativeLLM` interface; no production LLM is connected yet.

## ExecutionReport

**Status: IMPLEMENTED as an Engine resolution boundary for the supported action subset; PARTIALLY IMPLEMENTED for full gameplay action coverage.**

`ExecutionReport` represents relevant consequences without serializing `CampaignState`. It contains:

- the received command identity and action;
- accepted, rejected, or ambiguous status;
- executed action;
- affected entities;
- explicit before/after state changes;
- immediate, pending, or irreversible consequences;
- authorized discovered information;
- identifiers for hidden information that must remain hidden;
- relevant structured events;
- a deterministic reason code.

State values are limited to explicit primitives. Reports contain no `any`, arbitrary JSON payload, or narrative text as a source of truth. Reports do not include timestamps, wall-clock values, or full state snapshots, supporting deterministic tests.

The Engine boundary `resolveNarrativeCommand(command, state, rng?)` (engine facade over `src/lib/narrativeExecution.ts`) is the first real producer: it consumes a `NarrativeCommand`, resolves it through the existing deterministic rules (`src/lib/ruleResolver.ts` — the same rules used by gameplay, never duplicated), applies the real mutations to a cloned state, and represents the actual consequences. `rng` is injectable for deterministic tests; it defaults to the global RNG.

The report is **deltas, facts and structured consequences — never a `CampaignState` snapshot**. There is no `beforeState`/`afterState`/`previousState`/`resultingState` embedding; each `StateChange` carries only primitive values for the specific fields the resolution touched.

Supported subset (nothing beyond what the existing rules already resolve):

- `RECRUIT` — accepted when treasury and labor suffice (cost 3 SD per soldier, one labor per soldier); rejected otherwise, including quantity `0`;
- `BUILD` — palisade construction validated against real timber/stone/silverdew holdings;
- `TRAVEL`, `TRADE`, `INFORMATION`, `FLAVOR_QUERY` — resolved by existing rules; informational commands produce accepted reports without mutation;
- `THREAT`, `INVESTIGATE`, `CRAFT`, `UNKNOWN` and commands with `requiresClarification` — authoritative rejection: no mechanic exists for them yet, and a rejection is reported as such, never converted into execution.

The existing `TurnResult` and `RuleResolutionResult` remain in place. They are not converted to `ExecutionReport` in this stage.

## KnowledgeBoundary

**Status: IMPLEMENTED as a type boundary and first runtime policy; PARTIALLY IMPLEMENTED for complete observer authorization.**

`KnowledgeTier` distinguishes:

- `WORLD_TRUTH`;
- `CHARACTER_KNOWLEDGE`;
- `PLAYER_KNOWLEDGE`;
- `RUMOR`;
- `INFERENCE`;
- `SECRET`.

`AuthorizedKnowledgeFact` intentionally excludes `WORLD_TRUTH` from its public tier type. It can represent only facts selected for an observer, with certainty, source, and optional subject identity.

The key rule is explicit:

> **AI must never receive unrestricted `CampaignState`.**

The type boundary reduces accidental exposure, but it does not yet implement all visibility, provenance, rumor, inference, or secret filters.

The current projection applies default deny. The existing `VisibilityService` calculates event timing between known hubs, but it does not identify an observer or authorize secrets. It is therefore not used as a substitute for authorization. Unrevealed secrets remain hidden until a future observer policy has sufficient metadata to authorize them.

## ObserverProjection

**Status: IMPLEMENTED as a foundation contract and first allow-list builder; PARTIALLY IMPLEMENTED for complete observer filtering.**

`ObserverProjection` is produced by `createObserverProjection()` in `src/lib/narrativeProjection.ts` and exposed through `buildObserverProjection()`. It contains only scene, actors, relationships, authorized facts, relevant events, and narrative constraints. It has no `CampaignState` field and no unrestricted world-state escape hatch.

The current Engine facade `buildNarrativeContext()` accepts an `ObserverProjection`, not a `CampaignState`. The first allow-list is implemented for the current player (`PLAYER` / `player`) and current character (`CHARACTER` / character name). Other observers receive empty actor, relationship, and fact collections plus an `unknown` scene. The complete transformation for NPC/faction knowledge remains pending and must not be replaced by a raw object spread or JSON serialization.

The projection exposes the active scene, current character, public noble-house summaries, player-visible opinions and rumors, current date, and secrets only when `revealed === true`. It deliberately omits unrevealed secret descriptions/outcomes, `isRealRumor`, raw ledgers, army details, inventories, optional `any` slices, narrative history, and unrecognized future fields.

## NarrativeContext

**Status: IMPLEMENTED as a composition contract; PARTIALLY IMPLEMENTED in production delivery.**

`NarrativeContext` is composed from an authorized `ObserverProjection` and an `ExecutionReport`. It separates:

- `scene`;
- `actors`;
- `relationships`;
- `knownFacts`;
- `recentEvents`;
- `executionResult`;
- `narrativeConstraints`.

The context is sufficient for a future narrator to express an authorized result, but the current `/api/narrate` route still receives free-form prompts. Existing behavior was intentionally left unchanged.

## Personality boundary

**Status: DOCUMENTED ONLY.**

The eight-dimensional social personality vector described by `NARRATIVE_AI_ARCHITECTURE.md` is not populated by current `CampaignState`, `CommanderAIService`, or narrator requests. The contract foundation does not invent or persist that model. A future design must separate social personality from tactical commander profiles.

## Determinism and serialization

**Status: IMPLEMENTED for the contract values.**

Contract objects use explicit primitive fields, arrays, discriminated unions, and stable identifiers. They do not contain functions, dates, random values, `any`, or arbitrary JSON. Tests verify that equivalent construction produces equivalent JSON and that a full-state-shaped object is distinct from `NarrativeContext`.

Deterministic identity generation and Engine report construction remain future integration responsibilities. Callers must supply stable IDs rather than generating IDs inside narrative code.

## Current integration boundary

```text
Player input
  -> NarrativeLLM.interpret (AI-IN; MockNarrativeLLM offline / future Gemini adapter)
  -> NarrativeCommand (structured intent, optional parameters)
  -> resolveNarrativeCommand (Engine boundary, real rules, real mutation)
  -> ExecutionReport (deltas/facts/consequences, no snapshots)
  -> Engine-authorized ObserverProjection
  -> NarrativeContext (projection + report)
  -> NarrativeLLM.narrate (AI-OUT; report-faithful prose)
  -> validateNarrativeConsistency (deterministic semantic validator)
```

The full deterministic slice is orchestrated by `runNarrativeCycle()` (`src/lib/narrativeCycle.ts`): it interprets, resolves through the Engine, composes the authorized projection/context, narrates, and validates — with zero mechanics inside the orchestrator. `ActivePlay.tsx`, existing direct mutation paths, `/api/narrate`, and current narrative text behavior remain unchanged.

## Remaining work before production LLM integration

1. Expand `resolveNarrativeCommand` coverage: produce `ExecutionReport` from authoritative Engine resolution for the remaining gameplay actions (inventory, diplomacy, espionage, combat-facing commands) as their rules mature.
2. Build observer-specific projections from `CampaignState` on the Engine side (foundation exists; NPC/faction observers still pending).
3. Add provenance and filtering rules for character knowledge, player knowledge, rumors, inferences, and secrets.
4. Add a typed narrative endpoint that accepts `NarrativeContext`, not unrestricted prompts or client-supplied authoritative state.
5. Implement a concrete Gemini adapter behind `NarrativeLLM` (model ID externalized; `NarrativeLLMError` kinds; structured output enforced).
6. Keep mechanical fidelity tests independent from semantic/narrative fidelity tests.
