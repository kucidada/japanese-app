import Link from 'next/link';
import { getKanjiLevels } from '@/data';

const levelInfo: Record<string, { title: string; description: string; color: string }> = {
  N5: {
    title: 'N5 入门汉字',
    description: '最基础的汉字，数字、方向、自然、人体、基本动词',
    color: 'from-emerald-500 to-emerald-600',
  },
  N4: {
    title: 'N4 初级汉字',
    description: '日常常用汉字，衣食住行、学校、颜色、形容词',
    color: 'from-sky-500 to-sky-600',
  },
  N3: {
    title: 'N3 中级汉字',
    description: '更丰富的汉字，季节、场所、情感、动作、自然',
    color: 'from-amber-500 to-amber-600',
  },
  N2: {
    title: 'N2 中上级汉字',
    description: '抽象概念汉字，政治经济、社会制度、科学文化',
    color: 'from-orange-500 to-orange-600',
  },
  N1: {
    title: 'N1 高级汉字',
    description: '高度书面化汉字，复杂抽象概念、文言词汇',
    color: 'from-rose-500 to-rose-600',
  },
};

export default function KanjiPage() {
  const levels = getKanjiLevels();

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          日本汉字
        </h1>
        <p className="mx-auto max-w-lg text-base text-zinc-500 dark:text-zinc-400">
          按 JLPT 等级学习汉字，掌握音读、训读和例词
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map(({ level, count }) => {
          const info = levelInfo[level];
          return (
            <Link
              key={level}
              href={`/kanji/${level.toLowerCase()}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${info.color}`}
              />
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {info.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {info.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {count}
                </span>
                <span>个汉字</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
