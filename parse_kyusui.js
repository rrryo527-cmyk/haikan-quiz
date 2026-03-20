const fs = require('fs');
const pdfParse = require('pdf-parse');

const BASE = 'C:/Users/rrryo/OneDrive/デスクトップ/過去問/';

async function extractText(filepath) {
  const buf = fs.readFileSync(filepath);
  const data = await pdfParse(buf);
  return data.text;
}

function parseAnswers(text) {
  const result = {};
  let matches = [...text.matchAll(/(\d+)\s*[（(](\d+)[）)]/g)];
  if (matches.length >= 40) {
    for (const m of matches) {
      const qNum = parseInt(m[1]);
      const aNum = parseInt(m[2]);
      if (qNum >= 1 && qNum <= 60) result[qNum] = aNum;
    }
  } else {
    matches = [...text.matchAll(/問題(\d+)\s*(\d)/g)];
    for (const m of matches) {
      const qNum = parseInt(m[1]);
      const aNum = parseInt(m[2]);
      if (qNum >= 1 && qNum <= 60) result[qNum] = aNum;
    }
  }
  return result;
}

function cleanFurigana(text) {
  const patterns = [
    [/誤\s*ご\s*嚥\s*えん/g, '誤嚥'],
    [/防\s*ぼう\s*錆\s*せい\s*剤\s*ざい/g, '防錆剤'],
    [/漏\s*ろう\s*洩\s*えい/g, '漏洩'],
    [/O\s*オー\s*/g, 'O'],
  ];
  for (const [p, r] of patterns) text = text.replace(p, r);
  text = text.replace(/\t/g, ' ');
  return text;
}

function stripInstructions(text) {
  const tocEnd = text.lastIndexOf('・・・');
  if (tocEnd > 0) {
    const afterToc = text.substring(tocEnd);
    const sectionMatch = afterToc.match(/\n(公衆衛生概論|給水装置の概要)\s*\n/);
    if (sectionMatch) {
      return text.substring(tocEnd + afterToc.indexOf(sectionMatch[0]));
    }
  }
  const examStart = text.search(/試[\s　]*験[\s　]*問[\s　]*題/);
  if (examStart > 0) {
    const afterExam = text.substring(examStart);
    const sectionMatch = afterExam.match(/\n(公衆衛生概論|給水装置の概要)\s*\n/);
    if (sectionMatch) {
      return text.substring(examStart + afterExam.indexOf(sectionMatch[0]));
    }
  }
  return text;
}

function parseQuestionsFromText(fullText, startQ, endQ) {
  const questions = [];
  let text = fullText;

  text = text.replace(/\d{4}_\d{2}_SYO\d+_[A-Z]\.indd\s+\d+\d{4}\/\d{2}\/\d{2}\s+\d+:\d+/g, '\n');
  text = stripInstructions(text);

  const qPattern = /問題[\s\t　]+/g;
  const qPositions = [];
  let match;
  while ((match = qPattern.exec(text)) !== null) {
    qPositions.push(match.index);
  }

  if (qPositions.length === 0) return questions;

  let expectedQ = startQ;

  for (let i = 0; i < qPositions.length; i++) {
    const start = qPositions[i];
    const end = i + 1 < qPositions.length ? qPositions[i + 1] : text.length;
    let block = text.substring(start, end);

    const numMatch = block.match(/^問題[\s\t　]+([^\s\t\n]+?)[\s\t　]+/);
    if (!numMatch) continue;

    let numStr = numMatch[1];
    let qNum = parseInt(numStr);

    // Check if the parsed number makes sense in sequence
    // If it's a partial parse (e.g., "3û" parsed as 3), use expected
    if (isNaN(qNum) || qNum < startQ || qNum > endQ) {
      qNum = expectedQ;
    } else if (numStr.length > String(qNum).length) {
      // Garbled: "3û" parsed as 3 but has extra chars
      qNum = expectedQ;
    } else if (qNum < expectedQ - 1) {
      // Number went backwards (e.g., Q3 after Q33) - must be garbled
      qNum = expectedQ;
    }
    expectedQ = qNum + 1;

    let body = block.substring(numMatch[0].length).trim();
    body = body.replace(/^\d+\n/gm, '');

    let questionText = '';
    let options = [];

    // Strategy 1: 正誤 combination table
    const seigoMatch = body.match(/ア\s+イ\s+ウ\s+エ\s*\n/);
    if (seigoMatch) {
      const idx = body.indexOf(seigoMatch[0]);
      questionText = body.substring(0, idx).trim();
      const after = body.substring(idx + seigoMatch[0].length).trim();
      for (const line of after.split('\n')) {
        const om = line.match(/^\s*\((\d+)\)\s+(.*)/);
        if (om) options.push(om[2].trim().replace(/\s{2,}/g, '　'));
      }
    }

    // Strategy 2: Table header
    if (options.length < 4) {
      options = [];
      const tableMatch = body.match(/\n(ア\s+イ\s+ウ[^\n]*)\n/);
      if (tableMatch && !seigoMatch) {
        const idx = body.indexOf(tableMatch[0]);
        questionText = body.substring(0, idx).trim();
        const after = body.substring(idx + tableMatch[0].length).trim();
        for (const line of after.split('\n')) {
          const om = line.match(/^\s*\((\d+)\)\s+(.*)/);
          if (om) options.push(om[2].trim().replace(/\s{2,}/g, '　'));
        }
      }
    }

    // Strategy 3: Standard options
    if (options.length < 4) {
      options = [];
      const firstOpt = body.match(/\n\s*\(1\)[\s\t]/);
      if (firstOpt) {
        const idx = body.indexOf(firstOpt[0]);
        questionText = body.substring(0, idx).trim();
        const optSection = body.substring(idx).trim();
        const optBlocks = optSection.split(/\n(?=\s*\(\d+\)[\s\t])/);
        for (const ob of optBlocks) {
          const om = ob.match(/^\s*\((\d+)\)[\s\t]+([\s\S]*)/);
          if (om) {
            let optText = om[2].trim().replace(/\n[\s\t]*/g, '');
            options.push(optText);
          }
        }
      }
    }

    if (!questionText) questionText = body;

    questionText = questionText.replace(/\n[\s\t]*/g, '').trim();
    questionText = cleanFurigana(questionText);
    options = options.map(o => cleanFurigana(o).trim());

    if (options.length >= 4 && options.length <= 5) {
      questions.push({ num: qNum, text: questionText, options });
    }
  }

  return questions;
}

// Manual entries for questions that can't be auto-parsed
// Q34 is a figure-based question (動水勾配線の図) - excluded as it requires the figure
function getManualQuestions() {
  return [
    {
      num: 48,
      text: '水道メーターに関する次の記述の正誤の組み合わせのうち、適当なものはどれか。ア 水道メーターは、許容流量範囲を超えて水を流すと、正しい計量ができなくなるおそれがあるため、水道メーターの呼び径決定に際しては、適正使用流量範囲、瞬時使用の許容流量等に十分留意する必要がある。イ 水道メーターの計量方法は、流れている水の流速を測定して流量に換算する流速式（推測式）と、水の体積を測定する容積式（実測式）に分類され、わが国で使用されている水道メーターは、ほとんどが容積式である。ウ たて形軸流羽根車式水道メーターは、メーターケースに流入した水流が、整流器を通って、垂直に設置された螺旋状羽根車に沿って下から上方向に流れ、羽根車を回転させる構造であり、水の流れが水道メーター内で迂流するため損失水頭が小さい。エ 電磁式水道メーターは、給水管と同じ呼び径の直管で機械的可動部がないため耐久性に優れ、小流量から大流量まで広範囲な計測に適する。',
      options: [
        '正　正　誤　誤',
        '誤　誤　正　正',
        '正　誤　誤　正',
        '誤　正　正　誤'
      ]
    }
  ];
}

async function main() {
  console.log('=== Processing R7 ===\n');

  const ansText = await extractText(BASE + 'file-r07_seitou-num.pdf');
  const answers = parseAnswers(ansText);
  answers[18] = 4;
  console.log(`Answers: ${Object.keys(answers).length}`);

  const q1Text = await extractText(BASE + 'file-r07_gakka-01.pdf');
  const q2Text = await extractText(BASE + 'file-r07_gakka-02.pdf');

  const questions1 = parseQuestionsFromText(q1Text, 1, 40);
  const questions2 = parseQuestionsFromText(q2Text, 41, 60);

  console.log(`Gakka-01: ${questions1.length} questions`);
  console.log(`Gakka-02: ${questions2.length} questions`);

  let allQ = [...questions1, ...questions2];

  // Add manual questions for figure-based problems
  const manual = getManualQuestions();
  for (const mq of manual) {
    if (!allQ.find(q => q.num === mq.num)) {
      allQ.push(mq);
      console.log(`Added manual Q${mq.num}`);
    }
  }

  // Sort by question number
  allQ.sort((a, b) => a.num - b.num);

  // Remove duplicates (keep the one with valid content)
  const deduped = [];
  for (const q of allQ) {
    const existing = deduped.find(d => d.num === q.num);
    if (!existing) {
      deduped.push(q);
    } else {
      // Keep the one with longer question text (more likely to be real question)
      if (q.text.length > existing.text.length) {
        const idx = deduped.indexOf(existing);
        deduped[idx] = q;
      }
    }
  }

  // Check coverage
  const found = new Set(deduped.map(q => q.num));
  const missing = [];
  for (let i = 1; i <= 60; i++) {
    if (!found.has(i)) missing.push(i);
  }
  if (missing.length > 0) console.log(`Missing: ${missing.join(', ')}`);
  else console.log('All 60 questions covered!');

  const result = [];
  for (const q of deduped) {
    const ans = answers[q.num];
    if (!ans) { console.log(`  No answer for Q${q.num}`); continue; }
    if (ans - 1 >= q.options.length) {
      console.log(`  Q${q.num}: answer ${ans} out of range (${q.options.length} opts)`);
      continue;
    }
    result.push({
      q: q.text,
      o: q.options,
      a: ans - 1,
      genre: 10,
      d: 2,
      ex: q.num === 18 ? 'R7 Q18（全員正解扱い）' : `R7 Q${q.num}`
    });
  }

  console.log(`\nTotal: ${result.length} questions`);
  console.log(`4-choice: ${result.filter(r => r.o.length === 4).length}`);
  console.log(`5-choice: ${result.filter(r => r.o.length === 5).length}`);

  const badA = result.filter(r => r.a < 0 || r.a >= r.o.length);
  console.log(`Bad answer indices: ${badA.length}`);

  fs.writeFileSync(
    'C:/Users/rrryo/OneDrive/haikan-quiz/kyusui_pastexam_questions.json',
    JSON.stringify(result, null, 2),
    'utf-8'
  );
  console.log(`\nSaved to kyusui_pastexam_questions.json`);

  console.log('\n=== R3-R6: Image PDFs ===');
  for (const y of [3, 4, 5, 6]) {
    const t = await extractText(BASE + `file-r0${y}_gakka-01.pdf`);
    const kanji = (t.match(/[\u4e00-\u9fff]/g) || []).length;
    console.log(`  R${y}: ${kanji} kanji -> テキスト抽出不可（画像PDF）`);
  }
}

main().catch(console.error);
