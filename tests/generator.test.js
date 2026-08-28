const assert = require("node:assert/strict");

// DOM参照だけを最小限に代替し、ブラウザ用スクリプトの純粋関数を読み込む。
global.document = {
  querySelector: selector => selector === "#generate-button"
    ? { addEventListener() {} }
    : { textContent: "", innerHTML: "", value: "500", focus() {} }
};
const { generateName, generateTypes, generateStats, ARCHETYPES } = require("../app.js");

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

console.log("generator logic: 1000 randomized cases passed");
