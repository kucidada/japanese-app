'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllGrammar } from '@/data';
import {
  getReviewStatus,
  markStudied,
  clearQuizRecord,
  getFocusItems,
  getPlanConfig,
  getStudiedIds,
  getNextUnstudiedId,
} from '@/lib/study-engine';
import LevelBadge from '@/components/LevelBadge';
import Furigana from '@/components/Furigana';
import type { JLPTLevel } from '@/types/grammar';

const LEVEL_ORDER: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const allGrammar = useMemo(() => getAllGrammar(), []);

  const grammar = allGrammar.find(g => g.id === id);
  const [status, setStatus] = useState<ReturnType<typeof getReviewStatus>>();
  const [justMarked, setJustMarked] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setStatus(getReviewStatus(id));
  }, [id]);

  const planConfig = getPlanConfig();

  // Determine the ordered list of grammar IDs based on plan target level
  const orderedIds = useMemo(() => {
    if (!planConfig) {
      // If no plan, just use the same level grammar
      return grammar
        ? allGrammar
            .filter(g => g.level === grammar.level)
            .sort((a, b) => a.pattern.localeCompare(b.pattern))
            .map(g => g.id)
        : [];
    }
    const targetIdx = LEVEL_ORDER.indexOf(planConfig.targetLevel);
    const levels = LEVEL_ORDER.filter((_, i) => i <= targetIdx);
    return allGrammar.filter(g => levels.includes(g.level)).map(g => g.id);
  }, [planConfig, allGrammar, grammar]);

  const isLastUnstudied = useMemo(() => {
    if (!grammar || !orderedIds.length) return false;
    const studiedIds = getStudiedIds();
    const next = getNextUnstudiedId(grammar.id, orderedIds, studiedIds);
    return next === null;
  }, [grammar, orderedIds]);

  const handleMarkStudied = useCallback(() => {
    if (!grammar) return;
    markStudied(grammar.id, grammar.level);
    clearQuizRecord(grammar.id);
    setStatus(getReviewStatus(grammar.id));
    setJustMarked(true);
    cancelledRef.current = false;

    // Prioritize remaining focus items, fall back to next unstudied grammar
    const remainingFocus = getFocusItems();
    const next = remainingFocus.length > 0
      ? remainingFocus[0].grammarId
      : getNextUnstudiedId(grammar.id, orderedIds, getStudiedIds());
    setNextId(next);

    if (next) {
      setCountdown(3);
    }
  }, [grammar, orderedIds]);

  // Countdown effect: ticks down and redirects when reaching 0
  useEffect(() => {
    if (countdown === null || countdown === undefined) return;
    if (cancelledRef.current) return;

    if (countdown <= 0) {
      if (nextId) {
        router.push(`/plan/study/${nextId}`);
      }
      return;
    }

    const t = setTimeout(() => {
      if (!cancelledRef.current) {
        setCountdown(c => (c !== null ? c - 1 : null));
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [countdown, nextId, router]);

  const cancelAuto = () => {
    cancelledRef.current = true;
    setCountdown(null);
  };

  if (!grammar) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-zinc-400">语法点未找到</p>
        <Link
          href="/plan"
          className="mt-4 inline-block text-sm text-violet-500 hover:text-violet-600"
        >
          ← 返回学习计划
        </Link>
      </div>
    );
  }

  const isReview = status && status.studiedAt !== status?.nextReviewAt?.slice(0, 10);
  const backUrl = planConfig ? '/plan' : `/grammar/${grammar.level.toLowerCase()}`;

  // Next grammar preview (for the countdown state)
  const nextGrammar = nextId ? allGrammar.find(g => g.id === nextId) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={backUrl}
        className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ← 返回{planConfig ? '学习计划' : grammar.level.toUpperCase()}
      </Link>

      <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Status banner */}
        {status && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {isReview ? '复习中' : '已学习'} · 下次复习:{' '}
            {status.nextReviewAt}
          </div>
        )}

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {grammar.pattern}
            </h1>
            <p className="mt-1 text-base text-zinc-500 dark:text-zinc-400">
              {grammar.meaning}
            </p>
          </div>
          <LevelBadge level={grammar.level} size="lg" />
        </div>

        {grammar.repeatIn.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {grammar.repeatIn.map(rl => (
              <span
                key={rl}
                className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              >
                该语法也在 {rl} 中出现
              </span>
            ))}
          </div>
        )}

        <div className="mb-5 space-y-4">
          <section>
            <h2 className="mb-1 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              接续方式
            </h2>
            <p className="rounded-lg bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {grammar.usage}
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              详细说明
            </h2>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {grammar.explanation}
            </p>
          </section>

          {grammar.colloquial && (
            <section>
              <h2 className="mb-1 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                口语对照
              </h2>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {grammar.colloquial}
              </p>
            </section>
          )}
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            例句
          </h2>
          <div className="space-y-3">
            {grammar.examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
              >
                <p className="text-base text-zinc-900 dark:text-zinc-100">
                  {ex.jpFuri ? (
                    <Furigana html={ex.jpFuri} fallback={ex.jp} />
                  ) : (
                    ex.jp
                  )}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{ex.cn}</p>
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500 italic">{ex.en}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      {/* Mark as studied + auto-advance */}
      <div className="mt-6 space-y-2">
        {countdown !== null ? (
          <div className="space-y-2">
            <div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                ✓ 已完成
              </p>
              {nextGrammar && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  {countdown > 0
                    ? `${countdown} 秒后自动跳转到下一个：${nextGrammar.pattern}`
                    : '正在跳转...'}
                </p>
              )}
              {isLastUnstudied && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  当前等级已全部学完！
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {nextGrammar && countdown! > 0 && (
                <>
                  <button
                    onClick={() => router.push(`/plan/study/${nextId}`)}
                    className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    立即跳转
                  </button>
                  <button
                    onClick={cancelAuto}
                    className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                  >
                    停留
                  </button>
                </>
              )}
              {isLastUnstudied && (
                <Link
                  href={backUrl}
                  className="block w-full rounded-xl bg-violet-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  返回{planConfig ? '学习计划' : '语法列表'}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleMarkStudied}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
              justMarked
                ? 'bg-emerald-500 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {justMarked ? '✓ 已完成' : status ? '标记为已复习' : '标记为已学习'}
          </button>
        )}

        {countdown === null && (
          <Link
            href={backUrl}
            className="block w-full rounded-xl border border-zinc-200 bg-white py-3 text-center text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            返回{planConfig ? '学习计划' : '语法列表'}
          </Link>
        )}
      </div>
    </div>
  );
}
