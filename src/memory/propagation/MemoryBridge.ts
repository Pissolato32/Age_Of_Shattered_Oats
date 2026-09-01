/**
 * MEM-003 — MemoryBridge
 *
 * Bridges legacy character.memories to the canonical KnowledgeStore.
 * This allows a gradual transition from the legacy system to MEM-002/MEM-003.
 */

import type { KnowledgeStore } from '../contracts';

/**
 * Legacy memory format from character.memories
 */
interface LegacyMemory {
  id: string;
  ownerId: string;
  subjectId: string;
  description: string;
  importance: number;
  tickRegistered: number;
  decayed?: boolean;
}

/**
 * Result of bridging legacy memories.
 */
export interface BridgeResult {
  readonly migratedCount: number;
  readonly skippedCount: number;
}

/**
 * MemoryBridge — synchronizes legacy character.memories to KnowledgeStore.
 *
 * This is a one-way bridge: legacy → canonical.
 * After bridging, the canonical store is authoritative.
 */
export class MemoryBridge {
  private _knowledgeStore: KnowledgeStore;
  private _migratedIds: Set<string> = new Set();

  constructor(knowledgeStore: KnowledgeStore) {
    this._knowledgeStore = knowledgeStore;
  }

  /**
   * Migrate legacy memories to KnowledgeStore.
   * Only migrates memories that haven't been migrated before.
   */
  migrateMemories(legacyMemories: readonly LegacyMemory[]): BridgeResult {
    let migratedCount = 0;
    let skippedCount = 0;

    for (const memory of legacyMemories) {
      // Skip if already migrated
      if (this._migratedIds.has(memory.id)) {
        skippedCount++;
        continue;
      }

      // Skip decayed memories (they're no longer relevant)
      if (memory.decayed) {
        skippedCount++;
        continue;
      }

      // Create a KnowledgeRecord from the legacy memory
      this._knowledgeStore.add({
        agentId: memory.ownerId,
        factId: `legacy_${memory.id}`,
        value: memory.description,
        source: 'DIRECT_OBSERVATION',
        certainty: 'CONFIRMED',
        obtainedTurn: memory.tickRegistered,
        lastVerifiedTurn: memory.tickRegistered,
        visibility: 'PRIVATE',
      });

      this._migratedIds.add(memory.id);
      migratedCount++;
    }

    return { migratedCount, skippedCount };
  }

  /**
   * Check if a memory has been migrated.
   */
  isMigrated(memoryId: string): boolean {
    return this._migratedIds.has(memoryId);
  }

  /**
   * Get the count of migrated memories.
   */
  getMigratedCount(): number {
    return this._migratedIds.size;
  }

  /**
   * Reset the bridge (for testing).
   */
  reset(): void {
    this._migratedIds.clear();
  }
}

/**
 * Create a MemoryBridge for a KnowledgeStore.
 */
export function createMemoryBridge(knowledgeStore: KnowledgeStore): MemoryBridge {
  return new MemoryBridge(knowledgeStore);
}
