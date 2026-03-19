const fs = require('fs');
let html = fs.readFileSync('配管クイズv4.html', 'utf8');
const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
const q = eval(m[2]);
console.log('Total:', q.length);

let fixed = 0;
q.forEach((item) => {
  // Fix truncated oex (ending with …)
  item.oex = item.oex.map((exp, j) => {
    if (exp.endsWith('…')) {
      fixed++;
      // Remove the … and add proper ending
      let fixedExp = exp.replace(/…$/, '');
      // Add a period if the text doesn't end with one
      if (!fixedExp.endsWith('。') && !fixedExp.endsWith('）') && !fixedExp.endsWith(')')) {
        fixedExp += '。';
      }
      return fixedExp;
    }
    return exp;
  });

  // Fix very short/vague questions
  if (item.q === '「インサート」を使用する目的はどれか？') {
    item.q = '配管工事で使用される「インサート」（埋め込み金物）の主な使用目的はどれか？';
  }
});

// Also fix oex that just say "不正解。XXXではなく、YYYが正しい答えです。" - make them more informative
q.forEach((item) => {
  item.oex = item.oex.map((exp, j) => {
    // Replace generic "この選択肢は該当しません" with specific explanation
    if (exp.includes('この選択肢は該当しません')) {
      const correctAnswer = item.o[item.a];
      if (j === item.a) {
        return '正解。' + item.ex;
      } else {
        return '不正解。正しくは「' + correctAnswer + '」です。' + item.ex;
      }
    }
    return exp;
  });
});

console.log('Fixed truncated oex:', fixed);

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
let remaining = 0;
q.forEach(item => {
  item.oex.forEach(exp => {
    if (exp.endsWith('…')) remaining++;
  });
});
console.log('Remaining truncated:', remaining);
console.log('Done!');
