import type { DebateTopic } from '@/features/debate/types';

export function pickTopic(
  pool: DebateTopic[],
  usedIds: string[],
): { topic: DebateTopic | null; resetHistory: boolean } {
  if (pool.length === 0) return { topic: null, resetHistory: false };
  const unused = pool.filter((t) => !usedIds.includes(t.id));
  if (unused.length === 0) {
    const topic = pool[Math.floor(Math.random() * pool.length)] ?? null;
    return { topic, resetHistory: true };
  }
  const topic = unused[Math.floor(Math.random() * unused.length)] ?? null;
  return { topic, resetHistory: false };
}

export function nextHistoryAfterPick(
  usedIds: string[],
  topicId: string,
  resetHistory: boolean,
): string[] {
  if (resetHistory) return [topicId];
  return [...usedIds, topicId];
}
