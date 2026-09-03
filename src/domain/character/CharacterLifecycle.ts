import { CampaignState } from '../../types';

export type LifeState = 'alive' | 'dead' | 'missing' | 'compacted';

export interface DeathRecord {
  readonly turn: number;
  readonly cause: string;
  readonly place: string;
  readonly killerId?: string;
}

export interface RolePeriod {
  readonly role: string;
  readonly fromTurn: number;
  readonly toTurn?: number;
}

export interface HistoricalCharacter {
  readonly id: string;
  readonly name: string;
  readonly house?: string;
  lifeState: LifeState;
  death?: DeathRecord;
  currentRole: string | null;
  roleHistory: RolePeriod[];
  readonly historicalImportance: number; // 1 (minor) to 5 (legendary founder/ruler)
  readonly isAncestor?: boolean;
  readonly notes?: string;
}

export interface HistoricalMemoryRecord {
  readonly id: string;
  readonly turnRecorded: number;
  readonly category: 'POLITICAL' | 'MILITARY' | 'FOUNDATION' | 'CALAMITY' | 'SUCCESSION';
  readonly statement: string;
  readonly participants: readonly string[];
  readonly importance: number;
  readonly isImmutableFact: true;
}

export class CharacterLifecycleService {
  /**
   * Generates the immutable default baseline characters for a new campaign.
   */
  public static createDefaultBaseline(state: CampaignState): HistoricalCharacter[] {
    return [
      {
        id: 'ruler_current',
        name: state.character.name,
        house: state.character.house,
        lifeState: 'alive',
        currentRole: 'sovereign',
        roleHistory: [{ role: 'sovereign', fromTurn: 1 }],
        historicalImportance: 5,
        isAncestor: false
      },
      {
        id: 'mara',
        name: 'Mara',
        house: 'Valenfort',
        lifeState: 'alive',
        currentRole: 'chancellor',
        roleHistory: [{ role: 'chancellor', fromTurn: 1 }],
        historicalImportance: 4
      },
      {
        id: 'ren',
        name: 'Ren',
        house: 'Ironwatch',
        lifeState: 'alive',
        currentRole: 'marshal',
        roleHistory: [{ role: 'marshal', fromTurn: 1 }],
        historicalImportance: 4
      },
      {
        id: 'barth',
        name: 'Barth',
        house: 'Greyhaven',
        lifeState: 'alive',
        currentRole: 'steward',
        roleHistory: [{ role: 'steward', fromTurn: 1 }],
        historicalImportance: 3
      },
      {
        id: 'founder_alden',
        name: 'Lorde Alden o Velho',
        house: 'Grey Keep',
        lifeState: 'dead',
        death: { turn: -520, cause: 'Velhice após a Grande Batalha', place: 'Grey Keep' },
        currentRole: null,
        roleHistory: [{ role: 'founder', fromTurn: -600, toTurn: -520 }],
        historicalImportance: 5,
        isAncestor: true,
        notes: 'Fundador lendário da fortaleza de Grey Keep'
      },
      {
        id: 'former_general_morr',
        name: 'General Morr',
        house: 'Ironwatch',
        lifeState: 'dead',
        death: { turn: 12, cause: 'Emboscada na Garganta de Gelo', place: 'Colinas de Ferro' },
        currentRole: null,
        roleHistory: [{ role: 'marshal', fromTurn: 1, toTurn: 12 }],
        historicalImportance: 3,
        notes: 'Antigo marechal falecido em campanha'
      }
    ];
  }

  /**
   * Pure read-only inspection of the historical roster without mutating CampaignState.
   */
  public static peekHistoricalRoster(state: CampaignState): readonly HistoricalCharacter[] {
    if (state.historicalCharacters && Array.isArray(state.historicalCharacters)) {
      return state.historicalCharacters;
    }
    return this.createDefaultBaseline(state);
  }

  /**
   * Returns and ensures the persistent historical roster exists in CampaignState.
   */
  public static getHistoricalRoster(state: CampaignState): HistoricalCharacter[] {
    if (state.historicalCharacters && Array.isArray(state.historicalCharacters)) {
      return state.historicalCharacters;
    }

    const baseline = this.createDefaultBaseline(state);
    state.historicalCharacters = baseline;
    return baseline;
  }

  public static findCharacter(nameOrId: string, state: CampaignState): HistoricalCharacter | undefined {
    const roster = this.getHistoricalRoster(state);
    const normalized = nameOrId.toLowerCase().trim();
    
    // 1. Exact ID or Name match
    const exact = roster.find(
      c => c.id.toLowerCase() === normalized || c.name.toLowerCase() === normalized
    );
    if (exact) return exact;

    // 2. Word boundary match in Name
    return roster.find(c => {
      const nameWords = c.name.toLowerCase().split(/\s+/);
      return nameWords.includes(normalized) || c.name.toLowerCase().includes(normalized);
    });
  }

  public static isAlive(character: HistoricalCharacter): boolean {
    return character.lifeState === 'alive';
  }

  public static hasCurrentRole(character: HistoricalCharacter, roleName: string): boolean {
    if (!character.currentRole) return false;
    return character.currentRole.toLowerCase().trim() === roleName.toLowerCase().trim();
  }

  /**
   * Deterministic State Transition: Kills a character, records death details, and terminates active role.
   */
  public static killCharacter(
    state: CampaignState,
    characterId: string,
    deathRecord: DeathRecord
  ): boolean {
    const char = this.findCharacter(characterId, state);
    if (!char) return false;
    if (char.lifeState === 'dead') return true;

    char.lifeState = 'dead';
    char.death = deathRecord;

    // Close any active role period in roleHistory
    if (char.currentRole && char.roleHistory.length > 0) {
      const activePeriod = char.roleHistory[char.roleHistory.length - 1];
      if (activePeriod && activePeriod.toTurn === undefined) {
        (activePeriod as any).toTurn = deathRecord.turn;
      }
    }
    char.currentRole = null;

    // Record in world ledger notable deaths if high importance
    if (char.historicalImportance >= 3 && state.worldLedger) {
      if (!state.worldLedger.notableDeaths) {
        state.worldLedger.notableDeaths = [];
      }
      state.worldLedger.notableDeaths.push({
        name: char.name,
        turn: deathRecord.turn,
        cause: deathRecord.cause,
        role: char.roleHistory[char.roleHistory.length - 1]?.role || 'Nobre'
      } as any);
    }

    return true;
  }

  /**
   * Deterministic State Transition: Reassigns or changes a character's current role.
   * INVARIANT: A dead character CANNOT receive a new role.
   */
  public static assignCharacterRole(
    state: CampaignState,
    characterId: string,
    newRole: string | null,
    turn: number
  ): boolean {
    const char = this.findCharacter(characterId, state);
    if (!char) return false;

    if (char.lifeState === 'dead' && newRole !== null) {
      throw new Error(`[CharacterLifecycle Invariant Violation] Dead character '${char.name}' cannot be assigned role '${newRole}'`);
    }

    // Idempotency: assigning same active role does not create duplicate period
    if (char.currentRole === newRole) {
      return true;
    }

    // Close active period
    if (char.roleHistory.length > 0) {
      const activePeriod = char.roleHistory[char.roleHistory.length - 1];
      if (activePeriod && activePeriod.toTurn === undefined) {
        (activePeriod as any).toTurn = turn;
      }
    }

    // Open new period if role is not null
    if (newRole) {
      char.roleHistory.push({
        role: newRole,
        fromTurn: turn
      });
      char.currentRole = newRole;
    } else {
      char.currentRole = null;
    }

    return true;
  }
}
