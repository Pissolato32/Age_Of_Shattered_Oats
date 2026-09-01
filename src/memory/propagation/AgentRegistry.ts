/**
 * MEM-003 — AgentRegistry
 *
 * Minimal registry to enumerate agents in the world.
 * Agents are entities that can hold knowledge: player, advisors, noble houses.
 */

import type { AgentKnowledgeProfile } from '../contracts';

/**
 * Agent types in the world.
 */
export type AgentType = 'PLAYER' | 'ADVISOR' | 'NOBLE_HOUSE';

/**
 * Internal representation of an agent.
 */
export interface AgentEntry {
  readonly agentId: string;
  readonly agentType: AgentType;
  readonly displayName: string;
  readonly knowledgeAccess: 'FULL' | 'DOMAIN' | 'LIMITED';
}

/**
 * AgentRegistry — enumerates agents from CampaignState.
 *
 * This is a minimal registry for MEM-003. It does NOT include:
 * - NPC characters (out of scope)
 * - Army units (out of scope)
 * - Spy agents (out of scope)
 */
export class AgentRegistry {
  private _agents: AgentEntry[] = [];

  constructor() {
    this.registerDefaults();
  }

  /**
   * Register default agents that always exist.
   */
  private registerDefaults(): void {
    this._agents.push({
      agentId: 'player',
      agentType: 'PLAYER',
      displayName: 'Player',
      knowledgeAccess: 'FULL',
    });
  }

  /**
   * Register an advisor agent.
   */
  registerAdvisor(id: string, role: string): void {
    if (!this._agents.find(a => a.agentId === id)) {
      this._agents.push({
        agentId: id,
        agentType: 'ADVISOR',
        displayName: role,
        knowledgeAccess: 'DOMAIN',
      });
    }
  }

  /**
   * Register a noble house agent.
   */
  registerNobleHouse(id: string, name: string): void {
    if (!this._agents.find(a => a.agentId === id)) {
      this._agents.push({
        agentId: id,
        agentType: 'NOBLE_HOUSE',
        displayName: name,
        knowledgeAccess: 'LIMITED',
      });
    }
  }

  /**
   * Get all registered agents.
   */
  getAll(): readonly AgentEntry[] {
    return [...this._agents];
  }

  /**
   * Get agent by ID.
   */
  getById(agentId: string): AgentEntry | undefined {
    return this._agents.find(a => a.agentId === agentId);
  }

  /**
   * Get agents by type.
   */
  getByType(type: AgentType): readonly AgentEntry[] {
    return this._agents.filter(a => a.agentType === type);
  }

  /**
   * Get all agents as AgentKnowledgeProfile (for propagation context).
   */
  getKnowledgeProfiles(): readonly AgentKnowledgeProfile[] {
    return this._agents.map(a => ({
      agentId: a.agentId,
      knowledgeAccess: a.knowledgeAccess,
    }));
  }

  /**
   * Get the number of registered agents.
   */
  size(): number {
    return this._agents.length;
  }

  /**
   * Clear all agents (keeps player).
   */
  clear(): void {
    this._agents = this._agents.filter(a => a.agentType === 'PLAYER');
  }

  /**
   * Convert to plain array (for serialization).
   */
  toArray(): readonly AgentEntry[] {
    return [...this._agents];
  }

  /**
   * Create registry from a plain array.
   */
  static fromArray(agents: readonly AgentEntry[]): AgentRegistry {
    const registry = new AgentRegistry();
    registry._agents = [...agents];
    return registry;
  }
}

/**
 * Build an AgentRegistry from a CampaignState snapshot.
 * Extracts advisors and noble houses from the state.
 */
export function buildAgentRegistry(state: {
  advisors?: {
    counselorName?: string;
    stewardName?: string;
    spyMasterName?: string;
  };
  worldLedger?: {
    nobleHouses?: Array<{
      id?: string;
      name: string;
    }>;
  };
}): AgentRegistry {
  const registry = new AgentRegistry();

  // Register advisors
  if (state.advisors) {
    if (state.advisors.counselorName) {
      registry.registerAdvisor('advisor_counselor', state.advisors.counselorName);
    }
    if (state.advisors.stewardName) {
      registry.registerAdvisor('advisor_steward', state.advisors.stewardName);
    }
    if (state.advisors.spyMasterName) {
      registry.registerAdvisor('advisor_spymaster', state.advisors.spyMasterName);
    }
  }

  // Register noble houses
  if (state.worldLedger?.nobleHouses) {
    for (const house of state.worldLedger.nobleHouses) {
      const id = house.id ?? house.name.toLowerCase().replace(/\s+/g, '_');
      registry.registerNobleHouse(id, house.name);
    }
  }

  return registry;
}
