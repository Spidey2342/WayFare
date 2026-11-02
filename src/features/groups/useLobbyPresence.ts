import { useCallback, useEffect, useRef, useState } from 'react';

import { requireSupabase } from '@/services/supabase';

type PresencePayload = {
  user_id: string;
  ready: boolean;
};

function parsePresenceState(state: Record<string, PresencePayload[]>) {
  const ready: Record<string, boolean> = {};
  const online: Record<string, boolean> = {};
  Object.values(state).forEach((entries) => {
    entries.forEach((entry) => {
      if (!entry?.user_id) return;
      online[entry.user_id] = true;
      ready[entry.user_id] = !!entry.ready;
    });
  });
  return { ready, online };
}

export function useLobbyPresence(groupId: string, userId: string | undefined) {
  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({});
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const readyRef = useRef(false);
  const [selfReadyState, setSelfReadyState] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof requireSupabase>['channel']> | null>(null);

  const syncFromChannel = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = channel.presenceState<PresencePayload>();
    const parsed = parsePresenceState(state);
    setReadyMap(parsed.ready);
    setOnlineMap(parsed.online);
  }, []);

  useEffect(() => {
    if (!groupId || !userId) return undefined;

    const channel = requireSupabase().channel(`group:${groupId}:lobby`, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => syncFromChannel())
      .on('presence', { event: 'join' }, () => syncFromChannel())
      .on('presence', { event: 'leave' }, () => syncFromChannel())
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, ready: readyRef.current });
          syncFromChannel();
        }
      });

    return () => {
      void channel.untrack();
      void requireSupabase().removeChannel(channel);
      channelRef.current = null;
    };
  }, [groupId, syncFromChannel, userId]);

  const setSelfReady = useCallback(
    async (ready: boolean) => {
      if (!userId) return;
      readyRef.current = ready;
      setSelfReadyState(ready);
      const channel = channelRef.current;
      if (channel) {
        await channel.track({ user_id: userId, ready });
        syncFromChannel();
      }
    },
    [syncFromChannel, userId],
  );

  const clearPresence = useCallback(async () => {
    const channel = channelRef.current;
    if (channel) await channel.untrack();
  }, []);

  return {
    readyMap,
    onlineMap,
    setSelfReady,
    clearPresence,
    selfReady: userId
      ? readyMap[userId] !== undefined
        ? readyMap[userId]!
        : selfReadyState
      : false,
  };
}
