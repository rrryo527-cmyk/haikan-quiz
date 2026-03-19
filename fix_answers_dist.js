const fs = require('fs');
const html = fs.readFileSync('配管クイズv4.html', 'utf8');

const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
if (!m) { console.log('NOT FOUND'); process.exit(1); }
const q = eval(m[2]);
console.log('Before - Total:', q.length);

const before = {0:0, 1:0, 2:0, 3:0};
q.forEach(x => { before[x.a]++; });
console.log('Before distribution:', JSON.stringify(before));

let seed = 42;
function seededRandom() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

q.forEach((item) => {
  const opts = [...item.o];
  const oexArr = item.oex ? [...item.oex] : ['', '', '', ''];
  const correctIdx = item.a;
  const indices = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  item.o = indices.map(i => opts[i]);
  item.oex = indices.map(i => oexArr[i]);
  item.a = indices.indexOf(correctIdx);
});

const after = {0:0, 1:0, 2:0, 3:0};
q.forEach(x => { after[x.a]++; });
console.log('After distribution:', JSON.stringify(after));

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
console.log('Done! Answer positions redistributed.');
