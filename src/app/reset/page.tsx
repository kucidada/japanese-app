'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resetProgress } from '@/lib/study-engine';

export default function ResetPage() {
  const router = useRouter();

  useEffect(() => {
    resetProgress();
    router.push('/plan');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-500">正在重置...</p>
    </div>
  );
}
