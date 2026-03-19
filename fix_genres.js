const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
if (!m) { console.error('Pattern not found'); process.exit(1); }
const q = eval(m[2]);
console.log('Before:', q.length);

// GENRES: 0=配管工事 1=消防設備点検 2=貯水槽清掃 3=排水管清掃 4=設備点検
// 5=ビジネスマナー 6=内装工事 7=管工事施工管理 8=土木施工管理 9=建築施工管理
// 10=給水装置 11=第2種電気工事士

let fixes = 0;

q.forEach((item, i) => {
  const t = item.q;
  const oldGenre = item.genre;
  let newGenre = oldGenre;

  // === 給水装置過去問 → Genre 10 ===
  if (t.includes('給水装置') && t.includes('【') && t.includes('問') && oldGenre !== 10) {
    newGenre = 10;
  }

  // === クロスコネクション・排水トラップ封水・直結増圧 → Genre 0 (配管工事) ===
  if ((t.includes('クロスコネクション') || (t.includes('排水トラップ') && t.includes('封水深')) || t.includes('直結増圧方式')) && oldGenre === 1) {
    newGenre = 0;
  }

  // === 冷凍機・ヒートポンプ・R410A・COP → Genre 7 (管工事施工管理) ===
  if ((t.includes('冷凍機') || t.includes('ヒートポンプ') || t.includes('R410A') || (t.includes('COP') && t.includes('成績係数'))) && (oldGenre === 2)) {
    newGenre = 7;
  }

  // === ガス設備 → Genre 7 (管工事施工管理) （排水管清掃に混入している場合） ===
  if ((t.includes('都市ガス') || t.includes('不完全燃焼')) && oldGenre === 3 && !t.includes('排水')) {
    newGenre = 7;
  }

  // === 法規問題 (Genre 5 ビジネスマナーに混入) → Genre 9 (建築施工管理) ===
  if (oldGenre === 5 && (
    t.includes('労働安全衛生法') || t.includes('建築基準法') || t.includes('消防法') ||
    t.includes('建設リサイクル法') || t.includes('労働基準法') || t.includes('道路法') ||
    t.includes('浄化槽法') || t.includes('酸素欠乏') || t.includes('確認申請') ||
    t.includes('作業主任者') || t.includes('安全衛生責任者') || t.includes('安全管理者') ||
    t.includes('防火管理者') || t.includes('道路占用')
  )) {
    newGenre = 9;
  }

  // === 建築構造問題 (Genre 6 内装工事に混入) → Genre 9 (建築施工管理) ===
  if (oldGenre === 6 && (
    t.includes('カーテンウォール') || t.includes('免震') || t.includes('防火区画') ||
    t.includes('鉄骨構造') || t.includes('鉄筋コンクリート') || t.includes('基礎の種類') ||
    t.includes('軟弱地盤') || t.includes('かぶり厚') || t.includes('溶込み溶接') ||
    t.includes('異形鉄筋') || t.includes('柱脚') || t.includes('耐震設計') ||
    t.includes('層間変形角') || t.includes('N値') || t.includes('スランプ試験') ||
    t.includes('アスファルト防水') || t.includes('切妻屋根')
  )) {
    newGenre = 9;
  }

  // === 建築設備問題 (Genre 8 土木に混入) → Genre 1 (消防設備点検) or Genre 4 (設備点検) ===
  if (oldGenre === 8) {
    // 消防設備系 → Genre 1
    if (t.includes('自動火災報知') || t.includes('P型受信機') || t.includes('誘導灯') ||
        t.includes('排煙設備') || t.includes('消火栓') || t.includes('連結送水管')) {
      newGenre = 1;
    }
    // その他の建築設備 → Genre 4 (設備点検)
    if (t.includes('避雷') || t.includes('ガス漏れ警報') || t.includes('BEMS') ||
        t.includes('通気管') || t.includes('換気量') || t.includes('非常用照明') ||
        t.includes('エレベーター')) {
      newGenre = 4;
    }
  }

  // === 施工管理問題 (Genre 4 設備点検に混入) → Genre 7 (管工事施工管理) ===
  if (oldGenre === 4 && (
    t.includes('バーチャート') || t.includes('ネットワーク工程表') || t.includes('クリティカルパス') ||
    t.includes('パレート図') || t.includes('特性要因図') || t.includes('管理図') ||
    t.includes('PDCA') || t.includes('施工体制台帳') || t.includes('安全衛生責任者を選任')
  )) {
    newGenre = 7;
  }

  // === 管工事過去問で法規系 → Genre 9 (建築施工管理) ===
  if (oldGenre === 7 && t.includes('【') && (
    (t.includes('No.42') && t.includes('建築基準法')) ||
    (t.includes('No.43') && t.includes('建設業法')) ||
    (t.includes('No.44') && t.includes('建設業法'))
  )) {
    newGenre = 9;
  }

  if (newGenre !== oldGenre) {
    fixes++;
    item.genre = newGenre;
  }
});

console.log('Genre fixes applied:', fixes);

// Verify final distribution
const gc = {};
q.forEach(x => { gc[x.genre] = (gc[x.genre] || 0) + 1; });
console.log('\nFinal genre distribution:');
const GENRES = ['配管工事','消防設備点検','貯水槽清掃','排水管清掃','設備点検','ビジネスマナー','内装工事','管工事施工管理','土木施工管理','建築施工管理','給水装置','第2種電気工事士'];
Object.keys(gc).sort((a, b) => a - b).forEach(g => console.log('  ' + g + ' ' + GENRES[g] + ': ' + gc[g]));

// Serialize and save
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
console.log('\nSaved successfully');
