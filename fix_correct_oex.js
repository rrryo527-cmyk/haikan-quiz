const fs = require('fs');
let html = fs.readFileSync('配管クイズv4.html', 'utf8');
const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
const q = eval(m[2]);

let fixed = 0;
q.forEach((item) => {
  // If the correct answer's oex doesn't contain "正解", prepend it
  if (item.oex[item.a] && !item.oex[item.a].includes('正解')) {
    const original = item.oex[item.a];
    // Remove leading "✓ " if present
    let cleaned = original.replace(/^✓\s*/, '');
    item.oex[item.a] = '正解。' + cleaned;
    fixed++;
  }
});

console.log('Fixed', fixed, 'correct oex entries');

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

// Verify
const verifyQ = eval(newHtml.match(/const ALL_QUESTIONS=(\[[\s\S]*?\]);/)[1]);
let remaining = 0;
verifyQ.forEach(item => {
  if (!item.oex[item.a].includes('正解')) remaining++;
});
console.log('Remaining without 正解:', remaining);
