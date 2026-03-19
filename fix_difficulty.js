const fs = require('fs');
let html = fs.readFileSync('配管クイズv4.html', 'utf8');
const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
const q = eval(m[2]);

// Target: ~30% Easy, ~45% Normal, ~25% Hard per genre
// Strategy: upgrade some d:1→d:2 and d:2→d:3 based on question content
// Questions with technical terms, specific numbers, or regulations → upgrade

let upgraded = 0;
let seed = 123;
function seededRandom() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

q.forEach((item) => {
  const genreQ = q.filter(x => x.genre === item.genre);
  const hardCount = genreQ.filter(x => x.d === 3).length;
  const hardPct = hardCount / genreQ.length;

  // If Hard% < 25%, upgrade some Normal to Hard
  if (hardPct < 0.25 && item.d === 2) {
    // Upgrade questions with specific numbers, regulations, or complex content
    const hasNumbers = /\d+.*\d+/.test(item.q) || /MPa|mm|kg|m³|℃|N\/|kW|Ω/.test(item.q);
    const hasRegulation = /法|基準|規格|規定|規則|JIS|JAS/.test(item.q);
    const isComplex = item.q.length > 40;

    if ((hasNumbers && isComplex) || hasRegulation) {
      if (seededRandom() < 0.4) { // 40% chance to upgrade matching questions
        item.d = 3;
        upgraded++;
      }
    }
  }

  // If Easy% > 35%, upgrade some Easy to Normal
  const easyCount = genreQ.filter(x => x.d === 1).length;
  const easyPct = easyCount / genreQ.length;
  if (easyPct > 0.30 && item.d === 1) {
    if (item.q.length > 30 && seededRandom() < 0.3) {
      item.d = 2;
      upgraded++;
    }
  }
});

console.log('Upgraded:', upgraded, 'questions');

// Verify new distribution
const names = ['配管工事','消防設備点検','貯水槽清掃','排水管清掃','設備点検','ビジネスマナー','内装工事','管工事施工管理','土木施工管理','建築施工管理','給水装置','第2種電気工事士'];
names.forEach((n, i) => {
  const gq = q.filter(x => x.genre === i);
  const d1 = gq.filter(x => x.d === 1).length;
  const d2 = gq.filter(x => x.d === 2).length;
  const d3 = gq.filter(x => x.d === 3).length;
  console.log('g' + i + ' ' + n + ': E:' + d1 + ' N:' + d2 + ' H:' + d3 + ' (H%:' + Math.round(d3 / gq.length * 100) + '%)');
});

// Serialize
function escStr(s) {
  if (s === undefined || s === null) return "''";
  const bs = String.fromCharCode(92);
  let str = String(s);
  str = str.split(bs).join(bs + bs);
  str = str.split("'").join(bs + "'");
  str = str.split("\n").join(bs + "n");
  return "'" + str + "'";
}

let arr = '[';
q.forEach((item, i) => {
  if (i > 0) arr += ',';
  arr += '{q:' + escStr(item.q) + ',o:[' + item.o.map(escStr).join(',') + '],a:' + item.a + ',genre:' + item.genre + ',d:' + item.d + ',ex:' + escStr(item.ex) + ',oex:[' + item.oex.map(escStr).join(',') + ']';
  if (item.img) arr += ',img:' + escStr(item.img);
  arr += '}';
});
arr += ']';

const newHtml = html.replace(/(const ALL_QUESTIONS=)\[[\s\S]*?\];/, 'const ALL_QUESTIONS=' + arr + ';');
fs.writeFileSync('配管クイズv4.html', newHtml);

// Total
const dDist = {1: 0, 2: 0, 3: 0};
q.forEach(x => { dDist[x.d]++; });
console.log('Total - Easy:' + dDist[1] + ' Normal:' + dDist[2] + ' Hard:' + dDist[3]);
