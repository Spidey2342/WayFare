import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
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
import { DebateHelpSheet } from '@/features/debate/components/DebateHelpSheet';
import { DebateStage } from '@/features/debate/components/DebateStage';
import { useDebateClock } from '@/features/debate/hooks/useDebateClock';
import { bundledDebateTopics } from '@/features/debate/localSession';
import { useAppStore } from '@/store';
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [votePick, setVotePick] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const markHelp = useAppStore((state) => state.markPlayModeHelpSeen);
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
          <Header help={() => setHelpOpen(true)} leaveHref="/debate" />
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
        <DebateHelpSheet
          open={helpOpen}
          onClose={() => {
            setHelpOpen(false);
            markHelp('debate');
          }}
        />
      </Screen>
    );
  }

  if (session.phase === 'debate') {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Header help={() => setHelpOpen(true)} leaveHref="/debate" />
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
        <DebateHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      </Screen>
    );
  }

  if (session.phase === 'voting') {
    const candidates = players.filter((player) => player.user_id !== user?.id);
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Header help={() => setHelpOpen(true)} leaveHref="/debate" />
          <Text style={styles.phase}>Voting · {secondsLeft}s</Text>
          {candidates.map((player) => (
            <Button
              key={player.user_id}
              label={player.display_name}
              variant={votePick === player.user_id ? 'gold' : 'secondary'}
              onPress={() => setVotePick(player.user_id)}
            />
          ))}
          <Button
            label="Submit vote"
            variant="primary"
            disabled={!votePick}
            onPress={() => votePick && void rpcSubmitVote(sessionId, votePick).then(reload)}
          />
        </ScreenScroll>
      </Screen>
    );
  }

  if (session.phase === 'results' || session.status === 'finished') {
    return (
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Text style={typeScale.h1}>Results</Text>
          <ResultsBlock sessionId={sessionId} />
          <Button label="Back to groups" variant="gold" onPress={() => router.replace('/groups')} />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Header help={() => setHelpOpen(true)} leaveHref="/debate" />
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

function ResultsBlock({ sessionId }: { sessionId: string }) {
  const [results, setResults] = useState<Awaited<ReturnType<typeof fetchDebateResults>>>(null);
  useEffect(() => {
    void fetchDebateResults(sessionId).then(setResults);
  }, [sessionId]);
  if (!results) return <Text>Loading results…</Text>;
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.topic}>
        {results.tie ? 'Side tie' : `Winning side: ${results.winning_side?.toUpperCase()}`}
      </Text>
      <Text style={styles.topic}>MVP count: {results.mvp_ids.length}</Text>
    </View>
  );
}

function Header({ help, leaveHref }: { help: () => void; leaveHref: '/debate' | '/groups' }) {
  return (
    <View style={styles.headerRow}>
      <BackButton label="Leave" fallback={leaveHref} />
      <Button label="?" variant="ghost" onPress={help} />
    </View>
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
