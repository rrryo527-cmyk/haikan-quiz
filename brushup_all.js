const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
if (!m) { console.error('Pattern not found'); process.exit(1); }
const q = eval(m[2]);
console.log('Before:', q.length);

// ===== Step 1: Remove duplicates (keep the one with better quality) =====
const seen = {};
const unique = [];
let dupeCount = 0;
q.forEach((item, i) => {
  const key = item.q.substring(0, 30);
  if (seen[key] !== undefined) {
    dupeCount++;
    // Keep the one with longer explanation or more complete oex
    const existing = unique[seen[key]];
    const existingQuality = existing.ex.length + (existing.oex ? existing.oex.join('').length : 0);
    const newQuality = item.ex.length + (item.oex ? item.oex.join('').length : 0);
    if (newQuality > existingQuality) {
      unique[seen[key]] = item; // Replace with better quality
    }
  } else {
    seen[key] = unique.length;
    unique.push(item);
  }
});
console.log('Duplicates removed:', dupeCount);
console.log('After dedup:', unique.length);

// ===== Step 2: Fix truncated oex (ending without period) =====
let fixedOex = 0;
unique.forEach(item => {
  if (!item.oex || item.oex.length !== item.o.length) return;
  item.oex = item.oex.map((oex, i) => {
    let s = oex;
    // Remove trailing incomplete chars
    if (s.length > 5 && !s.endsWith('。') && !s.endsWith('）') && !s.endsWith(')') && !s.endsWith('す') && !s.endsWith('る')) {
      // Check if it seems truncated (ends mid-sentence)
      if (s.length > 10) {
        // Add period if missing
        if (!s.endsWith('。')) {
          s = s + '。';
          fixedOex++;
        }
      }
    }
    return s;
  });
});
console.log('Fixed truncated oex:', fixedOex);

// ===== Step 3: Fix short/lazy oex patterns =====
// Pattern: "不正解。○○ではなく、△△が正しい答えです。" -> improve
let improvedOex = 0;
unique.forEach(item => {
  if (!item.oex || item.oex.length !== item.o.length) return;
  item.oex = item.oex.map((oex, i) => {
    // Fix very short oex (< 10 chars) by generating from ex
    if (oex.length < 10 && item.ex) {
      improvedOex++;
      if (i === item.a) {
        return '正解。' + item.ex.substring(0, 80);
      } else {
        return '不正解。' + item.o[i] + 'は誤りです。' + item.ex.substring(0, 60);
      }
    }
    return oex;
  });
});
console.log('Improved short oex:', improvedOex);

// ===== Step 4: Ensure all questions have oex =====
let addedOex = 0;
unique.forEach(item => {
  if (!item.oex || item.oex.length !== item.o.length) {
    addedOex++;
    item.oex = item.o.map((opt, i) => {
      if (i === item.a) {
        return '正解。' + item.ex.substring(0, 80);
      } else {
        return '不正解。' + opt + 'は誤りです。' + item.ex.substring(0, 60);
      }
    });
  }
});
console.log('Added missing oex:', addedOex);

// ===== Step 5: Verify genre distribution =====
const gc = {};
unique.forEach(x => { gc[x.genre] = (gc[x.genre] || 0) + 1; });
console.log('\nGenre distribution:');
Object.keys(gc).sort((a, b) => a - b).forEach(g => console.log('  Genre ' + g + ': ' + gc[g]));

// ===== Serialize and save =====
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
unique.forEach((item, i) => {
  if (i > 0) arr += ',';
  arr += '{q:' + escStr(item.q) + ',o:[' + item.o.map(escStr).join(',') + '],a:' + item.a + ',genre:' + item.genre + ',d:' + item.d + ',ex:' + escStr(item.ex) + ',oex:[' + item.oex.map(escStr).join(',') + ']';
  if (item.img) arr += ',img:' + escStr(item.img);
  arr += '}';
});
arr += ']';
const newHtml = html.replace(/(const ALL_QUESTIONS=)\[[\s\S]*?\];/, 'const ALL_QUESTIONS=' + arr + ';');
fs.writeFileSync('index.html', newHtml);
console.log('\nFinal total:', unique.length);
console.log('With images:', unique.filter(x => x.img).length);
