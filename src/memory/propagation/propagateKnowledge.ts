/**
 * MEM-003 — propagateKnowledge
 *
 * Orchestrator that evaluates propagation policies for a CampaignEvent
 * and writes the resulting KnowledgeRecords to the KnowledgeStore.
 */

import type {
  CampaignEvent,
  KnowledgePropagationPolicy,
  KnowledgeRecord,
  KnowledgeStore,
} from '../contracts';
import type { AgentRegistry } from './AgentRegistry';
import { DefaultPropagationPolicy } from './DefaultPropagationPolicy';

export interface PropagationResult {
  readonly eventId: string;
  readonly recordsCreated: number;
  readonly records: readonly KnowledgeRecord[];
}

export interface PropagateKnowledgeOptions {
  readonly policies?: readonly KnowledgePropagationPolicy[];
}

/**
 * propagateKnowledge — evaluate policies and write KnowledgeRecords.
 *
 * This is the main entry point for knowledge propagation.
 * It evaluates all provided policies (or the default) and writes
 * the resulting KnowledgeRecords to the KnowledgeStore.
 */
export function propagateKnowledge(
  event: CampaignEvent,
  agentRegistry: AgentRegistry,
  knowledgeStore: KnowledgeStore,
  currentTurn: number,
  options: PropagateKnowledgeOptions = {},
): PropagationResult {
  const policies = options.policies ?? [new DefaultPropagationPolicy()];
  const allRecords: KnowledgeRecord[] = [];

  const context = {
    agents: agentRegistry.getKnowledgeProfiles(),
    currentTurn,
  };

  for (const policy of policies) {
    const records = policy.evaluate(event, context);
    for (const record of records) {
      // Write to KnowledgeStore
      knowledgeStore.add({
        agentId: record.agentId,
        factId: record.factId,
        value: record.value,
        source: record.source,
        certainty: record.certainty,
        obtainedTurn: record.obtainedTurn,
        lastVerifiedTurn: record.lastVerifiedTurn,
        visibility: record.visibility,
      });
      allRecords.push(record);
    }
  }

  return {
    eventId: event.id,
    recordsCreated: allRecords.length,
    records: allRecords,
  };
}

/**
 * propagateKnowledgeFromStore — convenience function that uses
 * the EventStore to get events and propagate them.
 */
export function propagateKnowledgeFromEvents(
  events: readonly CampaignEvent[],
  agentRegistry: AgentRegistry,
  knowledgeStore: KnowledgeStore,
  currentTurn: number,
  options: PropagateKnowledgeOptions = {},
): readonly PropagationResult[] {
  const results: PropagationResult[] = [];

  for (const event of events) {
    const result = propagateKnowledge(
      event,
      agentRegistry,
      knowledgeStore,
      currentTurn,
      options,
    );
    results.push(result);
  }

  return results;
}
