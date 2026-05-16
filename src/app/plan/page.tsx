'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAllGrammar } from '@/data';
import {
  getStudiedIds,
  getDueReviews,
  getStreak,
  getStudiedRecords,
  initPlan,
  getPlanConfig,
  updatePlanConfig,
  hasStudiedToday,
  getFocusCount,
  getFocusItems,
} from '@/lib/study-engine';
import LevelBadge from '@/components/LevelBadge';
import type { JLPTLevel } from '@/types/grammar';
import type { StudiedRecord, QuizRecord } from '@/lib/study-engine';

const LEVEL_ORDER: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const LEVEL_LABEL: Record<JLPTLevel, string> = {
  N5: 'N5 入门',
  N4: 'N4 初级',
  N3: 'N3 中级',
  N2: 'N2 中上级',
  N1: 'N1 高级',
};

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function ReviewCard({ record, pattern }: { record: StudiedRecord; pattern: string }) {
  const intervals = ['今天', '1天后', '3天后', '7天后', '14天后', '30天后'];
  const stageLabel = intervals[Math.min(record.reviewStage, intervals.length - 1)];

  return (
    <Link
      href={`/plan/study/${record.grammarId}`}
      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{pattern}</p>
        <p className="mt-0.5 text-xs text-zinc-400">复习阶段: {stageLabel}</p>
      </div>
      <LevelBadge level={record.level} />
    </Link>
  );
}

function PlanSetup({ onStart }: { onStart: (level: JLPTLevel) => void }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        学习计划
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        选择你的目标等级，系统会为你制定每日学习计划，并安排复习。
      </p>
      <div className="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
        {LEVEL_ORDER.map(level => (
          <button
            key={level}
            onClick={() => onStart(level)}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-center transition hover:border-violet-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-violet-600"
          >
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{level}</p>
            <p className="text-xs text-zinc-400">{LEVEL_LABEL[level]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-8 text-center text-zinc-400">加载中...</div>}>
      <PlanPageContent />
    </Suspense>
  );
}

function PlanPageContent() {
  const searchParams = useSearchParams();
  const allGrammar = useMemo(() => getAllGrammar(), []);
  const [hydrated, setHydrated] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const rerender = useCallback(() => setRenderKey(k => k + 1), []);

  // Wait for hydration before reading localStorage
  useEffect(() => { setHydrated(true); }, []);
  // Re-read localStorage on every navigation to this page
  useEffect(() => { rerender(); }, [searchParams]);

  // Initialize plan from query param
  useEffect(() => {
    const levelParam = searchParams.get('level');
    if (levelParam) {
      const level = levelParam.toUpperCase() as JLPTLevel;
      if (LEVEL_ORDER.includes(level) && !getPlanConfig()) {
        initPlan(level);
      }
    }
    // Force re-read on mount
    rerender();
  }, []);

  // Read everything fresh from localStorage every render
  const config = getPlanConfig();
  const studiedIds = getStudiedIds();
  const dueReviews = getDueReviews();
  const streak = getStreak();
  const studiedToday = hasStudiedToday();
  const records = getStudiedRecords();
  const focusCount = getFocusCount();
  const focusItems = getFocusItems();
  const hasQuiz = studiedIds.length >= 3;

  // Target-level computations
  const targetLevelIndex = config ? LEVEL_ORDER.indexOf(config.targetLevel) : -1;
  const allLevelGrammar = targetLevelIndex >= 0
    ? LEVEL_ORDER.filter((_, i) => i <= targetLevelIndex)
    : [];
  const targetGrammar = allGrammar.filter(g => allLevelGrammar.includes(g.level));
  const targetLevelTotal = targetGrammar.length;
  const targetLevelStudied = targetGrammar.filter(g => studiedIds.includes(g.id)).length;
  const allTargetStudied = targetLevelTotal > 0 && targetLevelStudied >= targetLevelTotal;

  // Unstudied grammar in target levels, sorted easiest first, always show up to 2
  const todayStudy = (() => {
    if (!config) return [];
    return targetGrammar
      .filter(g => !studiedIds.includes(g.id))
      .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))
      .slice(0, 2);
  })();

  const levelStats = LEVEL_ORDER.map(level => {
    const total = allGrammar.filter(g => g.level === level).length;
    const studied = records.filter(r => r.level === level).length;
    return { level, total, studied, pct: total > 0 ? (studied / total) * 100 : 0 };
  });

  // SSR guard — during hydration, re-read localStorage
  if (!hydrated || !config) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← 返回首页
        </Link>
        <PlanSetup onStart={level => { initPlan(level); rerender(); }} />
      </div>
    );
  }

  const totalAll = allGrammar.length;
  const studiedAll = studiedIds.length;
  const overallPct = totalAll > 0 ? (studiedAll / totalAll) * 100 : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ← 返回首页
      </Link>

      {/* Header stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-2xl font-bold text-violet-600">{streak}</p>
          <p className="text-xs text-zinc-400">连续天数</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {studiedAll}/{totalAll}
          </p>
          <p className="text-xs text-zinc-400">已学习</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-2xl font-bold text-amber-500">{dueReviews.length}</p>
          <p className="text-xs text-zinc-400">待复习</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">总进度</span>
          <span className="text-xs text-zinc-400">{Math.round(overallPct)}%</span>
        </div>
        <ProgressBar pct={overallPct} color="bg-violet-500" />
      </div>

      <div className="mb-6">
        {!studiedToday && (
          <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">
            今天还没有学习，加油！
          </p>
        )}

        {/* Daily Quiz */}
        {hasQuiz && (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                每日小测
              </h2>
              {focusCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {focusCount} 个需加强
                </span>
              )}
            </div>
            <Link
              href="/plan/quiz"
              className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:border-amber-700"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  检验学习成果
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  随机抽取已学语法点进行测验，错题自动计入重点加强
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-white">
                开始
              </span>
            </Link>
          </section>
        )}

        {/* Focus items */}
        {focusItems.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              重点加强
            </h2>
            <div className="space-y-2">
              {focusItems.slice(0, 5).map(item => {
                const g = allGrammar.find(gg => gg.id === item.grammarId);
                if (!g) return null;
                return (
                  <Link
                    key={item.grammarId}
                    href={`/plan/study/${item.grammarId}`}
                    className="flex items-center justify-between rounded-xl border border-red-200 bg-white p-4 transition hover:border-red-300 dark:border-red-900/50 dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                        {item.wrongCount}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {g.pattern}
                        </p>
                        <p className="text-xs text-zinc-400">{g.meaning}</p>
                      </div>
                    </div>
                    <LevelBadge level={item.level} />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Today's study */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              语法
            </h2>
          </div>
          {todayStudy.length === 0 ? (
            allTargetStudied ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  目标等级所有语法点已学完！可以升级到下一级。
                </p>
                {(() => {
                  const nextLevel = LEVEL_ORDER[targetLevelIndex + 1];
                  if (!nextLevel) return null;
                  return (
                    <button
                      onClick={() => {
                        updatePlanConfig({ targetLevel: nextLevel });
                        rerender();
                      }}
                      className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                    >
                      升级到 {LEVEL_LABEL[nextLevel]}
                    </button>
                  );
                })()}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  当前等级所有语法已学完！{targetLevelStudied}/{targetLevelTotal}
                </p>
              </div>
            )
          ) : (
            <div className="space-y-2">
              {todayStudy.map(g => (
                <Link
                  key={g.id}
                  href={`/plan/study/${g.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{g.pattern}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{g.meaning}</p>
                  </div>
                  <LevelBadge level={g.level} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Due reviews */}
        {dueReviews.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              待复习 ({dueReviews.length})
            </h2>
            <div className="space-y-2">
              {dueReviews.map(r => {
                const g = allGrammar.find(p => p.id === r.grammarId);
                if (!g) return null;
                return <ReviewCard key={r.grammarId} record={r} pattern={g.pattern} />;
              })}
            </div>
          </section>
        )}
      </div>

      {/* Progress by level */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          各等级进度
        </h2>
        <div className="space-y-3">
          {levelStats.map(({ level, total, studied, pct }) => (
            <div key={level}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {LEVEL_LABEL[level]}
                </span>
                <span className="text-xs text-zinc-400">
                  {studied}/{total}
                </span>
              </div>
              <ProgressBar
                pct={pct}
                color={
                  level === 'N5'
                    ? 'bg-emerald-500'
                    : level === 'N4'
                      ? 'bg-sky-500'
                      : level === 'N3'
                        ? 'bg-amber-500'
                        : level === 'N2'
                          ? 'bg-orange-500'
                          : 'bg-rose-500'
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
