'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllGrammar } from '@/data';
import {
  getStudiedRecords,
  getFocusItems,
  markQuizResult,
} from '@/lib/study-engine';
import { generateTest, calculateResults } from '@/lib/test-engine';
import LevelBadge from '@/components/LevelBadge';
import type { JLPTLevel } from '@/types/grammar';
import type { TestQuestion } from '@/lib/test-engine';

const LEVEL_LABEL: Record<JLPTLevel, string> = {
  N5: 'N5 入门',
  N4: 'N4 初级',
  N3: 'N3 中级',
  N2: 'N2 中上级',
  N1: 'N1 高级',
};

const LEVEL_COLOR: Record<JLPTLevel, string> = {
  N5: 'bg-emerald-500',
  N4: 'bg-sky-500',
  N3: 'bg-amber-500',
  N2: 'bg-orange-500',
  N1: 'bg-rose-500',
};

function OptionButton({
  text,
  index,
  selected,
  reveal,
  isCorrect,
  disabled,
  onSelect,
}: {
  text: string;
  index: number;
  selected: boolean;
  reveal: boolean;
  isCorrect: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const labels = ['A', 'B', 'C', 'D'];
  let bg = 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600';
  if (reveal && isCorrect) bg = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600';
  else if (reveal && selected && !isCorrect) bg = 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600';
  else if (selected) bg = 'border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-900/20';

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${bg} ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
        {labels[index]}
      </span>
      <span className="text-zinc-800 dark:text-zinc-200">{text}</span>
    </button>
  );
}

export default function QuizPage() {
  const router = useRouter();
  const allGrammar = useMemo(() => getAllGrammar(), []);

  // Generate quiz questions from studied grammar, weighted by focus items
  const questions = useMemo((): TestQuestion[] => {
    const studied = getStudiedRecords();
    const focusItems = getFocusItems();
    const studiedIds = new Set(studied.map(r => r.grammarId));
    const studiedGrammar = allGrammar.filter(g => studiedIds.has(g.id));

    if (studiedGrammar.length === 0) return [];

    // Always include focus items (wrong answers)
    const focusIds = new Set(focusItems.map(f => f.grammarId));
    const focusGrammar = studiedGrammar.filter(g => focusIds.has(g.id));

    // Pick 8 total: prioritize focus items, fill rest with random studied grammar
    const picked = new Set<string>();
    const selected: typeof studiedGrammar = [];

    // Add focus items first
    const shuffledFocus = [...focusGrammar].sort(() => Math.random() - 0.5);
    for (const g of shuffledFocus) {
      if (selected.length >= 8) break;
      selected.push(g);
      picked.add(g.id);
    }

    // Fill remaining with random studied grammar
    const rest = studiedGrammar.filter(g => !picked.has(g.id)).sort(() => Math.random() - 0.5);
    for (const g of rest) {
      if (selected.length >= 8) break;
      selected.push(g);
    }

    // Build questions (same format as test engine)
    return selected.map(point => {
      const distractors = studiedGrammar
        .filter(g => g.id !== point.id)
        .map(g => g.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Pad if not enough distractors
      while (distractors.length < 3) {
        const extra = allGrammar
          .filter(g => g.id !== point.id && !distractors.includes(g.meaning))
          .map(g => g.meaning);
        distractors.push(...extra.sort(() => Math.random() - 0.5).slice(0, 3 - distractors.length));
      }

      const options = [point.meaning, ...distractors].sort(() => Math.random() - 0.5);
      return {
        pattern: point.pattern,
        correctMeaning: point.meaning,
        options,
        level: point.level,
        grammarId: point.id,
      };
    });
  }, [allGrammar]);

  const [phase, setPhase] = useState<'start' | 'testing' | 'result'>('start');
  const [current, setCurrent] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ grammarId: string; correct: boolean; level: JLPTLevel }[]>([]);

  const studiedCount = useMemo(() => getStudiedRecords().length, []);
  const focusItems = useMemo(() => getFocusItems(), []);

  const handleSelect = useCallback(
    (idx: number) => {
      if (selectedIdx !== null) return;
      setSelectedIdx(idx);

      const q = questions[current];
      const correct = q.options[idx] === q.correctMeaning;
      const newAnswers = [
        ...answers,
        { grammarId: q.grammarId, correct, level: q.level },
      ];
      setAnswers(newAnswers);

      // Record wrong answers
      markQuizResult(q.grammarId, q.level, correct);

      // Advance after delay
      setTimeout(() => {
        if (current < questions.length - 1) {
          setCurrent(c => c + 1);
          setSelectedIdx(null);
        } else {
          setPhase('result');
        }
      }, 1200);
    },
    [selectedIdx, questions, current, answers]
  );

  if (studiedCount === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/plan"
          className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← 返回学习计划
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            每日小测
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            还没有学习任何语法点，先去学习吧！
          </p>
          <Link
            href="/plan"
            className="mt-4 inline-block rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            去学习
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[phase === 'testing' ? current : 0];
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  // Result calculation
  const correctCount = answers.filter(a => a.correct).length;
  const wrongAnswers = answers.filter(a => !a.correct);
  const resultStats = LEVEL_LABEL;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/plan"
        className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ← 返回学习计划
      </Link>

      {phase === 'start' && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            每日小测
          </h1>
          <p className="mx-auto mb-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            共 {questions.length} 道题，来自已学的语法点。
          </p>
          {focusItems.length > 0 && (
            <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">
              * 包含 {focusItems.length} 个需重点加强的语法点
            </p>
          )}
          <button
            onClick={() => setPhase('testing')}
            className="rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            开始答题
          </button>
        </div>
      )}

      {phase === 'testing' && q && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-zinc-400">
              {current + 1}/{questions.length}
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium text-white ${LEVEL_COLOR[q.level]}`}
            >
              {LEVEL_LABEL[q.level]}
            </span>

            <h2 className="mb-1 mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {q.pattern}
            </h2>
            <p className="mb-5 text-sm text-zinc-400">选择正确的含义：</p>

            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <OptionButton
                  key={i}
                  text={opt}
                  index={i}
                  selected={selectedIdx === i}
                  reveal={selectedIdx !== null}
                  isCorrect={opt === q.correctMeaning}
                  disabled={selectedIdx !== null}
                  onSelect={() => handleSelect(i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              测验结果
            </h1>
            <p className="text-4xl font-bold text-violet-600">
              {correctCount}/{questions.length}
            </p>
            <p className="mt-1 text-sm text-zinc-400">正确</p>

            {wrongAnswers.length > 0 && (
              <div className="mt-6 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
                <p className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  需要加强 ({wrongAnswers.length})
                </p>
                <div className="space-y-1">
                  {wrongAnswers.map((w, i) => {
                    const g = allGrammar.find(gg => gg.id === w.grammarId);
                    return (
                      <Link
                        key={i}
                        href={`/plan/study/${w.grammarId}`}
                        className="block text-sm text-amber-600 underline hover:text-amber-700 dark:text-amber-400"
                      >
                        {g?.pattern} — {g?.meaning}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {wrongAnswers.length === 0 && (
              <div className="mt-6 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  全部正确，太棒了！
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPhase('start');
                setCurrent(0);
                setSelectedIdx(null);
                setAnswers([]);
              }}
              className="flex-1 rounded-xl bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              再来一次
            </button>
            <Link
              href="/plan"
              className="flex-1 rounded-xl bg-violet-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              返回学习计划
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
