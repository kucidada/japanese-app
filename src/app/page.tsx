import Link from 'next/link';
import { getLevels, getKanjiLevels } from '@/data';

const levelInfo: Record<string, { title: string; description: string; color: string }> = {
  N5: {
    title: 'N5 入门',
    description: '最基础的语法，判断句、助词、动词活用、形容词、基本表达',
    color: 'from-emerald-500 to-emerald-600',
  },
  N4: {
    title: 'N4 初级',
    description: '日常会话语法，授受关系、敬语基础、条件表达、被动/使役',
    color: 'from-sky-500 to-sky-600',
  },
  N3: {
    title: 'N3 中级',
    description: '更丰富的表达方式，比況、傾向、条件、立場、口語形',
    color: 'from-amber-500 to-amber-600',
  },
  N2: {
    title: 'N2 中上级',
    description: '正式书面表达，限定、譲歩、逆接、強調、正式条件句',
    color: 'from-orange-500 to-orange-600',
  },
  N1: {
    title: 'N1 高级',
    description: '高度书面化表达，文言语法残留、复杂句式、正式文体',
    color: 'from-rose-500 to-rose-600',
  },
};

const kanjiLevelInfo: Record<string, { title: string; color: string }> = {
  N5: { title: 'N5 入门', color: 'from-emerald-500 to-emerald-600' },
  N4: { title: 'N4 初级', color: 'from-sky-500 to-sky-600' },
  N3: { title: 'N3 中级', color: 'from-amber-500 to-amber-600' },
  N2: { title: 'N2 中上级', color: 'from-orange-500 to-orange-600' },
  N1: { title: 'N1 高级', color: 'from-rose-500 to-rose-600' },
};

export default function Home() {
  const levels = getLevels();
  const kanjiLevels = getKanjiLevels();

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          日语语法学习
        </h1>
        <p className="mx-auto max-w-lg text-base text-zinc-500 dark:text-zinc-400">
          N5 到 N1 全覆盖，语法关联记忆，口语对照，例句辅助理解
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map(({ level, count }) => {
          const info = levelInfo[level];
          return (
            <Link
              key={level}
              href={`/grammar/${level.toLowerCase()}`}
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
                <span>个语法点</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link
          href="/test"
          className="rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60"
        >
          ✦ 等级测试
        </Link>
        <Link
          href="/plan"
          className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
        >
          ✦ 学习计划
        </Link>
        <span className="rounded-full bg-zinc-100 px-3 py-2 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          {levels.reduce((s, l) => s + l.count, 0)} 个语法点
        </span>
      </div>

      <div className="mt-12 w-full">
        <h2 className="mb-4 text-center text-xl font-bold text-zinc-800 dark:text-zinc-200">
          汉字学习
        </h2>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kanjiLevels.map(({ level, count }) => {
            const info = kanjiLevelInfo[level];
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
                      按 JLPT 等级学习汉字
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
    </div>
  );
}
