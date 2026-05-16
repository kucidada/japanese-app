import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKanjiByLevel } from '@/data';
import type { JLPTLevel } from '@/types/grammar';
import KanjiCard from '@/components/KanjiCard';
import Pagination from '@/components/Pagination';

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'] as const;
const LEVEL_LABEL: Record<string, string> = {
  n5: 'N5 入门',
  n4: 'N4 初级',
  n3: 'N3 中级',
  n2: 'N2 中上级',
  n1: 'N1 高级',
};
const PAGE_SIZE = 12;

export function generateStaticParams() {
  return LEVELS.map(level => ({ level }));
}

export default async function KanjiLevelPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { level } = await params;
  const { page } = await searchParams;
  const levelUpper = level.toUpperCase() as JLPTLevel;

  if (!LEVELS.includes(level as typeof LEVELS[number])) {
    notFound();
  }

  const kanjiList = getKanjiByLevel(levelUpper);
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const totalPages = Math.ceil(kanjiList.length / PAGE_SIZE);
  const pageItems = kanjiList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/kanji"
        className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        ← 返回汉字列表
      </Link>

      <div className="mb-6 flex items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            汉字 {LEVEL_LABEL[level] || level.toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            共 {kanjiList.length} 个汉字
          </p>
        </div>
      </div>

      {kanjiList.length === 0 ? (
        <p className="text-sm text-zinc-400">暂无数据</p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map(k => (
              <KanjiCard key={k.id} kanji={k} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/kanji/${level}`}
            />
          )}
        </div>
      )}
    </div>
  );
}
