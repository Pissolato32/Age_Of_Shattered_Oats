/**
 * Log of a specific memory/event remembered by a character.
 * 
 * @rule relationship.memory
 */
export class MemoryLog {
  public readonly id: string;
  public readonly ownerId: string;
  public readonly subjectId: string;
  public readonly description: string;
  public readonly importance: number; // 1 to 10 scale
  public readonly tickRegistered: number;
  public decayed: boolean;

  constructor(data: {
    id: string;
    ownerId: string;
    subjectId: string;
    description: string;
    importance: number;
    tickRegistered: number;
    decayed?: boolean;
  }) {
    this.id = data.id;
    this.ownerId = data.ownerId;
    this.subjectId = data.subjectId;
    this.description = data.description;
    this.importance = Math.max(1, Math.min(10, data.importance));
    this.tickRegistered = data.tickRegistered;
    this.decayed = data.decayed || false;
  }

  /**
   * Evaluates memory decay over elapsed calendar time.
   * Lower importance memory decays faster (e.g. 30 ticks/days per importance point).
   */
  public evaluateDecay(currentTick: number): boolean {
    if (this.decayed) return true;

    const elapsed = currentTick - this.tickRegistered;
    const limit = this.importance * 30; // 30 days per level

    if (elapsed >= limit) {
      this.decayed = true;
    }

    return this.decayed;
  }
}

