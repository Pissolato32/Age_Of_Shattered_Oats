/**
 * MEM-003 — DefaultPropagationPolicy
 *
 * Default implementation of KnowledgePropagationPolicy.
 * Determines which agents learn what from a CampaignEvent.
 */

import type {
  CampaignEvent,
  KnowledgeRecord,
  KnowledgePropagationPolicy,
  KnowledgePropagationContext,
  KnowledgeSource,
  KnowledgeCertainty,
  KnowledgeVisibility,
} from '../contracts';

/**
 * Generate a unique knowledge record ID.
 */
let knowledgeIdCounter = 0;
function generateKnowledgeId(): string {
  return `kno_prop_${++knowledgeIdCounter}_${Date.now()}`;
}

/**
 * Determine knowledge source based on event type and visibility.
 */
function determineSource(event: CampaignEvent): KnowledgeSource {
  switch (event.type) {
    case 'PLAYER_ACTION':
      return 'DIRECT_OBSERVATION';
    case 'ENGINE_TURN':
      return 'ENGINE_REPORT';
    case 'SOCIAL_EVENT':
      return 'NPC_REPORT';
    case 'DISCOVERY_EVENT':
      return 'ESPIONAGE';
    default:
      return 'ENGINE_REPORT';
  }
}

/**
 * Determine knowledge certainty based on event significance.
 */
function determineCertainty(event: CampaignEvent): KnowledgeCertainty {
  switch (event.significance) {
    case 'CRITICAL':
    case 'HIGH':
      return 'CONFIRMED';
    case 'MEDIUM':
      return 'UNCERTAIN';
    case 'LOW':
    case 'TRIVIAL':
    default:
      return 'INFERRED';
  }
}

/**
 * Determine knowledge visibility from event visibility.
 */
function determineVisibility(event: CampaignEvent): KnowledgeVisibility {
  switch (event.visibility) {
    case 'PUBLIC':
      return 'PUBLIC';
    case 'PRIVATE':
      return 'PRIVATE';
    case 'SECRET':
      return 'SECRET';
    case 'RUMOR':
      return 'CLASSIFIED';
    default:
      return 'PUBLIC';
  }
}

/**
 * DefaultPropagationPolicy — determines what agents know from an event.
 *
 * Rules:
 * - PLAYER_ACTION + PUBLIC → player learns with CONFIRMED certainty
 * - ENGINE_TURN → world state knowledge for player
 * - DISCOVERY_EVENT → player learns via ESPIONAGE
 * - SOCIAL_EVENT → relevant agents learn via NPC_REPORT
 * - SECRET/RUMOR visibility → only agents with FULL access learn
 */
export class DefaultPropagationPolicy implements KnowledgePropagationPolicy {
  evaluate(
    event: CampaignEvent,
    context: KnowledgePropagationContext,
  ): readonly KnowledgeRecord[] {
    const records: KnowledgeRecord[] = [];

    // Skip trivial events that don't propagate
    if (event.significance === 'TRIVIAL') {
      return records;
    }

    const source = determineSource(event);
    const certainty = determineCertainty(event);
    const visibility = determineVisibility(event);

    for (const agent of context.agents) {
      // Determine if this agent should know about this event
      const shouldKnow = this.shouldAgentKnow(agent, event, visibility);
      if (!shouldKnow) continue;

      const record: KnowledgeRecord = {
        id: generateKnowledgeId(),
        agentId: agent.agentId,
        factId: `fact_event_${event.id}`,
        value: event.summary,
        source,
        certainty,
        obtainedTurn: context.currentTurn,
        lastVerifiedTurn: context.currentTurn,
        visibility,
      };

      records.push(record);
    }

    return records;
  }

  /**
   * Determine if an agent should know about an event.
   */
  private shouldAgentKnow(
    agent: { agentId: string; knowledgeAccess: 'FULL' | 'DOMAIN' | 'LIMITED' },
    event: CampaignEvent,
    visibility: KnowledgeVisibility,
  ): boolean {
    // Events without actors are world events (ENGINE_TURN, etc.)
    const isWorldEvent = event.actorIds.length === 0;
    const isActor = event.actorIds.includes(agent.agentId);
    const isSubject = event.subjectIds.includes(agent.agentId);

    // Player always knows their own actions
    if (agent.agentId === 'player' && isActor) {
      return true;
    }

    // Agents involved as subjects
    if (isSubject) {
      return true;
    }

    // World events propagate ONLY to player
    if (isWorldEvent) {
      return agent.agentId === 'player';
    }

    // Visibility-based filtering for non-world events
    switch (visibility) {
      case 'PUBLIC':
        // Everyone knows public events
        return true;
      case 'PRIVATE':
        // Only FULL access agents know private events
        return agent.knowledgeAccess === 'FULL' || isActor;
      case 'CLASSIFIED':
        // FULL and DOMAIN agents know classified
        return agent.knowledgeAccess !== 'LIMITED';
      case 'SECRET':
        // Only FULL access agents know secrets
        return agent.knowledgeAccess === 'FULL';
      default:
        return false;
    }
  }
}

/**
 * Create a DefaultPropagationPolicy.
 */
export function createDefaultPropagationPolicy(): DefaultPropagationPolicy {
  return new DefaultPropagationPolicy();
}
