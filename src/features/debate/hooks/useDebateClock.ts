import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { rpcServerNow } from '@/features/debate/api';

export function useDebateClock(phaseEndsAt: string | null | undefined) {
  const [offsetMs, setOffsetMs] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const hiddenRef = useRef(false);

  const syncOffset = useCallback(async () => {
    setSyncing(true);
    try {
      const server = await rpcServerNow();
      const serverMs = new Date(server).getTime();
      setOffsetMs(serverMs - Date.now());
    } catch {
      setOffsetMs(0);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync server clock on mount
    void syncOffset();
  }, [syncOffset]);

  const computeSeconds = useCallback(() => {
    if (!phaseEndsAt) return 0;
    const end = new Date(phaseEndsAt).getTime();
    const now = Date.now() + offsetMs;
    return Math.max(0, Math.ceil((end - now) / 1000));
  }, [offsetMs, phaseEndsAt]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize countdown
    setSecondsLeft(computeSeconds());
    if (hiddenRef.current) return undefined;
    const timer = setInterval(() => setSecondsLeft(computeSeconds()), 1000);
    return () => clearInterval(timer);
  }, [computeSeconds, phaseEndsAt]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      hiddenRef.current = state !== 'active';
      if (state === 'active') {
        void syncOffset();
        setSecondsLeft(computeSeconds());
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    if (typeof document !== 'undefined') {
      const onVis = () => {
        hiddenRef.current = document.hidden;
        if (!document.hidden) {
          void syncOffset();
          setSecondsLeft(computeSeconds());
        }
      };
      document.addEventListener('visibilitychange', onVis);
      return () => {
        sub.remove();
        document.removeEventListener('visibilitychange', onVis);
      };
    }
    return () => sub.remove();
  }, [computeSeconds, syncOffset]);

  return { secondsLeft, syncing, resync: syncOffset };
}
