'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          日语语法
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {levels.map(level => {
            const href = `/grammar/${level.toLowerCase()}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={level}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {level}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <SearchBar />
          <Link
            href="/test"
            className={`hidden rounded-lg px-3 py-1.5 text-sm font-medium transition sm:block ${
              pathname === '/test'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            测试
          </Link>
          <Link
            href="/plan"
            className={`hidden rounded-lg px-3 py-1.5 text-sm font-medium transition sm:block ${
              pathname === '/plan'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            学习
          </Link>
          <Link
            href="/colloquial"
            className={`hidden rounded-lg px-3 py-1.5 text-sm font-medium transition sm:block ${
              pathname === '/colloquial'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            口语
          </Link>
          <Link
            href="/kanji"
            className={`hidden rounded-lg px-3 py-1.5 text-sm font-medium transition sm:block ${
              pathname === '/kanji'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            汉字
          </Link>
        </div>
      </div>

      {/* mobile nav */}
      <div className="space-y-0.5 border-t border-zinc-100 px-2 py-1.5 sm:hidden dark:border-zinc-800">
        <div className="flex gap-1">
          {levels.map(level => {
            const href = `/grammar/${level.toLowerCase()}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={level}
                href={href}
                className={`flex-1 rounded-lg px-2 py-1 text-center text-xs font-medium transition ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                {level}
              </Link>
            );
          })}
        </div>
        <div className="flex gap-1">
          <Link
            href="/test"
            className={`flex-1 rounded-lg px-2 py-1 text-center text-xs font-medium transition ${
              pathname === '/test'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            测试
          </Link>
          <Link
            href="/plan"
            className={`flex-1 rounded-lg px-2 py-1 text-center text-xs font-medium transition ${
              pathname === '/plan'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            学习
          </Link>
          <Link
            href="/colloquial"
            className={`flex-1 rounded-lg px-2 py-1 text-center text-xs font-medium transition ${
              pathname === '/colloquial'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            口语
          </Link>
          <Link
            href="/kanji"
            className={`flex-1 rounded-lg px-2 py-1 text-center text-xs font-medium transition ${
              pathname === '/kanji'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            汉字
          </Link>
        </div>
      </div>
    </header>
  );
}
