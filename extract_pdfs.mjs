import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

const dir = 'C:/Users/rrryo/OneDrive/デスクトップ/過去問';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

const outputDir = 'C:/Users/rrryo/OneDrive/haikan-quiz/extracted_pdfs';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

for (const file of files) {
  try {
    const buf = new Uint8Array(fs.readFileSync(path.join(dir, file)));
    const doc = await getDocument({data: buf}).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    // Clean up furigana-style text
    const cleaned = text
      .replace(/\s{2,}/g, ' ')
      .replace(/[　]/g, '')
      .trim();

    const outFile = file.replace('.pdf', '.txt');
    fs.writeFileSync(path.join(outputDir, outFile), cleaned, 'utf-8');
    console.log(`OK: ${file} (${doc.numPages} pages, ${cleaned.length} chars)`);
  } catch(e) {
    console.log(`FAIL: ${file} - ${e.message}`);
  }
}
console.log('\nDone! Extracted', files.length, 'files');
