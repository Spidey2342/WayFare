import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** Ticks `nowMs` every second while the app/tab is visible; resyncs when returning. */
export function useTabVisibleClock(onVisible?: () => void) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const hiddenRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      if (!hiddenRef.current) setNowMs(Date.now());
    };
    const timer = setInterval(tick, 1000);

    const onAppState = (state: AppStateStatus) => {
      hiddenRef.current = state !== 'active';
      if (state === 'active') {
        setNowMs(Date.now());
        onVisible?.();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    if (typeof document !== 'undefined') {
      const onVis = () => {
        hiddenRef.current = document.hidden;
        if (!document.hidden) {
          setNowMs(Date.now());
          onVisible?.();
        }
      };
      document.addEventListener('visibilitychange', onVis);
      return () => {
        clearInterval(timer);
        sub.remove();
        document.removeEventListener('visibilitychange', onVis);
      };
    }

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [onVisible]);

  return nowMs;
}
