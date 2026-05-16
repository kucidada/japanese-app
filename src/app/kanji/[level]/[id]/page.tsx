import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKanjiById, getKanjiByLevel } from '@/data';
import type { JLPTLevel } from '@/types/grammar';
import LevelBadge from '@/components/LevelBadge';

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'] as const;

export function generateStaticParams() {
  const params: { level: string; id: string }[] = [];
  for (const level of LEVELS) {
    const list = getKanjiByLevel(level.toUpperCase() as JLPTLevel);
    for (const k of list) {
      params.push({ level, id: k.id });
    }
  }
  return params;
}

export default async function KanjiDetailPage({
  params,
}: {
  params: Promise<{ level: string; id: string }>;
}) {
  const { level, id } = await params;
  const kanji = getKanjiById(id);

  if (!kanji || kanji.level.toLowerCase() !== level) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/kanji/${level}`}
        className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ← 返回 {kanji.level} 汉字列表
      </Link>

      <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-50 text-4xl font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {kanji.character}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {kanji.meaning}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                {kanji.strokeCount}画 · {kanji.category}
              </p>
            </div>
          </div>
          <LevelBadge level={kanji.level} size="lg" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <h2 className="mb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              音读
            </h2>
            {kanji.onyomi.length > 0 ? (
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {kanji.onyomi.join(' / ')}
              </p>
            ) : (
              <p className="text-sm text-zinc-400">—</p>
            )}
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <h2 className="mb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              训读
            </h2>
            {kanji.kunyomi.length > 0 ? (
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {kanji.kunyomi.join(' / ')}
              </p>
            ) : (
              <p className="text-sm text-zinc-400">—</p>
            )}
          </div>
        </div>

        {kanji.examples.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              例词
            </h2>
            <div className="space-y-2">
              {kanji.examples.map((ex, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {ex.word}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {ex.cn ? `${ex.cn} · ${ex.meaning}` : ex.meaning}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-zinc-200/60 px-2 py-0.5 text-xs font-mono text-zinc-500 dark:bg-zinc-700/60 dark:text-zinc-400">
                    {ex.reading}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
