'use client';

import type { JLPTLevel } from '@/types/grammar';

// --- types ---

export interface StudiedRecord {
  grammarId: string;
  studiedAt: string; // ISO date
  level: JLPTLevel;
  reviews: string[]; // ISO dates of past reviews
  nextReviewAt: string; // ISO date
  reviewStage: number; // 0 = just studied, 1 = 1 day, 2 = 3 days, ...
}

export interface StudyPlanConfig {
  targetLevel: JLPTLevel;
  dailyTarget: number; // new grammar points per day
  startDate: string; // ISO date
}

export interface QuizRecord {
  grammarId: string;
  level: JLPTLevel;
  wrongCount: number;
  lastWrongAt: string; // ISO date
}

export interface DailyQueue {
  date: string; // ISO date
  grammarIds: string[];
  currentIndex: number; // position in the queue (items before this are done)
}

const STORAGE_KEYS = {
  records: 'jp-studied-records',
  config: 'jp-study-plan-config',
  quizRecords: 'jp-quiz-records',
  dailyQueue: 'jp-daily-queue',
};

const REVIEW_INTERVALS = [1, 3, 7, 14, 30]; // days after each review stage

// --- helpers ---

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function loadRecords(): StudiedRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.records) || '[]');
  } catch {
    return [];
  }
}

function saveRecords(records: StudiedRecord[]) {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
}

function loadConfig(): StudyPlanConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.config) || 'null');
  } catch {
    return null;
  }
}

function saveConfig(config: StudyPlanConfig) {
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
}

// --- public API ---

/** Mark a grammar point as studied (or reviewed) */
export function markStudied(grammarId: string, level: JLPTLevel) {
  const records = loadRecords();
  const existing = records.find(r => r.grammarId === grammarId);

  if (existing) {
    // It's a review
    const nextStage = existing.reviewStage + 1;
    const interval = REVIEW_INTERVALS[Math.min(nextStage, REVIEW_INTERVALS.length - 1)];
    existing.reviews.push(todayISO());
    existing.nextReviewAt = addDays(todayISO(), interval);
    existing.reviewStage = nextStage;
  } else {
    // First time studying
    const interval = REVIEW_INTERVALS[0];
    records.push({
      grammarId,
      studiedAt: todayISO(),
      level,
      reviews: [],
      nextReviewAt: addDays(todayISO(), interval),
      reviewStage: 0,
    });
  }

  saveRecords(records);
}

/** Get all grammar IDs that have been studied */
export function getStudiedIds(): string[] {
  return loadRecords().map(r => r.grammarId);
}

/** Get records due for review today */
export function getDueReviews(): StudiedRecord[] {
  const today = todayISO();
  return loadRecords().filter(r => r.nextReviewAt <= today);
}

/** Get records that have been studied (excluding those due today, for progress) */
export function getStudiedRecords(): StudiedRecord[] {
  return loadRecords();
}

/** Get stats about studied grammar by level */
export function getLevelStats(): Record<JLPTLevel, { studied: number; total: number }> {
  const records = loadRecords();
  const allLevels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const stats: any = {};
  for (const level of allLevels) {
    stats[level] = {
      studied: records.filter(r => r.level === level).length,
      total: 0, // filled in by caller with actual counts
    };
  }
  return stats;
}

/** Initialize or get the study plan config */
export function initPlan(targetLevel: JLPTLevel, dailyTarget: number = 5): StudyPlanConfig {
  let config = loadConfig();
  if (!config) {
    config = {
      targetLevel,
      dailyTarget,
      startDate: todayISO(),
    };
    saveConfig(config);
  }
  return config;
}

export function getPlanConfig(): StudyPlanConfig | null {
  return loadConfig();
}

export function updatePlanConfig(updates: Partial<StudyPlanConfig>) {
  const config = loadConfig();
  if (config) {
    Object.assign(config, updates);
    saveConfig(config);
  }
}

/** Get the study streak (consecutive days with at least 1 study/review) */
export function getStreak(): number {
  const records = loadRecords();
  const allDates = new Set<string>();

  for (const r of records) {
    allDates.add(r.studiedAt.slice(0, 10));
    for (const rev of r.reviews) {
      allDates.add(rev.slice(0, 10));
    }
  }

  const today = todayISO();
  if (!allDates.has(today)) return 0;

  let streak = 1;
  let check = addDays(today, -1);
  while (allDates.has(check)) {
    streak++;
    check = addDays(check, -1);
  }
  return streak;
}

/** Check if user has studied today */
export function hasStudiedToday(): boolean {
  const today = todayISO();
  const records = loadRecords();
  for (const r of records) {
    if (r.studiedAt === today) return true;
    if (r.reviews.some(rev => rev === today)) return true;
  }
  return false;
}

/** Reset all progress */
export function resetProgress() {
  localStorage.removeItem(STORAGE_KEYS.records);
  localStorage.removeItem(STORAGE_KEYS.config);
  localStorage.removeItem(STORAGE_KEYS.dailyQueue);
  localStorage.removeItem(STORAGE_KEYS.quizRecords);
}

/** Get review status for a specific grammar point */
export function getReviewStatus(grammarId: string): StudiedRecord | undefined {
  return loadRecords().find(r => r.grammarId === grammarId);
}

// --- daily queue ---

function loadDailyQueue(): DailyQueue | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.dailyQueue) || 'null');
  } catch {
    return null;
  }
}

function saveDailyQueue(queue: DailyQueue) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.dailyQueue, JSON.stringify(queue));
}

/**
 * Get or create today's daily queue.
 * The queue is a list of unstudied grammar IDs to study today.
 * Automatically resizes when dailyTarget changes.
 */
export function getOrInitDailyQueue(
  allGrammarIds: string[],
  dailyTarget: number
): DailyQueue {
  const today = todayISO();
  const existing = loadDailyQueue();

  // If there's an existing queue from today, resize it to match dailyTarget
  if (existing && existing.date === today) {
    if (existing.grammarIds.length === dailyTarget && existing.grammarIds.length > 0) {
      // Same size and non-empty — return as-is
      return existing;
    }

    // Need to resize
    const studiedIds = getStudiedIds();
    const alreadyInQueue = existing.grammarIds;

    if (existing.grammarIds.length < dailyTarget) {
      // Growing: add more unstudied items not already in the queue
      const candidates = allGrammarIds.filter(
        id => !studiedIds.includes(id) && !alreadyInQueue.includes(id)
      );
      const needed = dailyTarget - existing.grammarIds.length;
      existing.grammarIds.push(...candidates.slice(0, needed));
    } else {
      // Shrinking: truncate to new target
      existing.grammarIds = existing.grammarIds.slice(0, dailyTarget);
    }

    saveDailyQueue(existing);
    return existing;
  }

  // Create new queue: pick unstudied items, up to dailyTarget
  const studiedIds = getStudiedIds();
  const unstudied = allGrammarIds.filter(id => !studiedIds.includes(id));
  const queueIds = unstudied.slice(0, dailyTarget);

  const queue: DailyQueue = {
    date: today,
    grammarIds: queueIds,
    currentIndex: 0,
  };
  saveDailyQueue(queue);
  return queue;
}

/** Reset only today's daily queue — keeps all study records, config, and quiz history */
export function resetDailyQueue() {
  localStorage.removeItem(STORAGE_KEYS.dailyQueue);
}

/** Advance the daily queue position forward by 1 (marks current item as "done") */
export function advanceDailyQueue(): DailyQueue | null {
  const queue = loadDailyQueue();
  if (!queue) return null;

  const today = todayISO();
  if (queue.date !== today) return queue; // don't modify old queues

  if (queue.currentIndex < queue.grammarIds.length) {
    queue.currentIndex++;
    saveDailyQueue(queue);
  }
  return queue;
}

/** Get the remaining items in today's queue that haven't been studied yet */
export function getDailyQueueRemaining(): string[] {
  const queue = loadDailyQueue();
  if (!queue || queue.date !== todayISO()) return [];
  const studiedIds = getStudiedIds();
  return queue.grammarIds.filter(id => !studiedIds.includes(id));
}

/** Get the current position in the queue based on what's been studied */
export function getDailyQueuePosition(): { current: number; total: number } | null {
  const queue = loadDailyQueue();
  if (!queue || queue.date !== todayISO()) return null;
  const studiedIds = getStudiedIds();
  const completed = queue.grammarIds.filter(id => studiedIds.includes(id)).length;
  return { current: completed, total: queue.grammarIds.length };
}

/** Check if all items in today's queue have been studied */
export function isDailyQueueComplete(): boolean {
  const queue = loadDailyQueue();
  if (!queue || queue.date !== todayISO()) return false;
  const studiedIds = getStudiedIds();
  return queue.grammarIds.every(id => studiedIds.includes(id));
}

// --- quiz / focus tracking ---

function loadQuizRecords(): QuizRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.quizRecords) || '[]');
  } catch {
    return [];
  }
}

function saveQuizRecords(records: QuizRecord[]) {
  localStorage.setItem(STORAGE_KEYS.quizRecords, JSON.stringify(records));
}

/** Record a quiz answer result. If wrong, increments wrongCount. */
export function markQuizResult(grammarId: string, level: JLPTLevel, correct: boolean) {
  if (correct) return;
  const records = loadQuizRecords();
  const existing = records.find(r => r.grammarId === grammarId);
  if (existing) {
    existing.wrongCount++;
    existing.lastWrongAt = todayISO();
  } else {
    records.push({ grammarId, level, wrongCount: 1, lastWrongAt: todayISO() });
  }
  saveQuizRecords(records);
}

/** Get all focus items (items with wrong quiz answers), sorted by wrongCount desc then recency */
export function getFocusItems(): QuizRecord[] {
  return loadQuizRecords()
    .filter(r => r.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt.localeCompare(a.lastWrongAt));
}

export function getFocusCount(): number {
  return getFocusItems().length;
}

export function clearQuizRecord(grammarId: string) {
  const records = loadQuizRecords();
  const idx = records.findIndex(r => r.grammarId === grammarId);
  if (idx !== -1) {
    records.splice(idx, 1);
    saveQuizRecords(records);
  }
}

// --- next-grammar lookup ---

/**
 * Find the next unstudied grammar ID after the current one, within the plan's target level.
 * Returns null if all grammar in the target levels have been studied.
 */
export function getNextUnstudiedId(
  currentId: string,
  grammarIds: string[],
  studiedIds: string[]
): string | null {
  const currentIdx = grammarIds.indexOf(currentId);
  if (currentIdx === -1) return null;

  // Search forward from current position
  for (let i = currentIdx + 1; i < grammarIds.length; i++) {
    if (!studiedIds.includes(grammarIds[i])) return grammarIds[i];
  }
  // Wrap around from the beginning
  for (let i = 0; i < currentIdx; i++) {
    if (!studiedIds.includes(grammarIds[i])) return grammarIds[i];
  }
  return null; // all studied
}
