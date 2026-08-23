import { CampaignState } from '../../types';
import { EventRecord, SceneState, SceneOutcome } from './models';
import { EventProcessingResult, processEvent } from './EventProcessor';

export interface SceneResolutionResult {
  readonly sceneOutcome: SceneOutcome;
  readonly nextSceneState: SceneState;
  readonly eventProcessingResult: EventProcessingResult;
}

/**
 * SceneResolver (M18.9-C3)
 *
 * Pure functional resolver that maps a player's interactive choice in a SceneState
 * to its explicit EventMutation[] and delegates atomic mechanical execution
 * exclusively to the EventProcessor.
 *
 * Invariants:
 * 1. Single Mechanical Authority: Only EventProcessor mutates CampaignState.
 * 2. Closed Choices: Only valid, cataloged choiceIds in the scene are accepted.
 * 3. Single Resolution: Only scenes with status 'OPEN' can be resolved.
 * 4. Fail-Closed: Any invalid choiceId or closed scene throws Error without touching state.
 * 5. Atomic & Immutable: Original scene and state remain untouched.
 * 6. Zero LLM / Zero Global State in resolution logic.
 */
export class SceneResolver {
  public static resolveSceneChoice(
    scene: SceneState,
    choiceId: string,
    event: EventRecord,
    state: CampaignState
  ): SceneResolutionResult {
    if (!scene) {
      throw new Error('SceneResolver: missing SceneState');
    }

    if (scene.status !== 'OPEN') {
      throw new Error(`SceneResolver: scene ${scene.sceneId} is not OPEN (current status: ${scene.status})`);
    }

    if (scene.eventId !== event.eventId) {
      throw new Error(`SceneResolver: scene.eventId (${scene.eventId}) does not match event.eventId (${event.eventId})`);
    }

    const chosenChoice = scene.choices.find(c => c.choiceId === choiceId);
    if (!chosenChoice) {
      throw new Error(`SceneResolver: choiceId "${choiceId}" is not a valid choice in scene ${scene.sceneId}`);
    }

    // 1. Build resolved nextSceneState (Immutable)
    const nextSceneState: SceneState = {
      ...scene,
      status: 'RESOLVED'
    };

    // 2. Build explicit SceneOutcome
    const sceneOutcome: SceneOutcome = {
      sceneId: scene.sceneId,
      status: 'RESOLVED',
      mutations: [...chosenChoice.mutations],
      chosenChoiceId: choiceId,
      timeCostApplied: chosenChoice.additionalTimeCost ?? 'NONE'
    };

    // 3. Construct deterministic resolution EventRecord linked causally to the base event
    const resolutionEventId = `evt_res_${scene.sceneId}__choice_${choiceId}`;
    const effectiveEvent: EventRecord = {
      ...event,
      eventId: resolutionEventId,
      causalParentEventId: event.eventId,
      mutations: [...chosenChoice.mutations],
      timeCost: chosenChoice.additionalTimeCost ?? event.timeCost,
      scene: nextSceneState
    };

    // 4. Delegate mechanical execution strictly to EventProcessor
    const eventProcessingResult = processEvent(effectiveEvent, state);

    return {
      sceneOutcome,
      nextSceneState,
      eventProcessingResult
    };
  }
}
