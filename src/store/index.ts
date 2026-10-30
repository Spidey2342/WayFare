import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '@/services/storage';

import { defaultPersisted, migratePersisted, STORE_VERSION, type PersistedApp } from './persist';

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
  resetGuest: () => void;
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
      resetGuest: () => set({ ...defaultPersisted(), onboarded: false, hydrated: true }),
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
        profile: state.profile,
        installPromptDismissed: state.installPromptDismissed,
        guidelinesSeen: state.guidelinesSeen,
        foundingMember: state.foundingMember,
        notifyInterest: state.notifyInterest,
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
