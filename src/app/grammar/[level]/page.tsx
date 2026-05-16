import { notFound } from 'next/navigation';
import Link from 'next/link';
import LevelBadge from '@/components/LevelBadge';
import GrammarCard from '@/components/GrammarCard';
import { getGrammarByLevel, getLevels } from '@/data';
import type { JLPTLevel } from '@/types/grammar';

const levelNames: Record<string, string> = {
  n5: 'N5 入门',
  n4: 'N4 初级',
  n3: 'N3 中级',
  n2: 'N2 中上级',
  n1: 'N1 高级',
};

export function generateStaticParams() {
  return ['n5', 'n4', 'n3', 'n2', 'n1'].map(level => ({ level }));
}

export default async function GrammarLevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const upper = level.toUpperCase() as JLPTLevel;

  if (!['N5', 'N4', 'N3', 'N2', 'N1'].includes(upper)) {
    notFound();
  }

  const grammarPoints = getGrammarByLevel(upper);

  // group by category
  const byCategory = new Map<string, typeof grammarPoints>();
  for (const g of grammarPoints) {
    const list = byCategory.get(g.category) ?? [];
    list.push(g);
    byCategory.set(g.category, list);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← 返回首页
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {levelNames[level] ?? level.toUpperCase()}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          共 {grammarPoints.length} 个语法点
        </p>
      </div>

      {[...byCategory.entries()].map(([category, points]) => (
        <section key={category} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            {category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {points.map(g => (
              <GrammarCard key={g.id} grammar={g} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
