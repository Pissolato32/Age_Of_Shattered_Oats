# Design Document: Three-Way Knowledge Filter & Context Separation

This document specifies the blueprint for future implementation of the **Knowledge Filter** pattern, separating the dynamic context generation into three isolated, role-specific prompts: **Game Master (GM)**, **Non-Player Character (NPC)**, and **Player Narrative (POV)**.

## Conceptual Architecture

```text
                           Engine (Database)
                                  │
                                  ▼
                          [Knowledge Filter]
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
  GM Context                  NPC Context               Player Context
(Global / Sem Filtro)      (Local / POV do NPC)       (Visível / Sem Números)
- Visão Omnisciente        - Apenas eventos locais     - Geografia e tempo reais
- Atributos e Segredos     - Personalidade e Memórias  - Sem AC, Lealdade ou HP
- Arbitragem pura          - Diálogos limitados        - Narração Imersiva
```

---

## 1. GM Context (Omniscient / Arbitrator)

The Game Master requires absolute, global access to all parameters to enforce rules and guide narrative events.

### Information Scope
- **Visibility**: 100% of holdings, characters, and events (no geographic distance delay or stealth filtering).
- **Secrets**: Exposes raw numeric parameters (e.g. `opinion: -2`, `loyalty: 4`, `armorClass: 5`), hidden items, assassin coordinates, and upcoming events.

### Compiler Prompt Template
```text
Role: Game Master (GM)
Tone: Objective, systemic, rules-oriented.
Context Data:
  - Global world status
  - Raw system statistics (AC, Loyalty, OP, HP)
  - Upcoming secret timelines & events
Instructions: Focus on arbitrating mechanical outcomes, verifying invariants, and updating database projections.
```

---

## 2. NPC Context (Local / Roleplaying)

NPCs must take actions based strictly on what they locally know, preventing metagame knowledge leakages.

### Information Scope
- **Visibility**: Filtered to local holdings and characters visible at the NPC's location.
- **Timeline**: Only historical events that took place in the NPC's vicinity or were reported to them via a `RiderArrivedWithReport` event.
- **Self Profile**: Includes the NPC's own memories, current mood/disposition, combat priorities (Temperament/Priority), and allegiance hooks.

### Compiler Prompt Template
```text
Role: NPC Roleplay Character [NPC_Name]
Tone: Immersive first-person / third-person, constrained by personality.
Context Data:
  - Local visible surroundings only
  - Private memories & relationships
  - Personality: [Temperament], Priority: [Priority]
Instructions: Act and speak ONLY with the local knowledge provided. Do not reference secret events or metadata you did not personally witness.
```

---

## 3. Player Narrative Context (POV Immersive)

Describes the world to the human player through a third-person limited POV (Point of View), maximizing immersion.

### Information Scope
- **Visibility**: Strictly limited to geographical visibility ranges and River/Road travel delays.
- **Confidentiality**: All numerical statistics (such as `AC`, `HP`, `Loyalty` ranks, or exact relationship numbers) are stripped from the payload or translated into descriptive tags (e.g. "heavily armored", "skeptical", "healthy").

### Compiler Prompt Template
```text
Role: POV Narrator
Tone: Dark, gritty, low-fantasy, sensory descriptions.
Context Data:
  - Geographic visibility-filtered holdings & characters
  - Non-numeric descriptions (no raw numbers, no HP/AC/Loyalty stats)
Instructions: Describe the scene to the player in a third-person limited POV. End by returning agency with a contextual prompt.
```
