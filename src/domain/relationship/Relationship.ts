export interface Vow {
  type: string;
  deadlineTick: number;
  active: boolean;
  broken: boolean;
}

/**
 * Relationship between two characters or noble houses.
 * 
 * @rule relationship.opinion
 * @rule relationship.vows
 */
export class Relationship {
  public readonly sourceId: string;
  public readonly targetId: string;
  public opinion: number; // strictly clamped between -3 and +3
  public relationshipType: string;
  public stateJson: any;

  constructor(data: {
    sourceId: string;
    targetId: string;
    opinion: number;
    relationshipType: string;
    stateJson?: any;
  }) {
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.opinion = Math.max(-3, Math.min(3, data.opinion));
    this.relationshipType = data.relationshipType;
    this.stateJson = data.stateJson || { vows: [] };
    if (!this.stateJson.vows) {
      this.stateJson.vows = [];
    }
  }

  /**
   * Adjusts the opinion score, enforcing standard clamping bounds.
   */
  public adjustOpinion(delta: number) {
    this.opinion = Math.max(-3, Math.min(3, this.opinion + delta));
  }

  /**
   * Registers a diplomatic promise, alliance, or wedding vow with an absolute deadline.
   */
  public recordVow(type: string, deadlineTick: number) {
    const vows = this.stateJson.vows as Vow[];
    vows.push({
      type,
      deadlineTick,
      active: true,
      broken: false
    });
  }

  /**
   * Scans and updates expired vows based on the current time tick.
   */
  public checkVowsExpired(currentTick: number): Vow[] {
    const vows = this.stateJson.vows as Vow[];
    const expired: Vow[] = [];

    for (const vow of vows) {
      if (vow.active && currentTick >= vow.deadlineTick) {
        vow.active = false;
        expired.push(vow);
      }
    }

    return expired;
  }
}

