const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
if (!m) { console.error('Pattern not found'); process.exit(1); }
const q = eval(m[2]);

const gNames = ['配管工事','消防設備点検','貯水槽清掃','排水管清掃','設備点検','ビジネスマナー','内装工事','管工事施工管理','土木施工管理','建築施工管理','給水装置','第2種電気工事士'];

// Fix answer balance per genre
let totalSwaps = 0;
for (let g = 0; g <= 11; g++) {
  const indices = [];
  q.forEach((x, i) => { if (x.genre === g) indices.push(i); });
  const ga = [0, 0, 0, 0];
  indices.forEach(i => ga[q[i].a]++);
  const target = Math.round(indices.length / 4);

  // Find over/under represented positions
  const over = [], under = [];
  ga.forEach((v, pos) => {
    if (v > target + 2) over.push(pos);
    if (v < target - 2) under.push(pos);
  });

  if (over.length === 0 || under.length === 0) continue;

  let swaps = 0;
  for (const overPos of over) {
    for (const underPos of under) {
      // Find questions with answer=overPos and swap to underPos
      const candidates = indices.filter(i => q[i].a === overPos);
      const needed = Math.min(ga[overPos] - target, target - ga[underPos]);

      for (let s = 0; s < needed && candidates.length > 0; s++) {
        const idx = candidates.pop();
        const item = q[idx];

        // Swap option positions: move current answer to underPos
        const oldA = item.a;
        const newA = underPos;

        // Swap options
        [item.o[oldA], item.o[newA]] = [item.o[newA], item.o[oldA]];
        // Swap oex
        [item.oex[oldA], item.oex[newA]] = [item.oex[newA], item.oex[oldA]];
        // Update answer index
        item.a = newA;

        ga[oldA]--;
        ga[newA]++;
        swaps++;
      }
    }
  }

  if (swaps > 0) {
    const newGa = [0,0,0,0];
    indices.forEach(i => newGa[q[i].a]++);
    const pcts = newGa.map(v => Math.round(v/indices.length*100));
    console.log('G' + g + ' ' + gNames[g] + ': ' + swaps + '問入替 -> ' + pcts.map((p,i)=>i+':'+p+'%').join(' '));
    totalSwaps += swaps;
  }
}

console.log('Total swaps:', totalSwaps);

// Verify
console.log('\n=== 修正後ジャンル別回答分布 ===');
for (let g = 0; g <= 11; g++) {
  const gq = q.filter(x => x.genre === g);
  const ga = [0,0,0,0];
  gq.forEach(x => ga[x.a]++);
  const pcts = ga.map(v => Math.round(v/gq.length*100));
  const maxDev = Math.max(...pcts.map(p => Math.abs(p-25)));
  const flag = maxDev > 5 ? ' ⚠' : ' ✓';
  console.log('  G'+g+' '+gNames[g]+': '+pcts.map((p,i)=>i+':'+p+'%').join(' ')+flag);
}

// Write back
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
fs.writeFileSync('index.html', newHtml);
console.log('\nTotal:', q.length, 'Broken:', q.filter(x => !x.q || !x.o || x.o.length<4 || x.a===undefined).length);
