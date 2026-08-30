import { NarrativeAction, NarrativeCommand } from '../../lib/narrativeContracts';
import { CampaignState } from '../../types';
import { CharacterLifecycleService } from '../../domain/character/CharacterLifecycle';

export interface SemanticValidationResult {
  readonly jsonValid: boolean;
  readonly schemaValid: boolean;
  readonly semanticValid: boolean;
  readonly engineSafe: boolean;
  readonly parsedCommand?: Partial<NarrativeCommand>;
  readonly entityFound?: boolean;
  readonly characterAlive?: boolean;
  readonly isDeadCharacterRejection?: boolean;
  readonly errors: readonly string[];
}

export const ALL_VALID_ACTIONS: ReadonlySet<string> = new Set<string>([
  'RECRUIT',
  'BUILD',
  'TRAVEL',
  'TRADE',
  'DIPLOMACY',
  'ESPIONAGE',
  'MILITARY',
  'SOCIAL',
  'INTRIGUE',
  'EXPLORATION',
  'CRAFT',
  'THREAT',
  'INVESTIGATE',
  'INFORMATION',
  'FLAVOR_QUERY',
  'UNKNOWN'
]);

export class SemanticValidator {
  /**
   * World-Aware Intent Validation: evaluates schema, domain constraints, entity grounding,
   * and character lifecycle (alive vs dead, role history).
   */
  public static validateIntentResponse(
    rawText: string,
    expected?: {
      action?: NarrativeAction;
      targetId?: string;
      requiresClarification?: boolean;
      expectedDeadCharacter?: boolean | string;
    },
    worldState?: CampaignState
  ): SemanticValidationResult {
    const errors: string[] = [];
    let jsonValid = false;
    let schemaValid = false;
    let semanticValid = false;
    let engineSafe = true;
    let entityFound: boolean | undefined = undefined;
    let characterAlive: boolean | undefined = undefined;
    let isDeadCharacterRejection = false;
    let parsedCommand: any = null;

    // 1. JSON Parsing
    try {
      let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      parsedCommand = JSON.parse(cleaned);
      jsonValid = true;
    } catch (err: any) {
      errors.push(`Invalid JSON: ${err?.message || err}`);
      return {
        jsonValid: false,
        schemaValid: false,
        semanticValid: false,
        engineSafe: true,
        errors
      };
    }

    // 2. Engine Safety Invariant (LLM must NEVER simulate rolls, casualties, outcomes, or state mutations)
    const forbiddenEngineFields = [
      'soldiersSent',
      'enemyStrength',
      'casualties',
      'success',
      'outcome',
      'diceRoll',
      'roll',
      'resolvedSilverdew',
      'stateMutation'
    ];

    for (const field of forbiddenEngineFields) {
      if (parsedCommand[field] !== undefined) {
        engineSafe = false;
        errors.push(`Engine safety violation: LLM generated mechanical resolution field '${field}'`);
      }
    }

    // 3. Schema Validation
    const action = typeof parsedCommand.action === 'string' ? parsedCommand.action.trim().toUpperCase() : undefined;
    if (!action) {
      errors.push(`Schema violation: missing required 'action' field`);
    } else if (!ALL_VALID_ACTIONS.has(action)) {
      errors.push(`Schema violation: invalid action '${action}', must be in ALL_VALID_ACTIONS`);
    } else {
      schemaValid = true;
    }

    if (parsedCommand.confidence !== undefined && (typeof parsedCommand.confidence !== 'number' || parsedCommand.confidence < 0 || parsedCommand.confidence > 1)) {
      errors.push(`Schema violation: confidence must be a number between 0.0 and 1.0`);
      schemaValid = false;
    }

    // 4. World-Aware Grounding and Character Lifecycle Verification
    if (schemaValid) {
      semanticValid = true;

      if (worldState) {
        const targetName = parsedCommand.targetId || parsedCommand.objectId;
        if (targetName && typeof targetName === 'string') {
          const char = CharacterLifecycleService.findCharacter(targetName, worldState);
          if (char) {
            entityFound = true;
            characterAlive = CharacterLifecycleService.isAlive(char);

            // If action is ordered to/from a deceased character
            if (!characterAlive) {
              isDeadCharacterRejection = true;
              // Unless it is a historical query (action === 'INFORMATION')
              if (action !== 'INFORMATION') {
                semanticValid = false;
                errors.push(`Lifecycle error: Character '${char.name}' is dead (death at turn ${char.death?.turn}) and cannot perform active command '${action}'`);
              }
            }
          }
        }
      }

      if (expected?.action && action !== expected.action) {
        semanticValid = false;
        errors.push(`Semantic mismatch: got action '${action}', expected '${expected.action}'`);
      }
      if (expected?.targetId && parsedCommand.targetId !== expected.targetId && parsedCommand.locationId !== expected.targetId) {
        semanticValid = false;
        errors.push(`Semantic mismatch: target mismatch, got '${parsedCommand.targetId || parsedCommand.locationId}', expected '${expected.targetId}'`);
      }
      if (expected?.requiresClarification !== undefined && Boolean(parsedCommand.requiresClarification) !== expected.requiresClarification) {
        semanticValid = false;
        errors.push(`Semantic mismatch: requiresClarification mismatch`);
      }
    }

    return {
      jsonValid,
      schemaValid,
      semanticValid,
      engineSafe,
      parsedCommand: parsedCommand as Partial<NarrativeCommand>,
      entityFound,
      characterAlive,
      isDeadCharacterRejection,
      errors
    };
  }
}
