import type { JLPTLevel } from '@/types/grammar';

const colors: Record<JLPTLevel, string> = {
  N5: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  N4: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  N3: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  N2: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  N1: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
};

export default function LevelBadge({
  level,
  size = 'sm',
}: {
  level: JLPTLevel;
  size?: 'sm' | 'lg';
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold leading-none ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${colors[level]}`}
    >
      {level}
    </span>
  );
}
