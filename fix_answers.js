// 正解位置の偏り修正 + oex改善スクリプト
const fs = require('fs');
const path = 'C:/Users/rrryo/OneDrive/haikan-quiz/配管クイズv4.html';
let html = fs.readFileSync(path, 'utf-8');

// ALL_QUESTIONS配列を抽出
const startMarker = 'const ALL_QUESTIONS=[';
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) { console.error('ALL_QUESTIONS not found'); process.exit(1); }

// 配列の終了位置を見つける
let bracketCount = 0;
let arrayStart = html.indexOf('[', startIdx);
let arrayEnd = -1;
for (let i = arrayStart; i < html.length; i++) {
  if (html[i] === '[') bracketCount++;
  if (html[i] === ']') { bracketCount--; if (bracketCount === 0) { arrayEnd = i; break; } }
}

const arrayStr = html.substring(arrayStart, arrayEnd + 1);
let questions;
try {
  questions = JSON.parse(arrayStr);
} catch(e) {
  console.error('JSON parse error:', e.message);
  process.exit(1);
}

console.log(`Total questions: ${questions.length}`);

// 現在の分布を表示
let dist = {0:0,1:0,2:0,3:0};
questions.forEach(q => dist[q.a]++);
console.log('Before:', JSON.stringify(dist));

// 目標: 各25% (各 Math.floor(questions.length/4))
const target = Math.floor(questions.length / 4);
console.log(`Target per answer: ~${target}`);

// oex改善: "不正解。この選択肢は該当しません" を含む問題を改善
let improvedCount = 0;
questions.forEach(q => {
  if (!q.oex) return;
  q.oex = q.oex.map((ex, i) => {
    if (ex === "不正解。この選択肢は該当しません") {
      improvedCount++;
      // 選択肢に基づいて具体的な解説を生成
      const opt = q.o[i];
      if (i === q.a) return ex; // 正解はそのまま
      const correctOpt = q.o[q.a];
      return `不正解。${opt}ではなく、${correctOpt}が正しい答えです。`;
    }
    return ex;
  });
});
console.log(`Improved ${improvedCount} generic oex entries`);

// 正解位置のバランス調整
// a=1の問題を他のインデックスに再分配
function swapAnswer(q, newA) {
  const oldA = q.a;
  if (oldA === newA) return;

  // 選択肢を入れ替え
  const tempO = q.o[oldA];
  q.o[oldA] = q.o[newA];
  q.o[newA] = tempO;

  // oexも入れ替え
  if (q.oex && q.oex.length === 4) {
    const tempOex = q.oex[oldA];
    q.oex[oldA] = q.oex[newA];
    q.oex[newA] = tempOex;
  }

  q.a = newA;
}

// シャッフル用のシード付き乱数
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

const rng = seededRandom(42);

// a=1の問題をリストアップしてシャッフル
let a1Questions = [];
questions.forEach((q, idx) => { if (q.a === 1) a1Questions.push(idx); });

// Fisher-Yatesシャッフル
for (let i = a1Questions.length - 1; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1));
  [a1Questions[i], a1Questions[j]] = [a1Questions[j], a1Questions[i]];
}

// 現在の分布から必要な移動数を計算
const totalQ = questions.length;
const idealPer = Math.floor(totalQ / 4);
const remainder = totalQ - idealPer * 4;

// 目標分布
const targets = {0: idealPer, 1: idealPer, 2: idealPer, 3: idealPer};
// 余りを分配
for (let i = 0; i < remainder; i++) targets[i]++;

const needed = {};
for (let a = 0; a < 4; a++) {
  needed[a] = targets[a] - dist[a];
  if (a === 1) needed[a] = 0; // a=1からは減らすだけ
}

console.log('Targets:', JSON.stringify(targets));
console.log('Needed moves:', JSON.stringify(needed));

// a=1から他のインデックスへ移動
let moveIdx = 0;
for (let targetA of [0, 2, 3]) {
  const count = targets[targetA] - dist[targetA];
  if (count <= 0) continue;
  for (let i = 0; i < count && moveIdx < a1Questions.length; i++) {
    const qIdx = a1Questions[moveIdx];
    swapAnswer(questions[qIdx], targetA);
    moveIdx++;
  }
}

// 最終分布を確認
let distAfter = {0:0,1:0,2:0,3:0};
questions.forEach(q => distAfter[q.a]++);
console.log('After:', JSON.stringify(distAfter));

// HTMLに書き戻す
const newArrayStr = JSON.stringify(questions);
// 改行を入れて読みやすくする（各問題を1行に）
const formattedArray = '[\n' + questions.map(q => JSON.stringify(q)).join(',\n') + '\n]';
const newHtml = html.substring(0, arrayStart) + formattedArray + html.substring(arrayEnd + 1);

fs.writeFileSync(path, newHtml, 'utf-8');
console.log('File updated successfully!');
console.log(`File size: ${newHtml.length} bytes`);
