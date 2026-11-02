import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { DebateHelpSheet } from '@/features/debate/components/DebateHelpSheet';
import { DebateStage } from '@/features/debate/components/DebateStage';
import {
  assignPassSidesRandom,
  extendDebate,
  finalizeLocalSession,
  hostEndDebate,
  skipPrep,
  startDebate,
  startPrep,
  submitPassVote,
  tapReadyToVote,
  tickSession,
} from '@/features/debate/localSession';
import { loadLocalDebate, updateLocalDebate } from '@/features/debate/localStore';
import type { DebatePlayer, LocalDebateSession } from '@/features/debate/types';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function PassDebateSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const [session, setSession] = useState<LocalDebateSession | undefined>(() =>
    loadLocalDebate(sessionId),
  );
  const [helpOpen, setHelpOpen] = useState(() => !useAppStore.getState().playModeHelpSeen.debate);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [readyIds, setReadyIds] = useState<string[]>([]);
  const [votePick, setVotePick] = useState<string | null>(null);
  const applyDebate = useAppStore((state) => state.applyDebateAward);
  const markDebateHelp = useAppStore((state) => state.markPlayModeHelpSeen);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    const timer = setInterval(() => {
      updateLocalDebate(sessionId, (current) => tickSession(current));
      setSession(loadLocalDebate(sessionId));
    }, 500);
    return () => clearInterval(timer);
  }, [session, sessionId]);

  const persist = (updater: (current: LocalDebateSession) => LocalDebateSession) => {
    const next = updateLocalDebate(sessionId, updater);
    setSession(next);
  };

  const forPlayers = useMemo(
    () => session?.players.filter((player) => player.side === 'for') ?? [],
    [session?.players],
  );
  const againstPlayers = useMemo(
    () => session?.players.filter((player) => player.side === 'against') ?? [],
    [session?.players],
  );

  if (!session) {
    return (
      <Screen>
        <Text style={typeScale.h2}>Session not found</Text>
        <Button
          label="Back"
          variant="primary"
          onPress={() => router.replace('/debate/pass/setup')}
        />
      </Screen>
    );
  }

  const currentVoter = session.pass ? session.players[session.pass.votingPlayerIndex] : undefined;

  const awardIfNeeded = (finishedSession: LocalDebateSession) => {
    const xpGained = Object.values(finishedSession.scores).reduce(
      (sum, line) => sum + (line?.total ?? 0),
      0,
    );
    const votedThisRound = Object.values(finishedSession.votes).some(Boolean);
    const wasMvp = finishedSession.results?.mvpIds.length === 1;
    applyDebate({
      sessionId: finishedSession.id,
      xpGained: Math.max(1, xpGained),
      votedThisRound,
      wasMvp,
    });
  };

  if (session.phase === 'lobby') {
    return (
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Header onHelp={() => setHelpOpen(true)} fallback="/debate/pass/setup" />
          <Text style={typeScale.h2}>Lobby</Text>
          <Text style={styles.topic}>{session.topic.text}</Text>
          {session.players.map((player) => (
            <View key={player.id} style={styles.row}>
              <Text style={styles.name}>{player.displayName}</Text>
              <Button
                label={readyIds.includes(player.id) ? 'Ready' : 'Mark ready'}
                variant={readyIds.includes(player.id) ? 'gold' : 'secondary'}
                onPress={() =>
                  setReadyIds((ids) => (ids.includes(player.id) ? ids : [...ids, player.id]))
                }
              />
            </View>
          ))}
          <Button
            label="Reveal sides"
            variant="primary"
            onPress={() => {
              if (readyIds.length < session.players.length) {
                persist((current) => assignPassSidesRandom(current, () => 0.42));
              } else {
                persist((current) => assignPassSidesRandom(current, () => Math.random()));
              }
            }}
          />
        </ScreenScroll>
        <DebateHelpSheet
          open={helpOpen}
          onClose={() => {
            setHelpOpen(false);
            markDebateHelp('debate');
          }}
        />
      </Screen>
    );
  }

  if (session.phase === 'side_reveal') {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Header onHelp={() => setHelpOpen(true)} fallback="/debate" />
          {session.players.map((player) => (
            <View key={player.id} style={[styles.revealCard, sideStyle(player)]}>
              <Text style={styles.revealName}>{player.displayName}</Text>
              <Text style={styles.revealSide}>{player.side?.toUpperCase()}</Text>
            </View>
          ))}
          <Button label="Start prep" variant="gold" onPress={() => persist(startPrep)} />
        </ScreenScroll>
        <DebateHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      </Screen>
    );
  }

  if (session.phase === 'prep') {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Header onHelp={() => setHelpOpen(true)} fallback="/debate" />
          <Text style={styles.phaseTitle}>Prep</Text>
          <Text style={styles.topicDark}>{session.topic.text}</Text>
          <Button label="Skip prep" variant="ghost" onPress={() => persist(skipPrep)} />
          <Button label="Start debate" variant="gold" onPress={() => persist(startDebate)} />
        </ScreenScroll>
      </Screen>
    );
  }

  if (session.phase === 'debate') {
    const total =
      session.config.debateSeconds +
      (session.debateExtended ? session.config.debateExtensionSeconds : 0);
    const secondsLeft = session.phaseEndsAt
      ? Math.max(0, Math.ceil((session.phaseEndsAt - nowMs) / 1000))
      : total;
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Header onHelp={() => setHelpOpen(true)} fallback="/debate" />
          <DebateStage
            topic={session.topic.text}
            secondsLeft={secondsLeft}
            totalSeconds={total}
            forPlayers={forPlayers}
            againstPlayers={againstPlayers}
            readyCount={session.readyToVote.length}
            playerCount={session.players.length}
            showReadyButton
            onReady={() => persist((current) => tapReadyToVote(current, current.players[0]!.id))}
            onStickerPlaceholder={() => undefined}
          />
          <Button
            label="Host: end debate"
            variant="secondary"
            onPress={() => persist(hostEndDebate)}
          />
          {!session.debateExtended ? (
            <Button label="Add 30 seconds" variant="ghost" onPress={() => persist(extendDebate)} />
          ) : null}
        </ScreenScroll>
        <DebateHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      </Screen>
    );
  }

  if (session.phase === 'voting' && currentVoter) {
    const candidates = session.players.filter((player) => player.id !== currentVoter.id);
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Text style={styles.passTitle}>Pass to {currentVoter.displayName}</Text>
          <Text style={styles.passHint}>Tap who convinced you most. Votes stay secret.</Text>
          {candidates.map((player) => (
            <Button
              key={player.id}
              label={player.displayName}
              variant={votePick === player.id ? 'gold' : 'secondary'}
              onPress={() => setVotePick(player.id)}
            />
          ))}
          <Button
            label="Confirm vote"
            variant="primary"
            disabled={!votePick}
            onPress={() => {
              persist((current) => submitPassVote(current, currentVoter.id, votePick!));
              setVotePick(null);
            }}
          />
        </ScreenScroll>
      </Screen>
    );
  }

  if (session.phase === 'results' || session.status === 'finished') {
    const finished = session.results ? session : finalizeLocalSession(session);
    if (!session.results) persist(() => finished);
    return (
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Text style={typeScale.h1}>Results</Text>
          <Text style={styles.topic}>
            Winning side:{' '}
            {finished.results?.sideTie
              ? 'Tie'
              : finished.results?.winningSides.map((side) => side.toUpperCase()).join(' & ')}
          </Text>
          {session.players.map((player) => (
            <Text key={player.id} style={styles.rowText}>
              {player.displayName}: {finished.results?.playerTotals[player.id] ?? 0} votes · +
              {finished.scores[player.id]?.total ?? 0} pts
            </Text>
          ))}
          <Button
            label="Done"
            variant="gold"
            onPress={() => {
              awardIfNeeded(finished);
              router.replace('/home');
            }}
          />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text>Loading debate…</Text>
    </Screen>
  );
}

function Header({ onHelp, fallback }: { onHelp: () => void; fallback: string }) {
  return (
    <View style={styles.headerRow}>
      <BackButton label="Exit" fallback={fallback} />
      <Button label="?" variant="ghost" onPress={onHelp} />
    </View>
  );
}

function sideStyle(player: DebatePlayer) {
  return {
    backgroundColor: player.side === 'for' ? palette.coral : palette.teal,
  };
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topic: { ...typeScale.bodyM, color: palette.ink },
  topicDark: { color: palette.white, fontFamily: fontFamily.body, lineHeight: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fontFamily.bodySemi, color: palette.ink, flex: 1 },
  revealCard: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.xs },
  revealName: { color: palette.white, fontFamily: fontFamily.headingSemi, fontSize: 20 },
  revealSide: { color: palette.white, fontFamily: fontFamily.bodySemi },
  phaseTitle: { ...typeScale.h2, color: palette.white },
  passTitle: { ...typeScale.h2, color: palette.white },
  passHint: { color: palette.warmGray, fontFamily: fontFamily.body },
  rowText: { fontFamily: fontFamily.body, color: palette.ink },
});
