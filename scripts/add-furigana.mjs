import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import KuroshiroModule from 'kuroshiro';
import KuromojiAnalyzerModule from 'kuroshiro-analyzer-kuromoji';

const Kuroshiro = KuroshiroModule.default.default || KuroshiroModule.default;
const KuromojiAnalyzer = KuromojiAnalyzerModule.default || KuromojiAnalyzerModule;

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = resolve(__dirname, '../src/data/grammar');

const files = ['n5.json', 'n4.json', 'n3.json', 'n2.json', 'n1.json'];

const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer());

function hasJapanese(text) {
  return /[　-〿぀-ゟ゠-ヿ＀-￯一-龯㐀-䶿]/.test(text);
}

async function addFurigana(entry) {
  // Add furigana to example sentences
  for (const ex of entry.examples) {
    if (ex.jp && hasJapanese(ex.jp) && !ex.jpFuri) {
      try {
        ex.jpFuri = await kuroshiro.convert(ex.jp, { to: 'hiragana', mode: 'furigana' });
      } catch (e) {
        console.warn(`  Failed to convert: ${ex.jp} — ${e.message}`);
      }
    }
  }
}

for (const file of files) {
  const path = resolve(dir, file);
  const data = JSON.parse(readFileSync(path, 'utf-8'));
  console.log(`Processing ${file}...`);
  for (const entry of data) {
    await addFurigana(entry);
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  const total = data.reduce((sum, e) => sum + e.examples.filter(ex => ex.jpFuri).length, 0);
  console.log(`✓ ${file} — ${total} examples with furigana`);
}

console.log('Done!');
