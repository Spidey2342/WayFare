export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function previousLocalDate(date: Date): string {
  const previous = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return localDateKey(previous);
}

export function weekKey(date: Date): string {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = Math.floor((current - start) / 86_400_000);
  return `${date.getFullYear()}-W${Math.floor(dayIndex / 7) + 1}`;
}

export function nextStreak(lastPlayedDate: string | null, streakDays: number, today: Date): number {
  const todayKey = localDateKey(today);
  if (lastPlayedDate === todayKey) return Math.max(streakDays, 1);
  if (lastPlayedDate === previousLocalDate(today)) return streakDays + 1;
  return 1;
}
