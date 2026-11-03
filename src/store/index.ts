import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { applyDebateAward as mergeDebateAward } from '@/features/debate/applyDebateAward';
import {
  applyLessonComplete,
  applyQuizComplete,
  applySession,
  completeWeekly,
  toggleBookRead,
  type SessionAward,
} from '@/features/journey/progress';
import type { ChecklistItemId } from '@/features/onboarding/checklist';
import { storage } from '@/services/storage';

import {
  defaultPersisted,
  migratePersisted,
  STORE_VERSION,
  type PersistedApp,
  type PlayModeHelpSeen,
} from './persist';
import { isSignedInPersist, stripServerOwnedForPersist } from './signedInPersist';

interface AppActions {
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setThemePreference: (themePreference: PersistedApp['themePreference']) => void;
  completeOnboarding: (mode: 'pass' | 'team') => void;
  setProfileName: (name: string) => void;
  setInstallPromptDismissed: (dismissed: boolean) => void;
  setGuidelinesSeen: (seen: boolean) => void;
  setFoundingMember: (joined: boolean) => void;
  setNotifyInterest: (interested: boolean) => void;
  toggleFavorite: (deckId: string) => void;
  applySessionAward: (award: SessionAward) => void;
  completeWeeklyChallenge: () => void;
  completeLesson: (lessonId: string) => void;
  toggleBook: (bookId: string) => void;
  completeQuiz: () => void;
  resetGuest: () => void;
  clearUserSessionState: () => void;
  markChecklistItem: (id: ChecklistItemId) => void;
  dismissChecklist: () => void;
  setLocalTutorialStep: (step: number) => void;
  completeLocalTutorial: () => void;
  markPlayModeHelpSeen: (mode: keyof PlayModeHelpSeen) => void;
  applyDebateAward: (args: Parameters<typeof mergeDebateAward>[1]) => void;
  awardFirstStepFromTutorial: () => void;
  markIntroSeen: () => void;
  markRulesSeen: (gameId: 'debate' | 'card-game') => void;
  setGuestBrowseAccepted: (accepted: boolean) => void;
}

export type AppStore = PersistedApp & AppActions;

const storageAdapter = {
  getItem: (name: string) => storage.getItem(name),
  setItem: (name: string, value: string) => storage.setItem(name, value),
  removeItem: (name: string) => storage.removeItem(name),
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...defaultPersisted(),
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setThemePreference: (themePreference) => set({ themePreference }),
      completeOnboarding: (mode) => set({ onboarded: true, preferredMode: mode }),
      setProfileName: (name) =>
        set((state) => ({
          profile: { ...state.profile, name: name.trim() || state.profile.name },
        })),
      setInstallPromptDismissed: (installPromptDismissed) => set({ installPromptDismissed }),
      setGuidelinesSeen: (guidelinesSeen) => set({ guidelinesSeen }),
      setFoundingMember: (foundingMember) => set({ foundingMember }),
      setNotifyInterest: (notifyInterest) => set({ notifyInterest }),
      toggleFavorite: (deckId) =>
        set((state) => ({
          favoriteDeckIds: state.favoriteDeckIds.includes(deckId)
            ? state.favoriteDeckIds.filter((id) => id !== deckId)
            : [...state.favoriteDeckIds, deckId],
        })),
      applySessionAward: (award) =>
        set((state) => ({ progress: applySession(state.progress, award, new Date()) })),
      completeWeeklyChallenge: () =>
        set((state) => ({ progress: completeWeekly(state.progress, new Date()) })),
      completeLesson: (lessonId) =>
        set((state) => ({
          progress: applyLessonComplete(state.progress, lessonId, new Date()),
        })),
      toggleBook: (bookId) =>
        set((state) => ({ progress: toggleBookRead(state.progress, bookId) })),
      completeQuiz: () =>
        set((state) => ({ progress: applyQuizComplete(state.progress, new Date()) })),
      resetGuest: () => set({ ...defaultPersisted(), onboarded: false, hydrated: true }),
      clearUserSessionState: () =>
        set((state) => ({
          ...defaultPersisted(),
          themePreference: state.themePreference,
          hydrated: true,
        })),
      markChecklistItem: (id) =>
        set((state) => ({
          checklist: {
            ...state.checklist,
            ...(id === 'profile' ? { profileDone: true } : {}),
            ...(id === 'firstCard' ? { firstCardDone: true } : {}),
            ...(id === 'friends' ? { friendsDone: true } : {}),
            ...(id === 'lesson' ? { lessonDone: true } : {}),
          },
        })),
      dismissChecklist: () =>
        set((state) => ({ checklist: { ...state.checklist, dismissed: true } })),
      setLocalTutorialStep: (localTutorialStep) => set({ localTutorialStep }),
      completeLocalTutorial: () =>
        set({ localTutorialCompleted: true, localTutorialStep: 3, onboarded: true }),
      markPlayModeHelpSeen: (mode) =>
        set((state) => ({
          playModeHelpSeen: { ...state.playModeHelpSeen, [mode]: true },
        })),
      applyDebateAward: (args) =>
        set((state) => ({ progress: mergeDebateAward(state.progress, args, new Date()) })),
      markIntroSeen: () => set({ introSeen: true, onboarded: true }),
      markRulesSeen: (gameId) =>
        set((state) => ({
          seenRules: { ...state.seenRules, [gameId]: true },
        })),
      setGuestBrowseAccepted: (guestBrowseAccepted) => set({ guestBrowseAccepted }),
      awardFirstStepFromTutorial: () =>
        set((state) => {
          const badges = state.progress.badgesEarned.includes('first-step')
            ? state.progress.badgesEarned
            : [...state.progress.badgesEarned, 'first-step'];
          return {
            progress: {
              ...state.progress,
              badgesEarned: badges,
              sessionsCompleted: Math.max(1, state.progress.sessionsCompleted),
            },
            checklist: { ...state.checklist, firstCardDone: true },
          };
        }),
    }),
    {
      name: 'wayfare.store',
      version: STORE_VERSION,
      storage: createJSONStorage(() => storageAdapter),
      migrate: (persisted, version) => migratePersisted(persisted, version),
      partialize: (state) => ({
        themePreference: state.themePreference,
        onboarded: state.onboarded,
        preferredMode: state.preferredMode,
        profile: isSignedInPersist() ? { name: '', avatarColor: '' } : state.profile,
        installPromptDismissed: state.installPromptDismissed,
        guidelinesSeen: state.guidelinesSeen,
        foundingMember: state.foundingMember,
        notifyInterest: state.notifyInterest,
        favoriteDeckIds: state.favoriteDeckIds,
        progress: stripServerOwnedForPersist(state.progress),
        checklist: state.checklist,
        localTutorialStep: state.localTutorialStep,
        localTutorialCompleted: state.localTutorialCompleted,
        playModeHelpSeen: state.playModeHelpSeen,
        introSeen: state.introSeen,
        guestBrowseAccepted: state.guestBrowseAccepted,
        seenRules: state.seenRules,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
          return;
        }
        useAppStore.setState({ hydrated: true });
      },
    },
  ),
);
