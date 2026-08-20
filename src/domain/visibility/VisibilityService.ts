export class VisibilityService {
  // Simple distance matrix between major campaign hubs
  private readonly regionDistances: Record<string, Record<string, number>> = {
    'valenfort': { 'valenfort': 0, 'blackmoor': 1, 'harvel': 2, 'capital': 3 },
    'blackmoor': { 'valenfort': 1, 'blackmoor': 0, 'harvel': 1, 'capital': 2 },
    'harvel': { 'valenfort': 2, 'blackmoor': 1, 'harvel': 0, 'capital': 1 },
    'capital': { 'valenfort': 3, 'blackmoor': 2, 'harvel': 1, 'capital': 0 }
  };

  /**
   * Asserts whether a factual event occurred in `eventLocation` is already visible to
   * an observer located at `observerLocation` at the current simulated time tick.
   */
  public canObserverSeeEvent(
    observerLocation: string,
    eventLocation: string,
    currentTick: number,
    tickOccurred: number
  ): boolean {
    if (currentTick < tickOccurred) {
      return false; // Event has not happened yet
    }

    const obsLocClean = observerLocation.toLowerCase();
    const evtLocClean = eventLocation.toLowerCase();

    // Default delay = 1 day if not in the distance matrix
    let distanceDelay = 1;

    if (this.regionDistances[obsLocClean] && this.regionDistances[obsLocClean][evtLocClean] !== undefined) {
      distanceDelay = this.regionDistances[obsLocClean][evtLocClean];
    } else if (obsLocClean === evtLocClean) {
      distanceDelay = 0; // Immediate visibility in local hub
    }

    return currentTick >= tickOccurred + distanceDelay;
  }
}
