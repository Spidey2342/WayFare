import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Screen, ScreenScroll } from '@/components/ui';
import { DebatePrepPanel } from '@/features/debate/components/DebatePrepPanel';
import { DebateResultsView } from '@/features/debate/components/DebateResultsView';
import { useDebateRulesChrome } from '@/features/debate/components/DebateRulesChrome';
import { DebateStage } from '@/features/debate/components/DebateStage';
import { DebateVoteGrid } from '@/features/debate/components/DebateVoteGrid';
import { PassToPlayerScreen } from '@/features/debate/components/PassToPlayerScreen';
import { SideRevealCard } from '@/features/debate/components/SideRevealCard';
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
import type { LocalDebateSession } from '@/features/debate/types';
import { useAppStore } from '@/store';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

export default function PassDebateSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const [session, setSession] = useState<LocalDebateSession | undefined>(() =>
    loadLocalDebate(sessionId),
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [readyIds, setReadyIds] = useState<string[]>([]);
  const [votePick, setVotePick] = useState<string | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [prepIndex, setPrepIndex] = useState(0);
  const [confirmedVoterId, setConfirmedVoterId] = useState<string | null>(null);
  const applyDebate = useAppStore((state) => state.applyDebateAward);
  const rules = useDebateRulesChrome({ fallback: '/debate/pass/setup', showRulesOnMount: true });

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
          {rules.header}
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
        {rules.sheet}
      </Screen>
    );
  }

  if (session.phase === 'side_reveal') {
    const player = session.players[revealIndex];
    const side = player?.side;
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          {rules.header}
          {player && side ? <SideRevealCard side={side} playerName={player.displayName} /> : null}
          {revealIndex < session.players.length - 1 ? (
            <Button
              label="Next player"
              variant="gold"
              onPress={() => setRevealIndex((index) => index + 1)}
            />
          ) : (
            <Button label="Start prep" variant="gold" onPress={() => persist(startPrep)} />
          )}
        </ScreenScroll>
        {rules.sheet}
      </Screen>
    );
  }

  if (session.phase === 'prep') {
    const prepPlayer = session.players[prepIndex];
    const side = prepPlayer?.side;
    const secondsLeft = session.phaseEndsAt
      ? Math.max(0, Math.ceil((session.phaseEndsAt - nowMs) / 1000))
      : session.config.prepSeconds;
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          {rules.header}
          {prepPlayer && side ? (
            <DebatePrepPanel
              topic={session.topic.text}
              side={side}
              secondsLeft={secondsLeft}
              totalSeconds={session.config.prepSeconds}
            />
          ) : null}
          {prepIndex < session.players.length - 1 ? (
            <Button
              label={`Pass to ${session.players[prepIndex + 1]?.displayName ?? 'next'}`}
              variant="secondary"
              onPress={() => setPrepIndex((index) => index + 1)}
            />
          ) : null}
          <Button label="Skip prep" variant="ghost" onPress={() => persist(skipPrep)} />
          <Button label="Start debate" variant="gold" onPress={() => persist(startDebate)} />
        </ScreenScroll>
        {rules.sheet}
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
          {rules.header}
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
        {rules.sheet}
      </Screen>
    );
  }

  if (session.phase === 'voting' && currentVoter) {
    const voterReady = confirmedVoterId === currentVoter.id;
    const candidates = session.players.filter((player) => player.id !== currentVoter.id);
    const secondsLeft = session.phaseEndsAt
      ? Math.max(0, Math.ceil((session.phaseEndsAt - nowMs) / 1000))
      : session.config.votingSeconds;
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          {!voterReady ? (
            <PassToPlayerScreen
              playerName={currentVoter.displayName}
              avatarKey={currentVoter.avatarKey}
              onConfirm={() => setConfirmedVoterId(currentVoter.id)}
            />
          ) : (
            <>
              {rules.header}
              <DebateVoteGrid
                secondsLeft={secondsLeft}
                totalSeconds={session.config.votingSeconds}
                candidates={candidates}
                selectedId={votePick}
                onSelect={setVotePick}
                onSubmit={() => {
                  persist((current) => submitPassVote(current, currentVoter.id, votePick!));
                  setVotePick(null);
                  setConfirmedVoterId(null);
                }}
              />
            </>
          )}
        </ScreenScroll>
        {rules.sheet}
      </Screen>
    );
  }

  if (session.phase === 'results' || session.status === 'finished') {
    const finished = session.results ? session : finalizeLocalSession(session);
    if (!session.results) persist(() => finished);
    const xpGained = Object.values(finished.scores).reduce(
      (sum, line) => sum + (line?.total ?? 0),
      0,
    );
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          {finished.results ? (
            <DebateResultsView
              dark
              results={finished.results}
              players={session.players}
              scores={finished.scores}
              xpEarned={Math.max(1, xpGained)}
              onBack={() => {
                awardIfNeeded(finished);
                router.replace('/home');
              }}
            />
          ) : null}
        </ScreenScroll>
        {rules.sheet}
      </Screen>
    );
  }

  return (
    <Screen>
      <Text>Loading debate…</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  topic: { ...typeScale.bodyM, color: palette.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fontFamily.bodySemi, color: palette.ink, flex: 1 },
});
