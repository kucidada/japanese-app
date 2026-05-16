import n5 from './grammar/n5.json';
import n4 from './grammar/n4.json';
import n3 from './grammar/n3.json';
import n2 from './grammar/n2.json';
import n1 from './grammar/n1.json';
import kanjiN5 from './kanji/n5.json';
import kanjiN4 from './kanji/n4.json';
import kanjiN3 from './kanji/n3.json';
import kanjiN2 from './kanji/n2.json';
import kanjiN1 from './kanji/n1.json';
import type { GrammarPoint, JLPTLevel } from '@/types/grammar';
import type { KanjiEntry } from '@/types/kanji';

const allGrammar: GrammarPoint[] = [...n5, ...n4, ...n3, ...n2, ...n1] as GrammarPoint[];

const grammarMap = new Map<string, GrammarPoint>();
for (const g of allGrammar) {
  grammarMap.set(g.id, g);
}

const grammarByLevel = new Map<JLPTLevel, GrammarPoint[]>();
for (const level of ['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]) {
  grammarByLevel.set(level, allGrammar.filter(g => g.level === level));
}

export function getAllGrammar(): GrammarPoint[] {
  return allGrammar;
}

export function getGrammarByLevel(level: JLPTLevel): GrammarPoint[] {
  return grammarByLevel.get(level) ?? [];
}

export function getGrammarById(id: string): GrammarPoint | undefined {
  return grammarMap.get(id);
}

export function getLevels(): { level: JLPTLevel; count: number }[] {
  return (['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(level => ({
    level,
    count: grammarByLevel.get(level)?.length ?? 0,
  }));
}

export function searchGrammar(query: string): GrammarPoint[] {
  const q = query.toLowerCase();
  return allGrammar.filter(
    g =>
      g.pattern.toLowerCase().includes(q) ||
      g.meaning.toLowerCase().includes(q) ||
      g.explanation.toLowerCase().includes(q) ||
      g.examples.some(e => e.jp.includes(q) || e.cn.includes(q))
  );
}

export function getRelatedGrammar(id: string): (GrammarPoint & { relation: string })[] {
  const point = grammarMap.get(id);
  if (!point) return [];
  return point.related
    .map(r => {
      const found = grammarMap.get(r.id);
      return found ? { ...found, relation: r.relation } : null;
    })
    .filter((r): r is GrammarPoint & { relation: string } => r !== null);
}

export function getGrammarByCategory(level: JLPTLevel): Map<string, GrammarPoint[]> {
  const points = grammarByLevel.get(level) ?? [];
  const byCategory = new Map<string, GrammarPoint[]>();
  for (const p of points) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }
  return byCategory;
}

// ─── Kanji ────────────────────────────────────────────────────────────────────

const allKanji: KanjiEntry[] = [...kanjiN5, ...kanjiN4, ...kanjiN3, ...kanjiN2, ...kanjiN1] as KanjiEntry[];

const kanjiMap = new Map<string, KanjiEntry>();
for (const k of allKanji) {
  kanjiMap.set(k.id, k);
}

const kanjiByLevel = new Map<JLPTLevel, KanjiEntry[]>();
for (const level of ['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]) {
  kanjiByLevel.set(level, allKanji.filter(k => k.level === level));
}

export function getAllKanji(): KanjiEntry[] {
  return allKanji;
}

export function getKanjiByLevel(level: JLPTLevel): KanjiEntry[] {
  return kanjiByLevel.get(level) ?? [];
}

export function getKanjiById(id: string): KanjiEntry | undefined {
  return kanjiMap.get(id);
}

export function getKanjiLevels(): { level: JLPTLevel; count: number }[] {
  return (['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(level => ({
    level,
    count: kanjiByLevel.get(level)?.length ?? 0,
  }));
}

export function searchKanji(query: string): KanjiEntry[] {
  const q = query.toLowerCase();
  return allKanji.filter(
    k =>
      k.character.includes(q) ||
      k.meaning.toLowerCase().includes(q) ||
      k.onyomi.some(o => o.toLowerCase().includes(q)) ||
      k.kunyomi.some(o => o.toLowerCase().includes(q)) ||
      k.examples.some(e => e.word.includes(q) || e.meaning.toLowerCase().includes(q))
  );
}
