const assert = require("node:assert/strict");

// DOM参照だけを最小限に代替し、ブラウザ用スクリプトの純粋関数を読み込む。
global.document = {
  querySelector: () => ({
    textContent: "", innerHTML: "", value: "", focus() {}, addEventListener() {}
  })
};
const {
  generateName, generateTypes, generateStats, calculateActualStat, allocatePoints, ARCHETYPES
} = require("../app.js");

for (let run = 0; run < 1000; run += 1) {
  const total = 300 + Math.floor(Math.random() * 421);
  const stats = generateStats(total, ARCHETYPES[run % ARCHETYPES.length][1]);
  assert.equal(stats.reduce((sum, value) => sum + value, 0), total);
  stats.forEach(value => assert.ok(value >= 20 && value <= 180));
  const nameLength = Array.from(generateName()).length;
  assert.ok(nameLength >= 3 && nameLength <= 6);
  const types = generateTypes();
  assert.ok(types.length === 1 || types.length === 2);
  assert.equal(new Set(types).size, types.length);
}

// 32 / 32 / 2 は上限ちょうどまで割り振れ、それ以上は追加されない。
let points = Array(6).fill(0);
points = allocatePoints(points, 0, 32);
points = allocatePoints(points, 1, 32);
points = allocatePoints(points, 2, 2);
assert.deepEqual(points, [32, 32, 2, 0, 0, 0]);
assert.deepEqual(allocatePoints(points, 3, 1), points);
assert.deepEqual(allocatePoints(Array(6).fill(0), 0, 99), [32, 0, 0, 0, 0, 0]);
assert.deepEqual(allocatePoints([32, 32, 0, 0, 0, 0], 2, 32), [32, 32, 2, 0, 0, 0]);

// Lv.50・個体値31相当。HPはB+75、その他はB+20を基礎に能力ポイントと性格を反映する。
assert.equal(calculateActualStat(100, 32, 0), 207);
assert.equal(calculateActualStat(120, 32, 1), 172);
assert.equal(calculateActualStat(80, 2, 2), 102);
assert.equal(calculateActualStat(120, 32, 1, 1, -1), 189);
assert.equal(calculateActualStat(120, 32, 1, -1, 1), 154);

console.log("generator and training simulator logic: all cases passed");
