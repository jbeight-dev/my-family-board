// 실행: node pet.test.mjs
import assert from "node:assert/strict";
import { stageOf, shownStage, toNext, stagePct, applyXp, xpKey } from "./pet.js";

assert.equal(stageOf(0), 0); assert.equal(stageOf(49), 0);
assert.equal(stageOf(50), 1); assert.equal(stageOf(199), 1);
assert.equal(stageOf(200), 2); assert.equal(stageOf(499), 2);
assert.equal(stageOf(500), 3); assert.equal(stageOf(9999), 3);

let p = { totalXp: 40, highestUnlockedStage: 0 };
p = applyXp(p, true);                       // 50 → 아기 펫
assert.deepEqual(p, { totalXp: 50, highestUnlockedStage: 1 });
p = applyXp(p, false);                      // 해제 → 40, 단계는 유지
assert.deepEqual(p, { totalXp: 40, highestUnlockedStage: 1 });
assert.equal(shownStage(p), 1);
assert.equal(toNext(p), 160);               // 200 - 40
assert.equal(applyXp({ totalXp: 0 }, false).totalXp, 0);   // 음수 금지
assert.equal(toNext({ totalXp: 700, highestUnlockedStage: 3 }), null);
assert.equal(stagePct({ totalXp: 125, highestUnlockedStage: 1 }), 50);
assert.equal(xpKey("2026-11-21", "kid1", "pm", "kid1pm1"), "2026-11-21_kid1_pm_kid1pm1");
console.log("pet.test OK");
