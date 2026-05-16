import type { JLPTLevel } from './grammar';

export interface KanjiExample {
  word: string;
  reading: string;
  meaning: string;
  cn?: string;
}

export interface KanjiEntry {
  id: string;
  level: JLPTLevel;
  character: string;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  strokeCount: number;
  category: string;
  examples: KanjiExample[];
}
