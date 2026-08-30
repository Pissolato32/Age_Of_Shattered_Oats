import * as assert from 'assert';
import { SuccessionService, Relative } from '../../src/domain/kingdom/services/SuccessionService';

async function runTests() {
  console.log("🧪 Starting SuccessionService Domain Unit Tests...");

  try {
    // 1. Children Primogeniture (Eldest legitimate child first)
    console.log("  - Testing Children Primogeniture by age...");
    const children: Relative[] = [
      { id: 'c1', name: 'Younger Child', relation: 'child', age: 14, isLegitimate: true },
      { id: 'c2', name: 'Eldest Child', relation: 'child', age: 22, isLegitimate: true },
      { id: 'c3', name: 'Middle Child', relation: 'child', age: 18, isLegitimate: true }
    ];

    const sortedChildren = SuccessionService.getSuccessionOrder(children);
    assert.strictEqual(sortedChildren[0].name, 'Eldest Child');
    assert.strictEqual(sortedChildren[1].name, 'Middle Child');
    assert.strictEqual(sortedChildren[2].name, 'Younger Child');

    // 2. Legitimacy Priority over Age
    console.log("  - Testing Legitimacy Priority over Age...");
    const mixedLegitimacy: Relative[] = [
      { id: 'c1', name: 'Bastard Son (Older)', relation: 'child', age: 25, isLegitimate: false },
      { id: 'c2', name: 'Trueborn Son (Younger)', relation: 'child', age: 16, isLegitimate: true }
    ];

    const sortedLegitimacy = SuccessionService.getSuccessionOrder(mixedLegitimacy);
    assert.strictEqual(sortedLegitimacy[0].name, 'Trueborn Son (Younger)');
    assert.strictEqual(sortedLegitimacy[1].name, 'Bastard Son (Older)');

    // 3. Collateral Succession (Children > Siblings > Nephews > Others)
    console.log("  - Testing Collateral Succession hierarchy...");
    const fullFamily: Relative[] = [
      { id: 'r1', name: 'Uncle (Other)', relation: 'other', age: 50, isLegitimate: true },
      { id: 'r2', name: 'Nephew', relation: 'nephew', age: 20, isLegitimate: true },
      { id: 'r3', name: 'Brother', relation: 'sibling', age: 35, isLegitimate: true },
      { id: 'r4', name: 'Daughter', relation: 'child', age: 19, isLegitimate: true }
    ];

    const sortedFamily = SuccessionService.getSuccessionOrder(fullFamily);
    assert.strictEqual(sortedFamily[0].name, 'Daughter');
    assert.strictEqual(sortedFamily[1].name, 'Brother');
    assert.strictEqual(sortedFamily[2].name, 'Nephew');
    assert.strictEqual(sortedFamily[3].name, 'Uncle (Other)');

    // 4. Empty Relatives Array Fallback
    console.log("  - Testing Empty Relatives Array...");
    const emptyOrder = SuccessionService.getSuccessionOrder([]);
    assert.strictEqual(emptyOrder.length, 0);

    console.log("🎉 All SuccessionService Domain Unit Tests Passed Successfully!");
  } catch (err: any) {
    console.error("❌ SuccessionService Tests failed: ", err.stack);
    process.exit(1);
  }
}

runTests();
