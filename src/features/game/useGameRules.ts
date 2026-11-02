import { useCallback, useMemo, useState } from 'react';

import type { GameRulesId } from '@/data/gameRules';
import { rulesForGame } from '@/data/gameRules';
import { useAppStore } from '@/store';

export function useGameRules(gameId: GameRulesId) {
  const seenRules = useAppStore((state) => state.seenRules);
  const markRulesSeen = useAppStore((state) => state.markRulesSeen);
  const entry = useMemo(() => rulesForGame(gameId), [gameId]);
  const [open, setOpen] = useState(false);

  const openIfFirstTime = useCallback(() => {
    if (!seenRules[gameId]) {
      setOpen(true);
    }
  }, [gameId, seenRules]);

  const openRules = useCallback(() => setOpen(true), []);
  const closeRules = useCallback(() => {
    setOpen(false);
    markRulesSeen(gameId);
  }, [gameId, markRulesSeen]);

  return { entry, open, openRules, openIfFirstTime, closeRules };
}
