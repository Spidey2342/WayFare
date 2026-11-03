import { useEffect, useMemo, useState } from 'react';

import { requireSupabase } from '@/services/supabase';

/** Realtime presence: another tab/device with the same user id supersedes this client. */
export function useDebateDeviceSuperseded(sessionId: string, userId: string | undefined): boolean {
  const clientId = useMemo(
    () =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `c-${sessionId.slice(0, 8)}`,
    [sessionId],
  );
  const [superseded, setSuperseded] = useState(false);

  useEffect(() => {
    if (!sessionId || !userId) return undefined;
    const channel = requireSupabase().channel(`debate-presence-${sessionId}`, {
      config: { presence: { key: userId } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<
        string,
        { client_id?: string; online_at?: number }[]
      >;
      const peers = Object.values(state).flat();
      const others = peers.filter((row) => row.client_id && row.client_id !== clientId);
      if (others.length > 0) {
        const newest = Math.max(...others.map((row) => row.online_at ?? 0));
        const mine = peers.find((row) => row.client_id === clientId);
        if (mine && newest > (mine.online_at ?? 0)) setSuperseded(true);
      }
    });

    void channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          client_id: clientId,
          online_at: Date.now(),
        });
      }
    });

    return () => {
      void requireSupabase().removeChannel(channel);
    };
  }, [sessionId, userId, clientId]);

  return superseded;
}

export type PresenceChipState = 'online' | 'reconnecting' | 'away';

export function presenceChipForParticipant(
  presence: 'online' | 'away',
  lastSeenAt: string,
  serverNowMs: number,
  isRefetching: boolean,
): PresenceChipState {
  if (isRefetching) return 'reconnecting';
  if (presence === 'online') return 'online';
  const age = serverNowMs - new Date(lastSeenAt).getTime();
  if (age < 60_000) return 'reconnecting';
  return 'away';
}
