const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
if (!m) { console.error('Pattern not found'); process.exit(1); }
const q = eval(m[2]);
console.log('Before:', q.length);

let fixes = 0;

// === 1. ジャンル修正 ===
const genreFixes = [
  {idx: 61, from: 0, to: 7, reason: '管工事施工管理技士の資格 → 管工事施工管理'},
  {idx: 73, from: 0, to: 7, reason: '管工事業の建設業許可の専任技術者 → 管工事施工管理'},
  {idx: 94, from: 0, to: 7, reason: '管工事施工管理技術検定の受験資格 → 管工事施工管理'},
  {idx: 597, from: 2, to: 10, reason: '配水管からの分岐（サドル付分水栓）→ 給水装置'},
];

genreFixes.forEach(f => {
  if (q[f.idx].genre === f.from) {
    q[f.idx].genre = f.to;
    console.log('Genre fix #' + f.idx + ': ' + f.from + ' -> ' + f.to + ' (' + f.reason + ')');
    fixes++;
  }
});

// === 2. 追加のジャンル確認（パターンマッチ） ===
const gNames = ['配管工事','消防設備点検','貯水槽清掃','排水管清掃','設備点検','ビジネスマナー','内装工事','管工事施工管理','土木施工管理','建築施工管理','給水装置','第2種電気工事士'];

// 給水装置の問題が配管工事(0)にある場合
q.forEach((x, i) => {
  const text = x.q + ' ' + (x.ex || '');
  // 給水装置工事の問題が配管工事(0)にある
  if (x.genre === 0 && (text.includes('給水装置工事主任技術者') || (text.includes('水道メーター') && text.includes('給水装置')))) {
    if (!text.includes('施工管理')) {
      console.log('Genre fix #' + i + ': 0 -> 10 (給水装置関連: ' + x.q.substring(0,40) + ')');
      x.genre = 10;
      fixes++;
    }
  }
  // 消防設備点検の問題が設備点検(4)にある
  if (x.genre === 4 && (text.includes('消防設備点検') || text.includes('消防設備士')) && !text.includes('建築設備')) {
    console.log('Genre fix #' + i + ': 4 -> 1 (消防設備: ' + x.q.substring(0,40) + ')');
    x.genre = 1;
    fixes++;
  }
});

// === 3. oex（選択肢解説）の品質チェック・修正 ===
let shortOex = 0;
q.forEach((x, i) => {
  if (x.oex) {
    x.oex.forEach((oex, j) => {
      // 解説が「。」で終わっていない場合追加
      if (oex && oex.length > 5 && !oex.endsWith('。') && !oex.endsWith('）') && !oex.endsWith(')') && !oex.endsWith('す') && !oex.endsWith('ん')) {
        x.oex[j] = oex + '。';
        shortOex++;
      }
    });
  }
});
console.log('oex末尾「。」追加:', shortOex);
fixes += shortOex;

// === 4. 回答バランスチェック ===
const ans = [0, 0, 0, 0];
q.forEach(x => ans[x.a]++);
console.log('\n=== 回答分布 ===');
ans.forEach((v, i) => console.log('  ' + i + ': ' + v + ' (' + Math.round(v / q.length * 100) + '%)'));

// === 5. ジャンル分布最終確認 ===
const genres = {};
q.forEach(x => { genres[x.genre] = (genres[x.genre] || 0) + 1; });
console.log('\n=== ジャンル分布 ===');
Object.keys(genres).sort((a, b) => a - b).forEach(g => console.log('  ' + g + ' ' + gNames[g] + ': ' + genres[g]));

// === 書き出し ===
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

console.log('\nTotal fixes:', fixes);
console.log('Total questions:', q.length);
console.log('Broken:', q.filter(x => !x.q || !x.o || x.o.length < 4 || x.a === undefined || !x.ex || !x.oex || x.oex.length < 4).length);
