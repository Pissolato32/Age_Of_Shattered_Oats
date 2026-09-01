/**
 * MEM-003 — AgentRegistry Tests
 */

import { describe, it, expect } from 'vitest';
import { AgentRegistry, buildAgentRegistry } from '../../../src/memory/propagation/AgentRegistry';

describe('AgentRegistry', () => {
  it('should register player by default', () => {
    const registry = new AgentRegistry();
    expect(registry.size()).toBe(1);

    const player = registry.getById('player');
    expect(player).toBeDefined();
    expect(player!.agentType).toBe('PLAYER');
    expect(player!.knowledgeAccess).toBe('FULL');
  });

  it('should register advisors', () => {
    const registry = new AgentRegistry();
    registry.registerAdvisor('advisor_counselor', 'Counselor');

    const advisor = registry.getById('advisor_counselor');
    expect(advisor).toBeDefined();
    expect(advisor!.agentType).toBe('ADVISOR');
    expect(advisor!.knowledgeAccess).toBe('DOMAIN');
  });

  it('should register noble houses', () => {
    const registry = new AgentRegistry();
    registry.registerNobleHouse('house_1', 'Stormborn');

    const house = registry.getById('house_1');
    expect(house).toBeDefined();
    expect(house!.agentType).toBe('NOBLE_HOUSE');
    expect(house!.knowledgeAccess).toBe('LIMITED');
  });

  it('should not register duplicates', () => {
    const registry = new AgentRegistry();
    registry.registerAdvisor('advisor_counselor', 'Counselor');
    registry.registerAdvisor('advisor_counselor', 'Counselor');

    expect(registry.getByType('ADVISOR')).toHaveLength(1);
  });

  it('should get agents by type', () => {
    const registry = new AgentRegistry();
    registry.registerAdvisor('advisor_counselor', 'Counselor');
    registry.registerAdvisor('advisor_steward', 'Steward');
    registry.registerNobleHouse('house_1', 'Stormborn');

    expect(registry.getByType('PLAYER')).toHaveLength(1);
    expect(registry.getByType('ADVISOR')).toHaveLength(2);
    expect(registry.getByType('NOBLE_HOUSE')).toHaveLength(1);
  });

  it('should get knowledge profiles', () => {
    const registry = new AgentRegistry();
    registry.registerAdvisor('advisor_counselor', 'Counselor');

    const profiles = registry.getKnowledgeProfiles();
    expect(profiles).toHaveLength(2);
    expect(profiles[0].agentId).toBe('player');
    expect(profiles[0].knowledgeAccess).toBe('FULL');
  });

  it('should clear non-player agents', () => {
    const registry = new AgentRegistry();
    registry.registerAdvisor('advisor_counselor', 'Counselor');
    registry.registerNobleHouse('house_1', 'Stormborn');

    registry.clear();
    expect(registry.size()).toBe(1);
    expect(registry.getById('player')).toBeDefined();
  });

  it('should serialize and deserialize', () => {
    const registry = new AgentRegistry();
    registry.registerAdvisor('advisor_counselor', 'Counselor');
    registry.registerNobleHouse('house_1', 'Stormborn');

    const arr = registry.toArray();
    const restored = AgentRegistry.fromArray(arr);

    expect(restored.size()).toBe(3);
    expect(restored.getById('advisor_counselor')).toBeDefined();
    expect(restored.getById('house_1')).toBeDefined();
  });
});

describe('buildAgentRegistry', () => {
  it('should build from state with advisors', () => {
    const registry = buildAgentRegistry({
      advisors: {
        counselorName: 'Aldric',
        stewardName: 'Bran',
        spyMasterName: 'Cira',
      },
    });

    expect(registry.getById('advisor_counselor')).toBeDefined();
    expect(registry.getById('advisor_steward')).toBeDefined();
    expect(registry.getById('advisor_spymaster')).toBeDefined();
  });

  it('should build from state with noble houses', () => {
    const registry = buildAgentRegistry({
      worldLedger: {
        nobleHouses: [
          { id: 'house_1', name: 'Stormborn' },
          { id: 'house_2', name: 'Ironhold' },
        ],
      },
    });

    expect(registry.getById('house_1')).toBeDefined();
    expect(registry.getById('house_2')).toBeDefined();
  });

  it('should generate IDs from house names', () => {
    const registry = buildAgentRegistry({
      worldLedger: {
        nobleHouses: [
          { name: 'Storm Born' },
        ],
      },
    });

    expect(registry.getById('storm_born')).toBeDefined();
  });
});
