export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface Example {
  jp: string;
  cn: string;
  en: string;
  jpFuri?: string;
}

export interface Related {
  id: string;
  relation: string;
}

export interface GrammarPoint {
  id: string;
  level: JLPTLevel;
  pattern: string;
  meaning: string;
  usage: string;
  explanation: string;
  colloquial: string;
  examples: Example[];
  related: Related[];
  repeatIn: string[];
  category: string;
}
