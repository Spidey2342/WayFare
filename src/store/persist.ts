import { defaultChecklistState, type ChecklistState } from '@/features/onboarding/checklist';
import { defaultProgress, type GameProgress } from '@/features/journey/progress';
import { sanitizeBadgesEarned } from '@/features/journey/badgeMigration';
import type { ThemePreference } from '@/theme';

export interface Profile {
  name: string;
  avatarColor: string;
}

export type PlayModeHelpSeen = {
  solo: boolean;
  pass: boolean;
  online: boolean;
  debate: boolean;
};

export interface PersistedApp {
  themePreference: ThemePreference;
  onboarded: boolean;
  preferredMode: 'pass' | 'team' | null;
  profile: Profile;
  installPromptDismissed: boolean;
  guidelinesSeen: boolean;
  foundingMember: boolean;
  notifyInterest: boolean;
  favoriteDeckIds: string[];
  progress: GameProgress;
  checklist: ChecklistState;
  localTutorialStep: number;
  localTutorialCompleted: boolean;
  playModeHelpSeen: PlayModeHelpSeen;
  introSeen: boolean;
  seenRules: Partial<Record<'debate' | 'card-game', boolean>>;
}

export const STORE_VERSION = 7;

export function defaultPersisted(): PersistedApp {
  return {
    themePreference: 'light',
    onboarded: false,
    preferredMode: null,
    profile: {
      name: 'Kofi',
      avatarColor: '#FFB800',
    },
    installPromptDismissed: false,
    guidelinesSeen: false,
    foundingMember: false,
    notifyInterest: false,
    favoriteDeckIds: [],
    progress: defaultProgress(),
    checklist: defaultChecklistState(),
    localTutorialStep: 0,
    localTutorialCompleted: false,
    playModeHelpSeen: { solo: false, pass: false, online: false, debate: false },
    introSeen: false,
    seenRules: {},
  };
}

function readChecklist(value: unknown, fallback: ChecklistState): ChecklistState {
  if (!value || typeof value !== 'object') return fallback;
  const record = value as Record<string, unknown>;
  return {
    profileDone: record.profileDone === true,
    firstCardDone: record.firstCardDone === true,
    friendsDone: record.friendsDone === true,
    lessonDone: record.lessonDone === true,
    dismissed: record.dismissed === true,
  };
}

function readPlayModeHelp(value: unknown, fallback: PlayModeHelpSeen): PlayModeHelpSeen {
  if (!value || typeof value !== 'object') return fallback;
  const record = value as Record<string, unknown>;
  return {
    solo: record.solo === true,
    pass: record.pass === true,
    online: record.online === true,
    debate: record.debate === true,
  };
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function readProfile(value: unknown, fallback: Profile): Profile {
  if (!value || typeof value !== 'object') return fallback;
  const record = value as Record<string, unknown>;
  return {
    name:
      typeof record.name === 'string' && record.name.trim().length > 0
        ? record.name
        : fallback.name,
    avatarColor: typeof record.avatarColor === 'string' ? record.avatarColor : fallback.avatarColor,
  };
}

export function migratePersisted(persisted: unknown, fromVersion: number): PersistedApp {
  const base = defaultPersisted();
  if (!persisted || typeof persisted !== 'object') return base;

  const record = persisted as Record<string, unknown>;
  if (fromVersion > STORE_VERSION) return base;

  const themePreference = isPreference(record.themePreference)
    ? record.themePreference
    : base.themePreference;

  const progress = readProgress(record.progress, base.progress, fromVersion);

  return {
    ...base,
    themePreference,
    onboarded: record.onboarded === true,
    preferredMode:
      record.preferredMode === 'pass' || record.preferredMode === 'team'
        ? record.preferredMode
        : null,
    profile: readProfile(record.profile, base.profile),
    installPromptDismissed: record.installPromptDismissed === true,
    guidelinesSeen: record.guidelinesSeen === true,
    foundingMember: record.foundingMember === true,
    notifyInterest: record.notifyInterest === true,
    favoriteDeckIds: readStringList(record.favoriteDeckIds),
    progress,
    checklist: readChecklist(record.checklist, base.checklist),
    localTutorialStep:
      typeof record.localTutorialStep === 'number' && record.localTutorialStep >= 0
        ? record.localTutorialStep
        : base.localTutorialStep,
    localTutorialCompleted: record.localTutorialCompleted === true,
    playModeHelpSeen: readPlayModeHelp(record.playModeHelpSeen, base.playModeHelpSeen),
    introSeen:
      record.introSeen === true ||
      record.localTutorialCompleted === true ||
      (fromVersion < 7 && record.onboarded === true),
    seenRules: readSeenRules(record.seenRules),
  };
}

function readSeenRules(value: unknown): Partial<Record<'debate' | 'card-game', boolean>> {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  return {
    debate: record.debate === true,
    'card-game': record['card-game'] === true,
  };
}

function readCount(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function readProgress(value: unknown, fallback: GameProgress, _fromVersion: number): GameProgress {
  if (!value || typeof value !== 'object') return fallback;
  const record = value as Record<string, unknown>;
  const badgesEarned = sanitizeBadgesEarned(readStringList(record.badgesEarned));

  return {
    xp: readCount(record, 'xp'),
    streakDays: readCount(record, 'streakDays'),
    lastPlayedDate: typeof record.lastPlayedDate === 'string' ? record.lastPlayedDate : null,
    cardsPlayed: readCount(record, 'cardsPlayed'),
    actsOfService: readCount(record, 'actsOfService'),
    sessionsCompleted: readCount(record, 'sessionsCompleted'),
    completedWeeks: readStringList(record.completedWeeks),
    badgesEarned,
    wordCards: readCount(record, 'wordCards'),
    questionCards: readCount(record, 'questionCards'),
    dareCards: readCount(record, 'dareCards'),
    challengeCards: readCount(record, 'challengeCards'),
    testimonyCards: readCount(record, 'testimonyCards'),
    weeklyCompleted: record.weeklyCompleted === true,
    weeklyWeekKey:
      typeof record.weeklyWeekKey === 'string' ? record.weeklyWeekKey : fallback.weeklyWeekKey,
    lastAppliedSessionId:
      typeof record.lastAppliedSessionId === 'string' ? record.lastAppliedSessionId : null,
    completedLessons: readStringList(record.completedLessons),
    booksRead: readStringList(record.booksRead),
    quizzesCompleted: readCount(record, 'quizzesCompleted'),
    debateVotesCast: readCount(record, 'debateVotesCast'),
    debateMvps: readCount(record, 'debateMvps'),
    lastAppliedDebateId:
      typeof record.lastAppliedDebateId === 'string' ? record.lastAppliedDebateId : null,
  };
}
