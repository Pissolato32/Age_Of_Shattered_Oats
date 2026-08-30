import { CampaignState } from '../../types';

export interface GenealogyRecord {
  readonly characterId: string;
  readonly name: string;
  readonly parentIds: readonly string[];
  readonly childIds: readonly string[];
  readonly spouseIds: readonly string[];
  readonly isPlayerLineage: boolean;
  readonly generation: number; // 0 = current ruler, -1 = father, -2 = grandfather, etc.
}

export class GenealogyService {
  /**
   * Initializes or returns the persistent genealogy map from CampaignState.
   */
  public static getGenealogyMap(state: CampaignState): Record<string, GenealogyRecord> {
    if (state.genealogy && typeof state.genealogy === 'object') {
      return state.genealogy;
    }

    const currentRulerId = 'ruler_current';
    const founderId = 'founder_alden';

    const baseline: Record<string, GenealogyRecord> = {
      [currentRulerId]: {
        characterId: currentRulerId,
        name: state.character.name,
        parentIds: ['father_alden_jr'],
        childIds: [],
        spouseIds: [],
        isPlayerLineage: true,
        generation: 0
      },
      ['father_alden_jr']: {
        characterId: 'father_alden_jr',
        name: 'Lorde Brandon o Justo',
        parentIds: [founderId],
        childIds: [currentRulerId],
        spouseIds: ['lady_eleanor'],
        isPlayerLineage: true,
        generation: -1
      },
      [founderId]: {
        characterId: founderId,
        name: 'Lorde Alden o Velho',
        parentIds: [],
        childIds: ['father_alden_jr'],
        spouseIds: ['lady_morwenna'],
        isPlayerLineage: true,
        generation: -2
      }
    };

    state.genealogy = baseline;
    return baseline;
  }

  /**
   * Traces full ancestral lineage path from character up to the earliest recorded founder.
   */
  public static getAncestryLine(state: CampaignState, characterId: string): readonly GenealogyRecord[] {
    const genealogy = this.getGenealogyMap(state);
    const line: GenealogyRecord[] = [];
    const visited = new Set<string>();
    let currentId: string | undefined = characterId;

    while (currentId && genealogy[currentId] && !visited.has(currentId)) {
      visited.add(currentId);
      const record = genealogy[currentId];
      line.push(record);
      currentId = record.parentIds.length > 0 ? record.parentIds[0] : undefined;
    }

    return line;
  }

  /**
   * Determines if target character is a direct descendant of an ancestor.
   */
  public static isDescendantOf(state: CampaignState, targetId: string, ancestorId: string): boolean {
    const line = this.getAncestryLine(state, targetId);
    return line.some(rec => rec.characterId === ancestorId && rec.characterId !== targetId);
  }
}
