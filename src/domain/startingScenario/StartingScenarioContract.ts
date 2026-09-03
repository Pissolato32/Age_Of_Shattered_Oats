/**
 * StartingScenarioContract.ts
 *
 * Mechanical facts for the deterministic campaign introduction.
 * Pure data — no mutations, no executable logic.
 */

import { Character } from '../../types';

export interface NpcProfile {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly house?: string;
  readonly disposition: string;
  readonly relationshipToPlayer: string;
  readonly backgroundNote: string;
  readonly speechStatus: 'SPEAKING' | 'SILENT';
}

export interface StartingScenarioFacts {
  readonly playerCharacterName: string;
  readonly playerHouse: string;
  readonly playerTitle?: string;
  readonly archetype: Character['archetype'];
  readonly region: string;
  readonly landmark: string;
  readonly season: string;
  readonly weather: string;
  readonly holdingType: string;
  readonly holdingName: string;
  readonly situationalPressure: string;
  readonly presentedNpcs: readonly NpcProfile[];
  readonly primarySpeaker?: NpcProfile;
  readonly silentObservers: readonly NpcProfile[];
  readonly initialContextNotes: readonly string[];
  readonly absoluteTurn: number;
}

export interface StartingScenarioResult {
  readonly facts: StartingScenarioFacts;
  readonly introNarration: string;
  readonly source: 'LLM' | 'PROCEDURAL_FALLBACK';
}
