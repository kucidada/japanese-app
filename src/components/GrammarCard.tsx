import Link from 'next/link';
import LevelBadge from './LevelBadge';
import type { GrammarPoint } from '@/types/grammar';

export default function GrammarCard({ grammar }: { grammar: GrammarPoint }) {
  return (
    <Link
      href={`/grammar/${grammar.level.toLowerCase()}/${grammar.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {grammar.pattern}
        </h3>
        <LevelBadge level={grammar.level} />
      </div>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{grammar.meaning}</p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{grammar.explanation}</p>
      {grammar.colloquial && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          💬 {grammar.colloquial}
        </p>
      )}
      {grammar.repeatIn.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {grammar.repeatIn.map(level => (
            <span
              key={level}
              className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
            >
              重复 · {level}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
