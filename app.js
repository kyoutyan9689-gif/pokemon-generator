const TYPES = ["ノーマル", "ほのお", "みず", "でんき", "くさ", "こおり", "かくとう", "どく", "じめん", "ひこう", "エスパー", "むし", "いわ", "ゴースト", "ドラゴン", "あく", "はがね", "フェアリー"];
const STAT_NAMES = ["HP", "こうげき", "ぼうぎょ", "とくこう", "とくぼう", "すばやさ"];
const MAX_STAT_POINTS = 32;
const MAX_TOTAL_POINTS = 66;
let currentStats = [];
let abilityPoints = Array(6).fill(0);

// HP・攻撃・防御・特攻・特防・素早さの順。型の特徴を比率で表す。
const ARCHETYPES = [
  ["バランス型", [1, 1, 1, 1, 1, 1]],
  ["物理アタッカー", [1, 1.55, .95, .55, .85, 1.1]],
  ["特殊アタッカー", [1, .55, .85, 1.55, .95, 1.1]],
  ["高速物理アタッカー", [.85, 1.55, .75, .5, .75, 1.6]],
  ["高速特殊アタッカー", [.85, .5, .75, 1.55, .75, 1.6]],
  ["物理耐久型", [1.35, .9, 1.6, .65, 1, .55]],
  ["特殊耐久型", [1.35, .65, 1, .9, 1.6, .55]],
  ["両受け耐久型", [1.45, .65, 1.35, .65, 1.35, .55]],
  ["鈍足高火力型", [1.15, 1.4, 1.05, 1.4, 1.05, .35]],
  ["両刀アタッカー", [.9, 1.35, .75, 1.35, .75, .9]],
  ["高速サポート型", [1.15, .55, 1.05, .55, 1.05, 1.65]]
];

const nameStarts = ["ガ", "ギ", "グ", "バ", "ビ", "ブ", "ド", "ドラ", "グラ", "フ", "フィ", "ミ", "ミュ", "リ", "ル", "レ", "ネ", "ノ", "コ", "ク", "カ", "サ", "シ", "シャ", "チ", "テ", "ト", "パ", "ピ", "プ", "ヴァ", "ゼ"];
const nameMiddles = ["ラ", "リ", "ル", "レ", "ロ", "ナ", "ニ", "ネ", "ノ", "マ", "ミ", "ム", "メ", "モ", "カ", "キ", "ク", "サ", "シ", "セ", "タ", "ティ", "ト", "ディ", "ピ", "フィ", "ヴァ"];
const nameEnds = ["ン", "ス", "ト", "ド", "ル", "ラ", "ア", "オ", "ナ", "ム", "スカ", "リア", "ロス", "ディン", "ネオ", "ピナ"];
const pick = list => list[Math.floor(Math.random() * list.length)];

function generateName() {
  // カタカナのコードポイント数が3〜6になるまで、発音しやすい音節を組み直す。
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const middleCount = Math.random() < .55 ? 1 : 2;
    const candidate = pick(nameStarts) + Array.from({ length: middleCount }, () => pick(nameMiddles)).join("") + pick(nameEnds);
    const length = Array.from(candidate).length;
    if (length >= 3 && length <= 6) return candidate;
  }
  return "ガルネオ";
}

function generateTypes() {
  const first = pick(TYPES);
  if (Math.random() < .4) return [first];
  const second = pick(TYPES.filter(type => type !== first));
  return [first, second];
}

function generateStats(total, baseWeights) {
  const min = 20;
  const max = 180;
  // ±18%のブレを加え、同じ型でも違う個性を作る。
  const weights = baseWeights.map(weight => weight * (.82 + Math.random() * .36));
  const stats = Array(6).fill(min);
  let remaining = total - min * 6;

  // 上限に達した能力を除外しながら、残りを重みに比例して1ずつ配る。
  while (remaining > 0) {
    const available = stats.map((value, index) => value < max ? index : -1).filter(index => index >= 0);
    const weightSum = available.reduce((sum, index) => sum + weights[index], 0);
    let roll = Math.random() * weightSum;
    let chosen = available[available.length - 1];
    for (const index of available) {
      roll -= weights[index];
      if (roll <= 0) { chosen = index; break; }
    }
    stats[chosen] += 1;
    remaining -= 1;
  }
  return stats;
}

function calculateActualStat(baseStat, points, statIndex, natureUp = -1, natureDown = -1) {
  const neutralValue = baseStat + (statIndex === 0 ? 75 : 20) + points;
  if (statIndex === 0) return neutralValue;
  const modifier = statIndex === natureUp ? 1.1 : statIndex === natureDown ? .9 : 1;
  return Math.floor(neutralValue * modifier);
}

function allocatePoints(points, statIndex, requestedValue) {
  const next = [...points];
  const value = Math.max(0, Math.min(MAX_STAT_POINTS, Math.trunc(Number(requestedValue) || 0)));
  const available = MAX_TOTAL_POINTS - (points.reduce((sum, point) => sum + point, 0) - points[statIndex]);
  next[statIndex] = Math.min(value, available);
  return next;
}

function natureOptions() {
  return `<option value="">補正なし</option>${STAT_NAMES.slice(1).map((name, index) => `<option value="${index + 1}">${name}</option>`).join("")}`;
}

function selectedNature(selector) {
  const value = document.querySelector(selector).value;
  return value === "" ? -1 : Number(value);
}

function renderTrainingSimulator() {
  if (!currentStats.length) return;
  const used = abilityPoints.reduce((sum, point) => sum + point, 0);
  const natureUp = selectedNature("#nature-up");
  const natureDown = selectedNature("#nature-down");
  document.querySelector("#training-stats").innerHTML = currentStats.map((baseStat, index) => {
    const points = abilityPoints[index];
    const canAdd = points < MAX_STAT_POINTS && used < MAX_TOTAL_POINTS;
    return `<article class="training-stat">
      <div class="training-stat-info"><h3>${STAT_NAMES[index]}</h3><span>種族値 <strong>${baseStat}</strong></span></div>
      <div class="point-control" aria-label="${STAT_NAMES[index]}の能力ポイント">
        <button type="button" data-stat="${index}" data-value="0" ${points === 0 ? "disabled" : ""}>0</button>
        <button type="button" data-stat="${index}" data-delta="-1" aria-label="${STAT_NAMES[index]}を1減らす" ${points === 0 ? "disabled" : ""}>−</button>
        <output aria-label="能力ポイント">${points}</output>
        <button type="button" data-stat="${index}" data-delta="1" aria-label="${STAT_NAMES[index]}を1増やす" ${canAdd ? "" : "disabled"}>＋</button>
        <button type="button" data-stat="${index}" data-value="32" ${canAdd ? "" : "disabled"}>32</button>
      </div>
      <p class="actual-stat">実数値 <strong>${calculateActualStat(baseStat, points, index, natureUp, natureDown)}</strong></p>
    </article>`;
  }).join("");
  document.querySelector("#used-points").textContent = used;
}

function renderMonster(total) {
  const [archetype, weights] = pick(ARCHETYPES);
  const stats = generateStats(total, weights);
  currentStats = stats;
  abilityPoints = Array(6).fill(0);
  document.querySelector("#monster-name").textContent = generateName();
  document.querySelector("#archetype").textContent = archetype;
  document.querySelector("#display-total").textContent = total;
  document.querySelector("#entry-number").textContent = `NO. ${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
  document.querySelector("#type-list").innerHTML = generateTypes().map(type => `<span class="type-chip">${type}</span>`).join("");
  document.querySelector("#stats-list").innerHTML = stats.map((value, index) => `
    <div class="stat-row">
      <span class="stat-name">${STAT_NAMES[index]}</span>
      <span class="stat-value">${value}</span>
      <div class="bar-track" role="img" aria-label="${STAT_NAMES[index]} ${value}"><div class="bar" style="width: ${value / 180 * 100}%"></div></div>
    </div>`).join("");
  renderTrainingSimulator();
}

const input = document.querySelector("#total-input");
const error = document.querySelector("#input-error");
document.querySelector("#nature-up").innerHTML = natureOptions();
document.querySelector("#nature-down").innerHTML = natureOptions();
["#nature-up", "#nature-down"].forEach(selector => document.querySelector(selector).addEventListener("change", event => {
  const otherSelector = selector === "#nature-up" ? "#nature-down" : "#nature-up";
  const other = document.querySelector(otherSelector);
  if (event.target.value && event.target.value === other.value) other.value = "";
  renderTrainingSimulator();
}));
document.querySelector("#training-stats").addEventListener("click", event => {
  const button = event.target.closest("button[data-stat]");
  if (!button) return;
  const statIndex = Number(button.dataset.stat);
  const requestedValue = button.dataset.value === undefined
    ? abilityPoints[statIndex] + Number(button.dataset.delta)
    : Number(button.dataset.value);
  abilityPoints = allocatePoints(abilityPoints, statIndex, requestedValue);
  renderTrainingSimulator();
});
document.querySelector("#reset-points").addEventListener("click", () => {
  abilityPoints = Array(6).fill(0);
  renderTrainingSimulator();
});
document.querySelector("#generate-button").addEventListener("click", () => {
  const total = Number(input.value);
  if (!Number.isInteger(total) || total < 300 || total > 720) {
    error.textContent = "300〜720の整数を入力してください。";
    input.focus();
    return;
  }
  error.textContent = "";
  renderMonster(total);
});

// 初回から完成したカードを見せ、すぐ再生成できるようにする。
renderMonster(500);

// テストから純粋な生成ロジックを検証できるようにする。
if (typeof module !== "undefined") module.exports = {
  generateName, generateTypes, generateStats, calculateActualStat, allocatePoints,
  ARCHETYPES, MAX_STAT_POINTS, MAX_TOTAL_POINTS
};
