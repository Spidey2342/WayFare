import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pause, Play, Settings } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { DebateResultsView } from '@/features/debate/components/DebateResultsView';
import { useDebateRulesChrome } from '@/features/debate/components/DebateRulesChrome';
import { DebateSoftTimerSheet } from '@/features/debate/components/DebateSoftTimerSheet';
import { LeaveGameSheet } from '@/features/debate/components/LeaveGameSheet';
import { PassJudgeSheet } from '@/features/debate/components/PassJudgeSheet';
import {
  DebateGoldButton,
  DebateKindnessQuote,
  DebateModeHeader,
  DebateOutlineButton,
  DebateSideBoard,
  DebateTimerChip,
  DebateTopicCard,
  DebateVerdictPicker,
  debateUi,
  formatDebateCategory,
  type DebateSidePlayer,
} from '@/features/debate/components/debateV2Ui';
import { PassReadyScreen } from '@/features/debate/components/PassReadyScreen';
import { PassSidePickScreen } from '@/features/debate/components/PassSidePickScreen';
import { PassToPlayerScreen } from '@/features/debate/components/PassToPlayerScreen';
import { balanceSummary } from '@/features/debate/engine/balanceSummary';
import { formatElapsedChip, softTimerState } from '@/features/debate/engine/softTimerState';
import {
  beginPassDebateFromReady,
  bundledDebateTopics,
  confirmPassHandoff,
  confirmPassTopic,
  currentPassPicker,
  hostEndDebate,
  passElapsedMs,
  passPauseDebate,
  passResumeDebate,
  passSetSoftTimer,
  passTransferJudge,
  pickPassSide,
  passCanStartDebate,
  publishPassVerdict,
  shufflePassTopic,
  tickSession,
  topicById,
} from '@/features/debate/localSession';
import { loadLocalDebate, updateLocalDebate } from '@/features/debate/localStore';
import { awardPassDebateSignedIn } from '@/features/debate/outbox';
import type { DebateSide, LocalDebateSession } from '@/features/debate/types';
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
  const [verdictSide, setVerdictSide] = useState<'agree' | 'disagree' | 'draw' | null>(null);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [judgeSheetOpen, setJudgeSheetOpen] = useState(false);
  const [softTimerOpen, setSoftTimerOpen] = useState(false);
  const awardedRef = useRef(false);
  const { user, isGuest } = useAuth();
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

  const debaters = useMemo(
    () => session?.players.filter((player) => player.id !== session.hostId) ?? [],
    [session],
  );

  const awardIfNeeded = (finishedSession: LocalDebateSession) => {
    if (awardedRef.current) return;
    awardedRef.current = true;
    const you = finishedSession.players[0];
    const xpGained = you ? (finishedSession.scores[you.id]?.total ?? 0) : 0;
    const clientId = `${finishedSession.id}:pass`;
    if (isGuest || !user) {
      applyDebate({
        sessionId: finishedSession.id,
        xpGained: Math.max(0, xpGained),
        votedThisRound: false,
        wasMvp: finishedSession.results?.mvpIds.includes(you?.id ?? '') ?? false,
      });
      return;
    }
    void awardPassDebateSignedIn(clientId, Math.max(0, xpGained));
  };

  if (!session) {
    return (
      <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
        <Text style={[typeScale.h2, { color: palette.white }]}>Session not found</Text>
        <DebateGoldButton label="BACK" onPress={() => router.replace('/debate/pass/setup')} />
      </Screen>
    );
  }

  const shell = (children: ReactNode, headerTitle = 'SAME PHONE') => (
    <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <DebateModeHeader
          title={headerTitle}
          onBack={() => setLeaveOpen(true)}
          onInfo={rules.openRulesLink}
        />
        {children}
      </ScrollView>
      <LeaveGameSheet
        visible={leaveOpen}
        onStay={() => setLeaveOpen(false)}
        onLeave={() => {
          setLeaveOpen(false);
          router.replace('/debate');
        }}
      />
      <PassJudgeSheet
        visible={judgeSheetOpen}
        players={session?.players ?? []}
        currentJudgeId={session?.hostId ?? ''}
        onClose={() => setJudgeSheetOpen(false)}
        onSelect={(playerId) => {
          persist((current) => passTransferJudge(current, playerId));
          setJudgeSheetOpen(false);
        }}
      />
      {rules.sheet}
    </Screen>
  );

  if (session.phase === 'topic') {
    const topics = bundledDebateTopics();
    return shell(
      <>
        <DebateModeHeader title="DEBATE MODE" onInfo={rules.openRulesLink} />
        <DebateTopicCard
          category={formatDebateCategory(session.topic.category)}
          text={session.topic.text}
        />
        <DebateKindnessQuote />
        <DebateGoldButton label="USE THIS TOPIC" onPress={() => persist(confirmPassTopic)} />
        <DebateOutlineButton
          label="SHUFFLE TOPIC"
          icon="shuffle"
          onPress={() => {
            const pool = topics.filter((item) => item.id !== session.topic.id);
            const next = pool[Math.floor(Math.random() * pool.length)] ?? topics[0]!;
            persist((current) => shufflePassTopic(current, topicById(next.id) ?? next));
          }}
        />
      </>,
    );
  }

  if (session.phase === 'picking') {
    const pass = session.pass;
    if (pass?.allSidesPicked) {
      return shell(
        <PassReadyScreen
          topic={session.topic.text}
          players={session.players}
          judgeId={session.hostId}
          canStart={passCanStartDebate(session)}
          onStart={() => persist(beginPassDebateFromReady)}
        />,
      );
    }

    const picker = currentPassPicker(session);
    if (!picker || !pass) {
      return shell(<Text style={styles.error}>No debaters to pick sides.</Text>);
    }

    if (!pass.handoffConfirmed) {
      return shell(
        <PassToPlayerScreen
          playerName={picker.displayName}
          avatarKey={picker.avatarKey}
          onConfirm={() => persist(confirmPassHandoff)}
        />,
      );
    }

    return shell(
      <PassSidePickScreen
        topic={session.topic.text}
        playerName={picker.displayName}
        onPick={(side: DebateSide) => persist((current) => pickPassSide(current, picker.id, side))}
      />,
    );
  }

  if (session.phase === 'debate') {
    const roster = session.players.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      side: player.side,
      role: (player.id === session.hostId ? 'judge' : 'debater') as 'judge' | 'debater',
    }));
    const balance = balanceSummary(roster);
    const mapSide = (list: { id: string; displayName: string }[]): DebateSidePlayer[] =>
      list.map((player) => ({
        id: player.id,
        displayName: player.displayName,
        avatarKey: session.players.find((p) => p.id === player.id)?.avatarKey ?? null,
      }));
    const elapsedMs = passElapsedMs(session, nowMs);
    const clock = session.localClock;
    const timer = softTimerState(
      clock?.softTimerMinutes === null || clock?.softTimerMinutes === undefined
        ? null
        : (clock.softTimerMinutes as 3 | 5 | 10),
      clock?.debateStartedAt ?? null,
      nowMs,
    );
    const showNudge = timer.kind === 'nudge' && !clock?.nudgeShown;
    return shell(
      <>
        <View style={styles.debateTopBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              persist((current) =>
                current.localClock?.pausedAt ? passResumeDebate(current) : passPauseDebate(current),
              )
            }
            style={styles.iconBtn}
          >
            {clock?.pausedAt ? (
              <Play color={debateUi.muted} size={20} />
            ) : (
              <Pause color={debateUi.muted} size={20} />
            )}
          </Pressable>
          <DebateTimerChip label={formatElapsedChip(elapsedMs)} />
          <Pressable
            accessibilityRole="button"
            onPress={() => setSoftTimerOpen(true)}
            style={styles.iconBtn}
          >
            <Settings color={debateUi.muted} size={20} />
          </Pressable>
        </View>
        <DebateOutlineButton label="PASS JUDGE ROLE" onPress={() => setJudgeSheetOpen(true)} />
        <DebateTopicCard
          category={formatDebateCategory(session.topic.category)}
          text={session.topic.text}
        />
        <DebateSideBoard
          agree={mapSide(balance.agree)}
          disagree={mapSide(balance.disagree)}
          readOnly
        />
        {showNudge ? (
          <Text style={styles.nudge}>Time&apos;s up. Keep going or wrap up?</Text>
        ) : null}
        <DebateGoldButton label="READY FOR VERDICT" onPress={() => persist(hostEndDebate)} />
        <DebateSoftTimerSheet
          visible={softTimerOpen}
          selected={
            clock?.softTimerMinutes === 3 ||
            clock?.softTimerMinutes === 5 ||
            clock?.softTimerMinutes === 10
              ? clock.softTimerMinutes
              : null
          }
          onClose={() => setSoftTimerOpen(false)}
          onSelect={(minutes) => persist((current) => passSetSoftTimer(current, minutes))}
        />
      </>,
      'DEBATE MODE',
    );
  }

  if (session.phase === 'verdict') {
    const mvpPool = debaters.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      avatarKey: player.avatarKey ?? null,
    }));
    return shell(
      <>
        <DebateVerdictPicker
          selected={verdictSide}
          onSelect={setVerdictSide}
          mvpPlayers={mvpPool}
          mvpId={mvpId}
          onMvp={setMvpId}
        />
        <DebateGoldButton
          label="ANNOUNCE WINNER"
          disabled={!verdictSide}
          onPress={() => {
            if (!verdictSide) return;
            persist((current) => publishPassVerdict(current, verdictSide, mvpId));
          }}
        />
      </>,
    );
  }

  if (session.phase === 'results' || session.status === 'finished') {
    const xpGained = Object.values(session.scores).reduce(
      (sum, line) => sum + (line?.total ?? 0),
      0,
    );
    return shell(
      session.results ? (
        <DebateResultsView
          variant="v2"
          dark
          results={session.results}
          players={session.players}
          scores={session.scores}
          xpEarned={Math.max(1, xpGained)}
          onPlayAgain={() => router.replace('/debate/pass/setup')}
          onBack={() => {
            awardIfNeeded(session);
            router.replace('/debate');
          }}
          backLabel="BACK TO DEBATE"
        />
      ) : (
        <Text style={styles.error}>Results missing.</Text>
      ),
    );
  }

  return shell(<Text style={styles.error}>Unknown phase: {session.phase}</Text>);
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 48, gap: spacing.md },
  error: { fontFamily: fontFamily.body, color: palette.coral, textAlign: 'center' },
  debateTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  nudge: { fontFamily: fontFamily.body, color: palette.gold, textAlign: 'center' },
});
