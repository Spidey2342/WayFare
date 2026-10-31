import badgesData from '@/data/badges.json';
import levelsData from '@/data/levels.json';

import { localDateKey, nextStreak, weekKey } from './calendar';

export interface LevelDef {
  level: number;
  title: string;
  displayTitle: string;
  xp: number;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  rule: string;
}

export interface GameProgress {
  xp: number;
  streakDays: number;
  lastPlayedDate: string | null;
  cardsPlayed: number;
  actsOfService: number;
  sessionsCompleted: number;
  completedWeeks: string[];
  badgesEarned: string[];
  wordCards: number;
  questionCards: number;
  dareCards: number;
  challengeCards: number;
  testimonyCards: number;
  weeklyCompleted: boolean;
  weeklyWeekKey: string;
  lastAppliedSessionId: string | null;
}

export interface SessionAward {
  id: string;
  mode: 'pass' | 'team' | 'journey' | 'outing';
  cardsPlayed: number;
  cardTypes: ('word' | 'question' | 'dare' | 'challenge' | 'testimony')[];
  unity: number;
  actsOfService: number;
}

export const levels = levelsData as LevelDef[];
export const badges = badgesData as BadgeDef[];
const journeyWeeks = ['w1', 'w2', 'w3', 'w4', 'w5'];

export function defaultProgress(now = new Date()): GameProgress {
  return {
    xp: 0,
    streakDays: 0,
    lastPlayedDate: null,
    cardsPlayed: 0,
    actsOfService: 0,
    sessionsCompleted: 0,
    completedWeeks: [],
    badgesEarned: [],
    wordCards: 0,
    questionCards: 0,
    dareCards: 0,
    challengeCards: 0,
    testimonyCards: 0,
    weeklyCompleted: false,
    weeklyWeekKey: weekKey(now),
    lastAppliedSessionId: null,
  };
}

export function levelForXp(xp: number): LevelDef {
  const first = levels[0];
  if (!first) return { level: 1, title: 'Seeker', displayTitle: 'Faith Seeker', xp: 0 };
  let current = first;
  for (const level of levels) {
    if (xp >= level.xp) current = level;
  }
  return current;
}

function countType(
  types: SessionAward['cardTypes'],
  type: SessionAward['cardTypes'][number],
): number {
  return types.filter((item) => item === type).length;
}

function ruleMet(rule: string, progress: GameProgress, award: SessionAward | null): boolean {
  const [kind, a, b] = rule.split(':');
  const amount = Number(b ?? a);
  if (kind === 'sessions') return progress.sessionsCompleted >= amount;
  if (kind === 'streak') return progress.streakDays >= amount;
  if (kind === 'cards') return progress.cardsPlayed >= amount;
  if (kind === 'service') return progress.actsOfService >= amount;
  if (kind === 'xp') return progress.xp >= amount;
  if (kind === 'weekly') return progress.weeklyCompleted;
  if (kind === 'card') {
    const totals: Record<string, number> = {
      word: progress.wordCards,
      question: progress.questionCards,
      dare: progress.dareCards,
      challenge: progress.challengeCards,
      testimony: progress.testimonyCards,
    };
    return (totals[a ?? ''] ?? 0) >= amount;
  }
  if (!award) return false;
  if (kind === 'sessionCards') return award.cardsPlayed >= amount;
  if (kind === 'unity') return award.unity >= amount;
  if (kind === 'mode') return award.mode === a;
  return false;
}

function withBadges(progress: GameProgress, award: SessionAward | null): GameProgress {
  const earned = new Set(progress.badgesEarned);
  for (const badge of badges) {
    if (ruleMet(badge.rule, progress, award)) earned.add(badge.id);
  }
  return { ...progress, badgesEarned: [...earned] };
}

export function applySession(progress: GameProgress, award: SessionAward, now: Date): GameProgress {
  if (progress.lastAppliedSessionId === award.id) return progress;
  const currentWeek = weekKey(now);
  const weeklyCompleted = progress.weeklyWeekKey === currentWeek ? progress.weeklyCompleted : false;
  const nextWeek =
    award.mode === 'journey'
      ? journeyWeeks.find((week) => !progress.completedWeeks.includes(week))
      : undefined;
  const next: GameProgress = {
    ...progress,
    xp: progress.xp + 10 + award.cardsPlayed * 2,
    streakDays: nextStreak(progress.lastPlayedDate, progress.streakDays, now),
    lastPlayedDate: localDateKey(now),
    cardsPlayed: progress.cardsPlayed + award.cardsPlayed,
    actsOfService: progress.actsOfService + award.actsOfService,
    sessionsCompleted: progress.sessionsCompleted + 1,
    completedWeeks: nextWeek ? [...progress.completedWeeks, nextWeek] : progress.completedWeeks,
    wordCards: progress.wordCards + countType(award.cardTypes, 'word'),
    questionCards: progress.questionCards + countType(award.cardTypes, 'question'),
    dareCards: progress.dareCards + countType(award.cardTypes, 'dare'),
    challengeCards: progress.challengeCards + countType(award.cardTypes, 'challenge'),
    testimonyCards: progress.testimonyCards + countType(award.cardTypes, 'testimony'),
    weeklyCompleted,
    weeklyWeekKey: currentWeek,
    lastAppliedSessionId: award.id,
  };
  return withBadges(next, award);
}

export function completeWeekly(progress: GameProgress, now: Date): GameProgress {
  const currentWeek = weekKey(now);
  const base =
    progress.weeklyWeekKey === currentWeek
      ? progress
      : { ...progress, weeklyWeekKey: currentWeek, weeklyCompleted: false };
  return withBadges({ ...base, weeklyCompleted: true }, null);
}

export function journeyNodes(progress: GameProgress): {
  id: string;
  label: string;
  state: 'complete' | 'current' | 'locked';
  caption?: string;
}[] {
  const done = new Set(progress.completedWeeks);
  const currentIndex = journeyWeeks.findIndex((week) => !done.has(week));
  return journeyWeeks.map((week, index) => ({
    id: week,
    label: week.toUpperCase(),
    state: done.has(week) ? 'complete' : index === currentIndex ? 'current' : 'locked',
    caption: week === 'w5' && !done.has(week) ? 'Unlocks at Level 5' : undefined,
  }));
}
