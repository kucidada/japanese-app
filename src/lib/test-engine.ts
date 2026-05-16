import type { GrammarPoint, JLPTLevel } from '@/types/grammar';

export interface TestQuestion {
  pattern: string;
  correctMeaning: string;
  options: string[]; // shuffled, 4 items
  level: JLPTLevel;
  grammarId: string;
}

export interface TestResult {
  answers: { grammarId: string; correct: boolean; level: JLPTLevel }[];
  scoreByLevel: Record<JLPTLevel, { correct: number; total: number }>;
  totalCorrect: number;
  totalQuestions: number;
  recommendedLevel: JLPTLevel;
}

const LEVEL_ORDER: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

/** Pick n random items from an array */
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Shuffle an array in place */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate test questions from grammar data.
 * Questions are "pattern → meaning" multiple choice from all levels.
 */
export function generateTest(
  allGrammar: GrammarPoint[],
  questionsPerLevel: number = 5
): TestQuestion[] {
  const questions: TestQuestion[] = [];

  for (const level of LEVEL_ORDER) {
    const levelPoints = allGrammar.filter(g => g.level === level);
    const selected = pickRandom(levelPoints, Math.min(questionsPerLevel, levelPoints.length));

    for (const point of selected) {
      // Get distractors: other grammar points' meanings from the same level
      const distractors = levelPoints
        .filter(g => g.id !== point.id)
        .map(g => g.meaning);

      // Pick 3 distractors
      const chosen = pickRandom(distractors, 3);

      // If not enough distractors from same level, pull from adjacent levels
      if (chosen.length < 3) {
        const others = allGrammar
          .filter(g => g.id !== point.id && !distractors.includes(g.meaning))
          .map(g => g.meaning);
        chosen.push(...pickRandom(others, 3 - chosen.length));
      }

      const options = shuffle([point.meaning, ...chosen]);

      questions.push({
        pattern: point.pattern,
        correctMeaning: point.meaning,
        options,
        level: point.level,
        grammarId: point.id,
      });
    }
  }

  return shuffle(questions);
}

/**
 * Calculate test results and recommend a level.
 * Recommendation: the lowest level where correct rate < 70%,
 * or N1 if all >= 70%.
 */
export function calculateResults(
  answers: { grammarId: string; correct: boolean; level: JLPTLevel }[]
): TestResult {
  const scoreByLevel: Record<string, { correct: number; total: number }> = {};

  for (const lvl of LEVEL_ORDER) {
    const levelAnswers = answers.filter(a => a.level === lvl);
    scoreByLevel[lvl] = {
      correct: levelAnswers.filter(a => a.correct).length,
      total: levelAnswers.length,
    };
  }

  const totalCorrect = answers.filter(a => a.correct).length;
  const totalQuestions = answers.length;

  // Recommend the first level where accuracy < 70%
  let recommendedLevel: JLPTLevel = 'N1';
  for (const lvl of LEVEL_ORDER) {
    const s = scoreByLevel[lvl];
    if (s.total > 0 && s.correct / s.total < 0.7) {
      recommendedLevel = lvl;
      break;
    }
  }

  return {
    answers,
    scoreByLevel: scoreByLevel as Record<JLPTLevel, { correct: number; total: number }>,
    totalCorrect,
    totalQuestions,
    recommendedLevel,
  };
}
