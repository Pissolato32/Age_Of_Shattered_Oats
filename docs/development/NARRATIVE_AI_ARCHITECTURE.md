# Narrative & AI Semantics Architecture Specification

## 1. Overview

This document formalizes the architectural boundary and interaction model between the **Deterministic Game Engine** (`src/engine.ts`) and the **AI Processing Layer** in *Age of Shattered Oaths*. 

This specification governs all current and future AI integrations to ensure that mechanical integrity, replay determinism, and zero-hallucination gameplay rules are strictly maintained.

---

## 2. Core Architectural Principles

### A. Engine vs. AI Responsibility Split

- **The Game Engine is the SINGLE SOURCE OF TRUTH**:
  - The Engine (`src/engine.ts`) is exclusively authoritative for all mechanical state, world state, inventory, combat calculations, travel times, resource yields, succession orders, relationship values, fog-of-war visibility, and deterministic RNG outcomes.
  - The AI **NEVER** mutates state, rolls dice, invents casualties, awards items, or modifies mechanical consequences.

- **The AI is a Sensory & Semantic Post-Processor**:
  - The AI functions as a semantic interpreter for natural language inputs and a sensorial narrator for deterministic Engine reports.
  - **Pipeline Flow**:
    ```text
    PLAYER INPUT
         ↓
    AI Semantic Intent Interpretation (Intent, Target, Stance)
         ↓
    ENGINE Authoritative Execution & State Mutation (CampaignState)
         ↓
    Deterministic Execution Report & Ledger Changes
         ↓
    AI Sensorial Narrative Realization ("Iron Chronicle" Prose)
         ↓
    PLAYER DISPLAY
    ```

---

### B. Structured Narrative Context

Future AI context delivery must use structured payloads (`NarrativeContext`) rather than raw system prompt injection.

```typescript
export interface NarrativeContext {
  scene: {
    locationId: string;
    regionName: string;
    environment: string;
    weather: string;
    season: string;
  };
  player: {
    characterId: string;
    name: string;
    title: string;
    house: string;
    traits: string[];
    currentStance?: string;
  };
  activeNpcs: Array<{
    id: string;
    name: string;
    house: string;
    relationshipOpinion: number;
    personalityTraits: Record<string, number>;
  }>;
  recentEvents: string[];
  perceivedSecrets: string[];
  narrativeConstraints: string[];
}
```

---

### C. Information & Knowledge Boundaries

To prevent AI hallucination and knowledge leakage across fog-of-war layers, the system enforces 6 explicit knowledge tiers:

1. **World Truth**: The complete, unredacted state stored in `CampaignState`. (Engine only; never sent directly to AI prompts).
2. **Character Knowledge**: Information known to a specific NPC based on their location, history, and house visibility.
3. **Player Knowledge**: Information revealed to the player via ledgers, reports, and witnessed events.
4. **Rumors & News**: Propagated events subject to spatial transmission delays and distortion (governed by `VisibilityService`).
5. **Inferences**: Deductions drawn by NPCs based on their personality and relationship traits.
6. **Secrets**: Classified facts (`WorldSecrets`) protected by fog-of-war until explicitly uncovered.

> **Golden Rule**: An NPC or narrator prompt MUST NOT receive information from *World Truth* unless that information is legitimately accessible to the observer within their *Character Knowledge* tier.

---

### D. Structured Personality & Behavioral State

NPC personality must be represented as structured numerical vectors rather than freeform prose descriptions:

- `pride`: `[0..100]`
- `aggression`: `[0..100]`
- `honesty`: `[0..100]`
- `loyalty`: `[0..100]`
- `greed`: `[0..100]`
- `fearfulness`: `[0..100]`
- `trust`: `[0..100]`
- `willingnessToNegotiate`: `[0..100]`

These parameters condition the semantic response parameters without allowing the AI to override NPC AI tactical decisions (`CommanderAIService`).

---

### E. Intent vs. Outcome Processing

Player natural language prompts are translated into structured mechanical intents before Engine execution:

- **Example Input**: *"I draw my sword and demand that Lord Harwyn tell me where my brother is held!"*
- **Parsed Semantic Intent**:
  - `intentType`: `"THREAT"`
  - `targetId`: `"npc_harwyn"`
  - `objective`: `"EXTRACT_LOCATION_INFO"`
  - `stance`: `"HOSTILE"`
- **Engine Resolution**: Engine evaluates Harwyn's fearfulness, opinion score, combat stats, and army strength, outputting a deterministic outcome code (`SUCCESS_INFO_REVEALED` or `DEFICIT_COMBAT_TRIGGERED`).
- **AI Narrative Realization**: AI narratively describes the exact outcome resolved by the Engine.

---

### F. Semantic Testing & Invariants

Semantic regression testing focuses on **semantic invariants** rather than exact string matching:

1. **No Information Leakage**: Verify an NPC prompt does not disclose hidden `WorldSecrets`.
2. **Consequence Preservation**: Verify AI narration strictly matches Engine report numbers (e.g. 50 SD lost, 15 troops killed).
3. **Relationship Consistency**: Verify hostile NPCs do not exhibit friendly dialogue without state change.
4. **Rumor Integrity**: Verify unconfirmed rumors are presented as uncertainty rather than established fact.

---

### G. Future Interactive Campaign Testing Protocol

Future campaign verification includes a conversational testing loop:

1. Engine initializes test campaign state.
2. AI renders initial scene.
3. Automated actor / tester submits natural language action.
4. AI parses semantic intent.
5. Engine resolves state transition deterministically.
6. AI narratively renders the result.

> **Note**: An LLM-only interactive simulation without Engine orchestration is **NOT** a valid test of mechanical correctness. Authoritative validation requires Engine execution at every step.
