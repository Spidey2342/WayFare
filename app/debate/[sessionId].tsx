import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Screen, ScreenScroll } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchDebateResults,
  fetchDebateSession,
  fetchDebateTopicText,
  fetchSessionPlayers,
  rpcAdvancePhase,
  rpcAssignSides,
  rpcExtendDebate,
  rpcMarkDebateReadyToVote,
  rpcSetReady,
  rpcSubmitVote,
  type OnlineDebateSessionRow,
  type OnlineSessionPlayerRow,
} from '@/features/debate/api';
import { DebateResultsView } from '@/features/debate/components/DebateResultsView';
import type { DebateResults, DebateSide } from '@/features/debate/types';
import { useDebateRulesChrome } from '@/features/debate/components/DebateRulesChrome';
import { DebateStage } from '@/features/debate/components/DebateStage';
import { DebateVoteGrid } from '@/features/debate/components/DebateVoteGrid';
import { useDebateClock } from '@/features/debate/hooks/useDebateClock';
import { bundledDebateTopics } from '@/features/debate/localSession';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

export default function OnlineDebateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const [session, setSession] = useState<OnlineDebateSessionRow | null>(null);
  const [players, setPlayers] = useState<OnlineSessionPlayerRow[]>([]);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [votePick, setVotePick] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const rules = useDebateRulesChrome({ fallback: '/debate', showRulesOnMount: true });
  const { secondsLeft, syncing } = useDebateClock(session?.phase_ends_at);

  const reload = useCallback(async () => {
    if (!sessionId || !isSupabaseConfigured) return;
    setReconnecting(true);
    try {
      const row = await fetchDebateSession(sessionId);
      const roster = await fetchSessionPlayers(sessionId);
      setSession(row);
      setPlayers(roster);
      if (row?.topic_id) {
        const remote = await fetchDebateTopicText(row.topic_id);
        setTopic(
          remote ?? bundledDebateTopics().find((item) => item.id === row.topic_id)?.text ?? '',
        );
      }
      setError(null);
    } catch {
      setError('Reconnecting…');
    } finally {
      setReconnecting(false);
    }
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
          table: 'session_players',
          filter: `session_id=eq.${sessionId}`,
        },
        () => void reload(),
      )
      .subscribe();
    return () => {
      void requireSupabase().removeChannel(channel);
    };
  }, [sessionId, reload]);

  const isHost = session?.host_id === user?.id;
  const me = players.find((player) => player.user_id === user?.id);
  const forPlayers = useMemo(
    () =>
      players
        .filter((player) => player.side === 'for')
        .map((player) => ({
          id: player.user_id,
          displayName: player.display_name,
          side: 'for' as const,
        })),
    [players],
  );
  const againstPlayers = useMemo(
    () =>
      players
        .filter((player) => player.side === 'against')
        .map((player) => ({
          id: player.user_id,
          displayName: player.display_name,
          side: 'against' as const,
        })),
    [players],
  );

  const totalDebateSeconds = useMemo(() => {
    const cfg = session?.config ?? {};
    const base = Number(cfg.debateSeconds ?? 120);
    const extra = cfg.debateExtended ? Number(cfg.debateExtensionSeconds ?? 30) : 0;
    return base + extra;
  }, [session?.config]);

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <Text style={typeScale.h2}>Online debate needs Supabase in .env</Text>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <Text style={{ color: palette.white }}>
          {reconnecting || syncing ? 'Loading…' : 'Session not found'}
        </Text>
      </Screen>
    );
  }

  const readyCount = players.filter((player) => player.ready_to_vote).length;

  const startFromLobby = async () => {
    try {
      await rpcAssignSides(sessionId);
      await rpcAdvancePhase(sessionId);
      await reload();
    } catch {
      setError('Could not start debate.');
    }
  };

  if (session.phase === 'lobby') {
    return (
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          {rules.header}
          <Text style={typeScale.h2}>Lobby</Text>
          <Text style={styles.code}>Code {session.room_code}</Text>
          <Text style={styles.topic}>{topic}</Text>
          {players.map((player) => (
            <Text key={player.user_id} style={styles.playerLine}>
              {player.display_name} {player.is_ready ? '· Ready' : ''}
            </Text>
          ))}
          <Button
            label={me?.is_ready ? 'Unready' : 'Ready up'}
            variant="secondary"
            onPress={() => void rpcSetReady(sessionId, !me?.is_ready).then(reload)}
          />
          {isHost ? (
            <Button label="Start debate" variant="gold" onPress={() => void startFromLobby()} />
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenScroll>
        {rules.sheet}
      </Screen>
    );
  }

  if (session.phase === 'debate') {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          {rules.header}
          {error ? <Text style={styles.errorDark}>{error}</Text> : null}
          <DebateStage
            topic={topic}
            secondsLeft={secondsLeft}
            totalSeconds={totalDebateSeconds}
            forPlayers={forPlayers}
            againstPlayers={againstPlayers}
            readyCount={readyCount}
            playerCount={players.length}
            showReadyButton
            readyDisabled={me?.ready_to_vote}
            onReady={() => void rpcMarkDebateReadyToVote(sessionId).then(reload)}
            onStickerPlaceholder={() => undefined}
          />
          {isHost ? (
            <>
              <Button
                label="End debate early"
                variant="secondary"
                onPress={() => void rpcAdvancePhase(sessionId).then(reload)}
              />
              <Button
                label="Add 30 seconds"
                variant="ghost"
                onPress={() => void rpcExtendDebate(sessionId).then(reload)}
              />
            </>
          ) : null}
        </ScreenScroll>
        {rules.sheet}
      </Screen>
    );
  }

  if (session.phase === 'voting') {
    const candidates = players
      .filter((player) => player.user_id !== user?.id)
      .map((player) => ({
        id: player.user_id,
        displayName: player.display_name,
        side: player.side,
      }));
    const votingSeconds = Number(session.config?.votingSeconds ?? 30);
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          {rules.header}
          <DebateVoteGrid
            secondsLeft={secondsLeft}
            totalSeconds={votingSeconds}
            candidates={candidates}
            selectedId={votePick}
            onSelect={setVotePick}
            onSubmit={() => votePick && void rpcSubmitVote(sessionId, votePick).then(reload)}
          />
        </ScreenScroll>
        {rules.sheet}
      </Screen>
    );
  }

  if (session.phase === 'results' || session.status === 'finished') {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <ResultsBlock sessionId={sessionId} onBack={() => router.replace('/groups')} />
        </ScreenScroll>
        {rules.sheet}
      </Screen>
    );
  }

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <ScreenScroll contentContainerStyle={styles.content}>
        {rules.header}
        <Text style={styles.phase}>{session.phase}</Text>
        {isHost ? (
          <Button
            label="Continue"
            variant="gold"
            onPress={() => void rpcAdvancePhase(sessionId).then(reload)}
          />
        ) : (
          <Text style={styles.wait}>Waiting for host…</Text>
        )}
      </ScreenScroll>
    </Screen>
  );
}

function ResultsBlock({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const [results, setResults] = useState<Awaited<ReturnType<typeof fetchDebateResults>>>(null);
  const [players, setPlayers] = useState<OnlineSessionPlayerRow[]>([]);
  useEffect(() => {
    void fetchDebateResults(sessionId).then(setResults);
    void fetchSessionPlayers(sessionId).then(setPlayers);
  }, [sessionId]);
  if (!results) return <Text style={styles.wait}>Loading results…</Text>;
  const winningSide: DebateSide | null =
    results.winning_side === 'for' || results.winning_side === 'against'
      ? results.winning_side
      : null;
  const winningSides: DebateSide[] = results.tie ? [] : winningSide ? [winningSide] : [];
  const mappedResults: DebateResults = {
    winningSides,
    sideTie: results.tie,
    sideTotals: {
      for: results.side_totals?.for ?? 0,
      against: results.side_totals?.against ?? 0,
    },
    playerTotals: results.player_totals ?? {},
    mvpIds: results.mvp_ids,
    mvpTie: results.mvp_ids.length !== 1,
  };
  const debatePlayers = players.map((player) => ({
    id: player.user_id,
    displayName: player.display_name,
    side: player.side,
  }));
  return (
    <DebateResultsView
      dark
      results={mappedResults}
      players={debatePlayers}
      scores={{}}
      onBack={onBack}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: fontFamily.headingSemi, fontSize: 22, color: palette.ink },
  topic: { ...typeScale.bodyM, color: palette.warmGray },
  playerLine: { fontFamily: fontFamily.body, color: palette.ink },
  error: { color: palette.coral },
  errorDark: { color: palette.coralSoft },
  phase: { color: palette.white, fontFamily: fontFamily.bodySemi, fontSize: 18 },
  wait: { color: palette.warmGray },
});
