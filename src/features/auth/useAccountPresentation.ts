import { useEffect, useState } from 'react';

import { avatarColorForKey } from '@/data/avatarPresets';
import { syncMyStats, type CachedBadge, type CachedUserStats } from '@/features/debate/statsCache';
import { levelForXp } from '@/features/journey/progress';
import { useAuth } from '@/features/auth/AuthContext';
import { isSupabaseConfigured } from '@/services/supabase';
import { useAppStore } from '@/store';

export type AccountPresentation =
  | {
      status: 'guest';
      displayName: 'Guest';
      avatarColor: string;
      xp: number;
      streakDays: number;
      badgeIds: string[];
      cardsPlayed: number;
      actsOfService: number;
    }
  | { status: 'loading' }
  | {
      status: 'ready';
      displayName: string;
      avatarColor: string;
      xp: number;
      streakDays: number;
      badgeIds: string[];
      cardsPlayed: number;
      actsOfService: number;
    }
  | { status: 'error'; message: string; retry: () => void };

export function useAccountPresentation(): AccountPresentation {
  const { session, profile, isGuest, ready } = useAuth();
  const guestProgress = useAppStore((state) => state.progress);
  const userId = session?.user?.id ?? null;
  const [stats, setStats] = useState<CachedUserStats | null>(null);
  const [badges, setBadges] = useState<CachedBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!userId || isGuest) return undefined;
    let cancelled = false;
    /* Async stats refresh after auth — loading toggles in promise callbacks only. */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off network fetch for Supabase stats
    setLoading(true);
    setError(null);
    void syncMyStats(userId)
      .then((synced) => {
        if (cancelled) return;
        setStats(synced.stats);
        setBadges(synced.badges);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not load your stats.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isGuest, reloadToken]);

  if (!ready) return { status: 'loading' };

  if (!session) {
    if (!isGuest && isSupabaseConfigured) {
      return { status: 'loading' };
    }
    return {
      status: 'guest',
      displayName: 'Guest',
      avatarColor: avatarColorForKey('midnight'),
      xp: guestProgress.xp,
      streakDays: guestProgress.streakDays,
      badgeIds: guestProgress.badgesEarned,
      cardsPlayed: guestProgress.cardsPlayed,
      actsOfService: guestProgress.actsOfService,
    };
  }

  if (error) {
    return {
      status: 'error',
      message: error,
      retry: () => setReloadToken((value) => value + 1),
    };
  }

  if (loading || !profile) {
    return { status: 'loading' };
  }

  const displayName = profile.display_name?.trim() ?? '';
  const avatarColor = avatarColorForKey(profile.avatar_key ?? profile.id);
  const xp = stats?.xp ?? 0;
  const streakDays = stats?.streak_days ?? 0;
  const badgeIds = badges.map((row) => row.badge_id);

  return {
    status: 'ready',
    displayName,
    avatarColor,
    xp,
    streakDays,
    badgeIds,
    cardsPlayed: guestProgress.cardsPlayed,
    actsOfService: guestProgress.actsOfService,
  };
}

export function rankForAccount(presentation: AccountPresentation) {
  const xp =
    presentation.status === 'ready'
      ? presentation.xp
      : presentation.status === 'guest'
        ? presentation.xp
        : 0;
  return levelForXp(xp);
}
