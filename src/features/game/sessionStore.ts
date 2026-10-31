import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '@/services/storage';
import { previewCards } from '@/data/previewCards';

import {
  completeCard,
  createSession,
  drawCard,
  drawPreferred,
  recordBless,
  rollDice,
  skipCard,
} from './engine';
import { mulberry32 } from './rng';
import type { CompleteInput, DiceFace, GameMode, Session } from './types';

interface SessionState {
  session: Session | null;
  lastDice: DiceFace | null;
  start: (input: {
    mode: GameMode;
    minutes: number;
    players: { id: string; name: string; teamId?: string }[];
    teams: { id: string; name: string; playerIds: string[] }[];
  }) => string;
  draw: () => void;
  skip: () => void;
  finish: (input: CompleteInput) => void;
  roll: () => DiceFace;
  bless: () => void;
  clearDice: () => void;
  clear: () => void;
  lastError: string | null;
}

const random = () => Math.random();

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      lastDice: null,
      lastError: null,
      start: (input) => {
        const id = `s_${Date.now().toString(36)}`;
        const session = createSession(
          {
            id,
            mode: input.mode,
            players: input.players,
            teams: input.teams,
            cards: previewCards,
            roundLengthMinutes: input.minutes,
            now: new Date().toISOString(),
          },
          mulberry32(Date.now() % 100000),
        );
        set({ session, lastDice: null, lastError: null });
        return id;
      },
      draw: () => {
        const session = get().session;
        if (!session || session.status !== 'active' || session.currentCardId) return;
        const dice = get().lastDice;
        const types =
          dice === 'truth'
            ? (['question', 'testimony'] as const)
            : dice === 'dare'
              ? (['dare'] as const)
              : null;
        try {
          const next = types
            ? drawPreferred(session, [...types], random)
            : drawCard(session, random);
          set({ session: next, lastDice: null, lastError: null });
        } catch (error) {
          set({ lastError: error instanceof Error ? error.message : 'Could not draw a card.' });
        }
      },
      skip: () => {
        const session = get().session;
        if (!session) return;
        try {
          set({ session: skipCard(session, random), lastError: null });
        } catch (error) {
          set({ lastError: error instanceof Error ? error.message : 'Could not skip.' });
        }
      },
      finish: (input) => {
        const session = get().session;
        if (!session) return;
        try {
          set({ session: completeCard(session, input), lastError: null });
        } catch (error) {
          set({ lastError: error instanceof Error ? error.message : 'Could not finish the card.' });
        }
      },
      bless: () => {
        const session = get().session;
        if (!session) return;
        try {
          set({ session: recordBless(session), lastDice: null, lastError: null });
        } catch (error) {
          set({
            lastError: error instanceof Error ? error.message : 'Could not record the blessing.',
          });
        }
      },
      roll: () => {
        const face = rollDice(random);
        set({ lastDice: face });
        return face;
      },
      clearDice: () => set({ lastDice: null }),
      clear: () => set({ session: null, lastDice: null, lastError: null }),
    }),
    {
      name: 'wayfare.session',
      version: 1,
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ session: state.session, lastDice: state.lastDice }),
    },
  ),
);
