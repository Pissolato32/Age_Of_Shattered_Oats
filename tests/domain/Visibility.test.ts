import * as assert from 'assert';
import { VisibilityService } from '../../src/domain/visibility/VisibilityService';

async function runTests() {
  console.log("🧪 Starting Visibility Domain Unit Tests...");

  try {
    const vis = new VisibilityService();
    const eventTick = 100;

    // 1. Local event (delay = 0)
    console.log("  - Testing Local Hub Visibility...");
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'valenfort', eventTick, eventTick), true);
    assert.strictEqual(vis.canObserverSeeEvent('blackmoor', 'blackmoor', eventTick, eventTick), true);

    // 2. Future event (currentTick < tickOccurred)
    console.log("  - Testing Future Event Protection...");
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'valenfort', 99, eventTick), false);

    // 3. Distance matrix delay checks
    console.log("  - Testing Spatial Propagation Delays...");
    // valenfort -> blackmoor (delay = 1)
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'blackmoor', 100, eventTick), false);
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'blackmoor', 101, eventTick), true);

    // valenfort -> harvel (delay = 2)
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'harvel', 100, eventTick), false);
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'harvel', 101, eventTick), false);
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'harvel', 102, eventTick), true);
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'harvel', 105, eventTick), true);

    // valenfort -> capital (delay = 3)
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'capital', 102, eventTick), false);
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'capital', 103, eventTick), true);

    // 4. Unknown location fallback (default delay = 1)
    console.log("  - Testing Unknown Hub Fallback...");
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'unknown_fort', 100, eventTick), false);
    assert.strictEqual(vis.canObserverSeeEvent('valenfort', 'unknown_fort', 101, eventTick), true);

    console.log("🎉 All Visibility Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ Visibility Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
