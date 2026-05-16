import Link from 'next/link';
import type { KanjiEntry } from '@/types/kanji';
import LevelBadge from './LevelBadge';

export default function KanjiCard({ kanji }: { kanji: KanjiEntry }) {
  return (
    <Link
      href={`/kanji/${kanji.level.toLowerCase()}/${kanji.id}`}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-2xl font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
        {kanji.character}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{kanji.meaning}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
          {kanji.onyomi.length > 0 && (
            <span>音: {kanji.onyomi.join('・')}</span>
          )}
          {kanji.kunyomi.length > 0 && (
            <span>訓: {kanji.kunyomi.join('・')}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">
          {kanji.strokeCount}画 · {kanji.category}
        </p>
      </div>
      <LevelBadge level={kanji.level} />
    </Link>
  );
}
