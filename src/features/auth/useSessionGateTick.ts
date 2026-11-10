import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const TEN_MINUTES_MS = 10 * 60 * 1000;

/** Runs on mount, app foreground, and every 10 minutes. */
export function useSessionGateTick(onTick: () => void) {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    const run = () => onTickRef.current();
    run();

    const interval = setInterval(run, TEN_MINUTES_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') run();
    };
    const sub = AppState.addEventListener('change', onAppState);

    if (typeof document !== 'undefined') {
      const onVisible = () => {
        if (document.visibilityState === 'visible') run();
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        clearInterval(interval);
        sub.remove();
        document.removeEventListener('visibilitychange', onVisible);
      };
    }

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
