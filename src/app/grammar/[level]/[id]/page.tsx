import { notFound } from 'next/navigation';
import Link from 'next/link';
import LevelBadge from '@/components/LevelBadge';
import Furigana from '@/components/Furigana';
import { getGrammarById, getRelatedGrammar } from '@/data';

export default async function GrammarDetailPage({
  params,
}: {
  params: Promise<{ level: string; id: string }>;
}) {
  const { level, id } = await params;
  const grammar = getGrammarById(id);

  if (!grammar) {
    notFound();
  }

  const related = getRelatedGrammar(id);

  return (
    <div>
      <Link
        href={`/grammar/${level}`}
        className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ← 返回 {level.toUpperCase()}
      </Link>

      <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
            <h2 className="mb-1 text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              接续方式
            </h2>
            <p className="rounded-lg bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {grammar.usage}
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              详细说明
            </h2>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {grammar.explanation}
            </p>
          </section>

          {grammar.colloquial && (
            <section>
              <h2 className="mb-1 text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                口语对照
              </h2>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {grammar.colloquial}
              </p>
            </section>
          )}
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
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

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            关联语法
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map(r => (
              <Link
                key={r.id}
                href={`/grammar/${r.level.toLowerCase()}/${r.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {r.pattern}
                  </span>
                  <LevelBadge level={r.level} />
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  关联：{r.relation}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
