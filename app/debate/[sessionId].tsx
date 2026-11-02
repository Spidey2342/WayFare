import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { GameHelpSheet } from '@/components/game/GameHelpSheet';
import { BackButton, Button, Screen, ScreenScroll, TimerRing } from '@/components/ui';
import { DEBATE_HELP } from '@/features/game/helpCopy';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchDebatePlayers,
  fetchDebateSession,
  rpcAdvanceDebateRound,
  rpcCastDebateVote,
  type OnlineDebatePlayerRow,
  type OnlineDebateRow,
} from '@/features/debate/api';
import { getDeck } from '@/features/decks/repository';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function OnlineDebateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const [session, setSession] = useState<OnlineDebateRow | null>(null);
  const [players, setPlayers] = useState<OnlineDebatePlayerRow[]>([]);
  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!sessionId || !isSupabaseConfigured) return;
    const row = await fetchDebateSession(sessionId);
    const roster = await fetchDebatePlayers(sessionId);
    setSession(row);
    setPlayers(roster);
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured) return;
    const channel = requireSupabase()
      .channel(`debate-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_session_players',
          filter: `session_id=eq.${sessionId}`,
        },
        () => void reload(),
      )
      .subscribe();
    return () => {
      void requireSupabase().removeChannel(channel);
    };
  }, [sessionId, reload]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [session?.round_index]);

  const cardId = session?.card_ids[session.round_index];
  const deck = session ? getDeck(session.deck_id) : undefined;
  const prompt =
    deck?.cards.find((card) => card.id === cardId)?.prompt ?? 'Read the statement and vote.';

  const myVote = players.find((player) => player.user_id === user?.id)?.vote ?? null;
  const isHost = session?.host_id === user?.id;
  const agreeCount = players.filter((player) => player.vote === 'agree').length;
  const disagreeCount = players.filter((player) => player.vote === 'disagree').length;

  const vote = async (choice: 'agree' | 'disagree') => {
    setError(null);
    try {
      await rpcCastDebateVote(sessionId, choice);
      await reload();
    } catch {
      setError('Could not send your vote. Try again.');
    }
  };

  const nextRound = async () => {
    setError(null);
    try {
      const index = await rpcAdvanceDebateRound(sessionId);
      setSeconds(30);
      await reload();
      if (index < 0) router.replace('/groups');
    } catch {
      setError('Only the leader can advance the round.');
    }
  };

  const title = useMemo(
    () => (session?.status === 'complete' ? 'Debate complete' : 'Group debate'),
    [session?.status],
  );

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <Text style={typeScale.h2}>Online debate needs Supabase in .env</Text>
      </Screen>
    );
  }

  return (
    <>
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <BackButton label="Leave" fallback="/groups" />
            <Button label="?" variant="ghost" onPress={() => setHelpOpen(true)} />
          </View>
          <Text style={styles.kicker}>{title}</Text>
          <TimerRing secondsLeft={seconds} total={30} />
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Statement</Text>
            <Text style={styles.prompt}>{prompt}</Text>
          </View>
          <Text style={styles.tally}>
            Agree {agreeCount} · Disagree {disagreeCount}
          </Text>
          <Button
            label="Agree"
            variant="gold"
            disabled={!!myVote}
            onPress={() => void vote('agree')}
          />
          <Button
            label="Disagree"
            variant="secondary"
            disabled={!!myVote}
            onPress={() => void vote('disagree')}
          />
          {myVote ? <Text style={styles.meta}>You voted: {myVote}</Text> : null}
          {isHost ? (
            <Button label="Next statement" variant="primary" onPress={() => void nextRound()} />
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenScroll>
      </Screen>
      <GameHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} lines={DEBATE_HELP} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
  card: {
    backgroundColor: palette.coral,
    borderRadius: radii.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  cardLabel: { ...typeScale.caption, color: palette.white, opacity: 0.85 },
  prompt: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 22,
    color: palette.white,
    lineHeight: 30,
  },
  tally: { color: palette.warmGray, fontFamily: fontFamily.bodySemi, textAlign: 'center' },
  meta: { color: palette.white, fontFamily: fontFamily.body, textAlign: 'center' },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
