import Link from 'next/link';
import { getAllGrammar } from '@/data';

export default function ColloquialPage() {
  const all = getAllGrammar().filter(g => g.colloquial);

  // group by level
  const byLevel = new Map<string, typeof all>();
  for (const g of all) {
    const list = byLevel.get(g.level) ?? [];
    list.push(g);
    byLevel.set(g.level, list);
  }

  const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];

  return (
    <div>
      <Link href="/" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
        ← 返回首页
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        口语对照
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        每个语法点在口语中的自然表达方式
      </p>

      {levelOrder.map(level => {
        const points = byLevel.get(level) ?? [];
        if (points.length === 0) return null;
        return (
          <section key={level} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
              {level}
            </h2>
            <div className="space-y-2">
              {points.map(g => (
                <Link
                  key={g.id}
                  href={`/grammar/${g.level.toLowerCase()}/${g.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {g.pattern}
                    </span>
                    <span className="text-sm text-zinc-500">{g.meaning}</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    💬 {g.colloquial}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
