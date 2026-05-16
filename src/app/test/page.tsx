'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { getAllGrammar } from '@/data';
import { generateTest, calculateResults } from '@/lib/test-engine';
import type { TestQuestion, TestResult } from '@/lib/test-engine';
import type { JLPTLevel } from '@/types/grammar';

type Phase = 'start' | 'testing' | 'result';

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

export default function TestPage() {
  const [phase, setPhase] = useState<Phase>('start');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ grammarId: string; correct: boolean; level: JLPTLevel }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  const allGrammar = useMemo(() => getAllGrammar(), []);

  const startTest = useCallback(() => {
    const qs = generateTest(allGrammar, 5);
    setQuestions(qs);
    setCurrent(0);
    setAnswers([]);
    setSelectedIdx(null);
    setPhase('testing');
  }, [allGrammar]);

  const handleSelect = useCallback(
    (idx: number) => {
      if (selectedIdx !== null) return; // already answered
      setSelectedIdx(idx);

      const q = questions[current];
      const correct = q.options[idx] === q.correctMeaning;
      const newAnswers = [...answers, { grammarId: q.grammarId, correct, level: q.level }];
      setAnswers(newAnswers);

      // Auto advance after delay
      setTimeout(() => {
        if (current < questions.length - 1) {
          setCurrent(c => c + 1);
          setSelectedIdx(null);
        } else {
          const res = calculateResults(newAnswers);
          setResult(res);
          setPhase('result');
        }
      }, 1200);
    },
    [selectedIdx, questions, current, answers]
  );

  const q = questions[current];
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-2xl">
      {/* breadcrumb */}
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ← 返回首页
      </Link>

      {phase === 'start' && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            等级测试
          </h1>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            共 25 道选择题，覆盖 N5 到 N1 五个级别。
            选出每个语法形式的正确含义，系统会根据你的得分推荐适合的学习等级。
          </p>
          <button
            onClick={startTest}
            className="rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            开始测试
          </button>
        </div>
      )}

      {phase === 'testing' && q && (
        <div>
          {/* progress bar */}
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
            {/* level badge */}
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

      {phase === 'result' && result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              测试结果
            </h1>
            <p className="text-4xl font-bold text-violet-600">
              {result.totalCorrect}/{result.totalQuestions}
            </p>
            <p className="mt-1 text-sm text-zinc-400">正确</p>

            <div className="mt-6 rounded-xl bg-violet-50 p-4 dark:bg-violet-900/20">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">推荐学习等级</p>
              <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                {LEVEL_LABEL[result.recommendedLevel]}
              </p>
            </div>
          </div>

          {/* score by level */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-400">各等级得分</h2>
            <div className="space-y-3">
              {(Object.entries(result.scoreByLevel) as [JLPTLevel, { correct: number; total: number }][]).map(
                ([level, score]) => {
                  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
                  return (
                    <div key={level}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {LEVEL_LABEL[level]}
                        </span>
                        <span className="text-zinc-400">
                          {score.correct}/{score.total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all ${LEVEL_COLOR[level]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={startTest}
              className="flex-1 rounded-xl bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              重新测试
            </button>
            <Link
              href={`/plan?level=${result.recommendedLevel.toLowerCase()}`}
              className="flex-1 rounded-xl bg-violet-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              开始学习 {LEVEL_LABEL[result.recommendedLevel]}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
