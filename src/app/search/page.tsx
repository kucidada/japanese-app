'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import GrammarCard from '@/components/GrammarCard';
import { searchGrammar } from '@/data';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const results = query ? searchGrammar(query) : [];

  return (
    <div>
      <Link href="/" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
        ← 返回首页
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        搜索结果
      </h1>

      {query ? (
        <>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            搜索「{query}」找到 {results.length} 个结果
          </p>
          {results.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map(g => (
                <GrammarCard key={g.id} grammar={g} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              未找到匹配的语法点
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          在搜索框中输入关键词查找语法点
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-400 dark:text-zinc-500">加载中...</p>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
