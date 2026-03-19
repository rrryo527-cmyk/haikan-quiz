const fs = require('fs');
let html = fs.readFileSync('配管クイズv4.html', 'utf8');
const m = html.match(/(const ALL_QUESTIONS=)(\[[\s\S]*?\]);/);
const q = eval(m[2]);
console.log('Before images:', q.filter(x=>x.img).length);

// Add Wikimedia Commons images to questions that match keywords
const imageMap = [
  // 管工事施工管理 genre:7
  {genre:7, keyword:'ダクト', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Climatisation.jpg/330px-Climatisation.jpg'},
  {genre:7, keyword:'冷凍機', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Centrifugal_chiller.jpg/330px-Centrifugal_chiller.jpg'},
  {genre:7, keyword:'ボイラー', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Heating_boiler.jpg/330px-Heating_boiler.jpg'},
  // 土木施工管理 genre:8
  {genre:8, keyword:'アスファルト舗装', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Asphalt_paving.jpg/330px-Asphalt_paving.jpg'},
  {genre:8, keyword:'バックホウ', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Bagger_Liebherr.jpg/330px-Bagger_Liebherr.jpg'},
  {genre:8, keyword:'コンクリート.*打設', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Concrete_pumping.jpg/330px-Concrete_pumping.jpg'},
  {genre:8, keyword:'鋼矢板', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Steel_sheet_pile.jpg/330px-Steel_sheet_pile.jpg'},
  // 建築施工管理 genre:9
  {genre:9, keyword:'鉄筋.*かぶり|かぶり厚さ', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Reinforcing_bars_in_concrete.jpg/330px-Reinforcing_bars_in_concrete.jpg'},
  {genre:9, keyword:'型枠', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Formwork_for_concrete.jpg/330px-Formwork_for_concrete.jpg'},
  {genre:9, keyword:'鉄骨.*溶接|溶接.*鉄骨', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/SMAW.weld.bead.jpg/330px-SMAW.weld.bead.jpg'},
  {genre:9, keyword:'足場', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Scaffolding_in_construction.jpg/330px-Scaffolding_in_construction.jpg'},
  // 給水装置 genre:10
  {genre:10, keyword:'水道メーター|量水器', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Water_meter.jpg/330px-Water_meter.jpg'},
  {genre:10, keyword:'受水槽', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Water_storage_tank.jpg/330px-Water_storage_tank.jpg'},
  // 第2種電気工事士 genre:11
  {genre:11, keyword:'リングスリーブ', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Wire_crimp_connector.jpg/330px-Wire_crimp_connector.jpg'},
  {genre:11, keyword:'分電盤', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Breaker_panel.jpg/330px-Breaker_panel.jpg'},
  // 内装工事 genre:6
  {genre:6, keyword:'石膏ボード', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Drywall.jpg/330px-Drywall.jpg'},
  {genre:6, keyword:'フローリング', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Hardwood_floor.jpg/330px-Hardwood_floor.jpg'},
  // 設備点検 genre:4
  {genre:4, keyword:'消火器', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Fire_extinguisher.jpg/330px-Fire_extinguisher.jpg'},
  {genre:4, keyword:'スプリンクラー', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Fire_sprinkler_head.jpg/330px-Fire_sprinkler_head.jpg'},
];

let added = 0;
imageMap.forEach(mapping => {
  const regex = new RegExp(mapping.keyword);
  // Find first matching question without image in the genre
  const match = q.find(item => item.genre === mapping.genre && !item.img && regex.test(item.q));
  if (match) {
    match.img = mapping.img;
    added++;
  }
});

console.log('Added images:', added);
console.log('Total with images:', q.filter(x=>x.img).length);

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
