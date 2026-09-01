/**
 * MEM-002 — Memory System Index
 *
 * Central export point for the memory system.
 */

export type {
  WorldFact,
  WorldCategory,
  StateValue,
  CampaignEvent,
  EventType,
  EventOutcome,
  EventSignificance,
  EventVisibility,
  StateChange,
  MemoryRecord,
  MemorySource,
  KnowledgeRecord,
  KnowledgeSource,
  KnowledgeCertainty,
  KnowledgeVisibility,
  RelationshipRecord,
  RelationshipDimensions,
  RelationshipType,
  RelationshipEvent,
  KnowledgePropagationPolicy,
  KnowledgePropagationContext,
  AgentKnowledgeProfile,
} from './contracts';

// Export store interfaces with "I" prefix to avoid collision with class names
export type {
  EventStore as IEventStore,
  MemoryStore as IMemoryStore,
  KnowledgeStore as IKnowledgeStore,
  RelationshipStore as IRelationshipStore,
} from './contracts';

export {
  EventStore,
  createEventStoreFromEvents,
} from './EventStore';

export {
  MemoryStore,
  createMemoryStoreFromRecords,
} from './MemoryStore';

export {
  KnowledgeStore,
  createKnowledgeStoreFromRecords,
} from './KnowledgeStore';

export {
  RelationshipStore,
  applyRelationshipDelta,
  createRelationshipStoreFromRecords,
} from './RelationshipStore';

export {
  deriveWorldFacts,
  resetFactIdCounter,
} from './WorldFactDeriver';

export {
  migrateMemories,
  migrateEvents,
} from './migration';
