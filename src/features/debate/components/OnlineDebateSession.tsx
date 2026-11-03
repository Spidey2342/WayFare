import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pause, Play, Settings, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Screen, useToast } from '@/components/ui';
import {
  rpcChooseSide,
  rpcConfirmTopic,
  rpcDebateTouchSession,
  rpcCancelVerdict,
  rpcChangeVerdict,
  rpcDrawTopic,
  rpcEndSession,
  rpcGetSessionState,
  rpcMovePlayer,
  rpcNextRound,
  rpcPauseDebate,
  rpcPublishVerdict,
  rpcRequestVerdict,
  rpcResumeDebate,
  rpcSetSoftTimer,
  rpcShuffleTopic,
  rpcStartDebate,
  type DebateSessionSnapshot,
} from '@/features/debate/api';
import { debateErrorMessage, isWrongPhaseError } from '@/features/debate/debateErrors';
import type { SessionStateParticipant } from '@/features/debate/sessionState';
import { useDebateRulesChrome } from '@/features/debate/components/DebateRulesChrome';
import { ChangeVerdictSheet } from '@/features/debate/components/ChangeVerdictSheet';
import { DebateResultsView } from '@/features/debate/components/DebateResultsView';
import { DebateSoftTimerSheet } from '@/features/debate/components/DebateSoftTimerSheet';
import { LeaveGameSheet } from '@/features/debate/components/LeaveGameSheet';
import {
  DebateChoosingRow,
  DebateGoldButton,
  DebateJudgeBar,
  DebateKindnessQuote,
  DebateModeHeader,
  DebateMutedFooter,
  DebateEmptySideBanner,
  DebateOfflineBanner,
  DebateOutlineButton,
  DebatePlayerWait,
  DebatePresenceChip,
  DebateScreenBody,
  DebateSideBoard,
  DebateSupersededBanner,
  DebateTimerChip,
  DebateWaitingOthersRow,
  DebateTopicCard,
  DebateVerdictPicker,
  DebateWaitingDots,
  debateUi,
  formatDebateCategory,
  type DebateSidePlayer,
} from '@/features/debate/components/debateV2Ui';
import { balanceSummary } from '@/features/debate/engine/balanceSummary';
import { canStart } from '@/features/debate/engine/canStart';
import { formatElapsedChip, softTimerState } from '@/features/debate/engine/softTimerState';
import type { DebateSide } from '@/features/debate/types';
import { useAuth } from '@/features/auth/AuthContext';
import {
  presenceChipForParticipant,
  useDebateDeviceSuperseded,
} from '@/features/debate/hooks/useDebatePresence';
import { useTabVisibleClock } from '@/features/debate/hooks/useTabVisibleClock';
import { readOnline, subscribeOnline } from '@/services/network';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

type Props = { sessionId: string };

function mapSidePlayers(
  players: { id: string; displayName: string }[],
  roster: SessionStateParticipant[],
): DebateSidePlayer[] {
  const avatarById = new Map(roster.map((row) => [row.user_id, row.avatar_key]));
  return players.map((player) => ({
    id: player.id,
    displayName: player.displayName,
    avatarKey: avatarById.get(player.id) ?? null,
  }));
}

function toEnginePlayers(participants: SessionStateParticipant[]) {
  return participants.map((p) => ({
    id: p.user_id,
    displayName: p.display_name,
    side: p.side,
    role: p.role,
  }));
}

export function OnlineDebateSession({ sessionId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const rules = useDebateRulesChrome({ fallback: '/debate', showRulesOnMount: true });
  const [snapshot, setSnapshot] = useState<DebateSessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [verdictSide, setVerdictSide] = useState<'agree' | 'disagree' | 'draw' | null>(null);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState<string | null>(null);
  const [online, setOnline] = useState(() => readOnline());
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [softTimerOpen, setSoftTimerOpen] = useState(false);
  const lastJudgeRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const superseded = useDebateDeviceSuperseded(sessionId, user?.id);

  const reload = useCallback(async () => {
    if (!sessionId || !isSupabaseConfigured) return;
    setReconnecting(true);
    try {
      const snap = await rpcGetSessionState(sessionId);
      setSnapshot(snap);
      if (snap) {
        setServerOffsetMs(new Date(snap.server_now).getTime() - Date.now());
        if (snap.judge_id && lastJudgeRef.current && lastJudgeRef.current !== snap.judge_id) {
          const newJudge = snap.participants.find((p) => p.user_id === snap.judge_id);
          toast.show(`${newJudge?.display_name ?? 'Someone'} is now the judge.`);
        }
        if (snap.judge_id) lastJudgeRef.current = snap.judge_id;
      }
      setError(null);
    } catch (caught) {
      setError(debateErrorMessage(caught));
    } finally {
      setReconnecting(false);
    }
  }, [sessionId, toast]);

  const onResyncVisible = useCallback(() => {
    void reload();
  }, [reload]);
  const clockMs = useTabVisibleClock(onResyncVisible);

  useEffect(
    () =>
      subscribeOnline((next) => {
        setOnline(next);
        if (next) void reload();
      }),
    [reload],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session fetch
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured) return;
    const channel = requireSupabase()
      .channel(`debate-v2-${sessionId}`)
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debate_verdicts',
          filter: `session_id=eq.${sessionId}`,
        },
        () => void reload(),
      )
      .subscribe();
    const heartbeat = setInterval(() => {
      void rpcDebateTouchSession(sessionId).then(() => reload());
    }, 5000);
    return () => {
      clearInterval(heartbeat);
      void requireSupabase().removeChannel(channel);
    };
  }, [sessionId, reload]);

  const session = snapshot?.session ?? null;
  const participants = useMemo(() => snapshot?.participants ?? [], [snapshot?.participants]);
  const topic = snapshot?.topic?.text ?? '';
  const category = snapshot?.topic?.category ?? 'topic';
  const phase = snapshot?.phase ?? session?.phase ?? 'lobby';

  const isJudge = session?.judge_id === user?.id;
  const me = participants.find((player) => player.user_id === user?.id);
  const balance = useMemo(() => balanceSummary(toEnginePlayers(participants)), [participants]);
  const startCheck = canStart(
    phase === 'finished' ? 'results' : phase,
    toEnginePlayers(participants),
  );

  const nowMs = clockMs + serverOffsetMs;
  const pauseLiveMs =
    session?.paused_at && phase === 'debating'
      ? Math.max(0, nowMs - new Date(session.paused_at).getTime())
      : 0;
  const elapsedMs = session?.debate_started_at
    ? Math.max(
        0,
        nowMs -
          new Date(session.debate_started_at).getTime() -
          (session.total_paused_seconds ?? 0) * 1000 -
          pauseLiveMs,
      )
    : 0;
  const timer = softTimerState(
    session?.soft_timer_minutes === null || session?.soft_timer_minutes === undefined
      ? null
      : (session.soft_timer_minutes as 3 | 5 | 10),
    session?.debate_started_at ? new Date(session.debate_started_at).getTime() : null,
    nowMs,
  );
  const expectedPhase = phase === 'finished' ? 'results' : phase;

  const runLocked = async (fn: () => Promise<void>) => {
    if (inFlightRef.current) return;
    if (!online) {
      setError(debateErrorMessage('offline'));
      return;
    }
    inFlightRef.current = true;
    try {
      await fn();
      await reload();
    } catch (caught) {
      if (isWrongPhaseError(caught)) void reload();
      setError(debateErrorMessage(caught));
    } finally {
      inFlightRef.current = false;
    }
  };

  const headerTitle =
    phase === 'picking'
      ? isJudge
        ? 'CHOOSE SIDES'
        : 'CHOOSE YOUR SIDE'
      : phase === 'verdict'
        ? 'FINAL JUDGMENT'
        : 'DEBATE MODE';

  const exitDebate = () => setLeaveOpen(true);

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <Text style={typeScale.h2}>Online debate needs Supabase in .env</Text>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
        <Text style={{ color: palette.white }}>
          {reconnecting ? 'Loading…' : 'Session not found'}
        </Text>
      </Screen>
    );
  }

  if (phase === 'results' || phase === 'finished' || session.status === 'finished') {
    return (
      <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
        <ResultsPane
          snapshot={snapshot}
          sessionId={sessionId}
          userId={user?.id}
          onReload={reload}
          rules={rules}
        />
      </Screen>
    );
  }

  const agreePlayers = mapSidePlayers(balance.agree, participants);
  const disagreePlayers = mapSidePlayers(balance.disagree, participants);
  const choosingPlayers: DebateSidePlayer[] = participants
    .filter((player) => player.role === 'debater' && !player.side)
    .map((player) => ({
      id: player.user_id,
      displayName: player.display_name,
      avatarKey: player.avatar_key,
    }));
  const mvpPool = mapSidePlayers(balance.agree.concat(balance.disagree), participants);
  const judgeName = balance.judge?.displayName ?? 'Judge';
  const judgeIsMe = Boolean(balance.judge && session.judge_id === user?.id);
  const serverNowMs = clockMs + serverOffsetMs;
  const myPresence = me
    ? presenceChipForParticipant(me.presence, me.last_seen_at, serverNowMs, reconnecting)
    : null;
  const emptySideDuringDebate =
    phase === 'debating' &&
    isJudge &&
    (balance.agree.length === 0 || balance.disagree.length === 0);
  const waitingOthersPick: DebateSidePlayer[] = participants
    .filter((player) => player.role === 'debater' && !player.side && player.user_id !== user?.id)
    .map((player) => ({
      id: player.user_id,
      displayName: player.display_name,
      avatarKey: player.avatar_key,
    }));

  return (
    <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <DebateModeHeader title={headerTitle} onBack={exitDebate} onInfo={rules.openRulesLink} />
        {!online ? <DebateOfflineBanner /> : null}
        {superseded ? <DebateSupersededBanner /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {myPresence ? (
          <View style={styles.presenceStrip}>
            <DebatePresenceChip state={myPresence} />
          </View>
        ) : null}

        <DebateScreenBody>
          {(phase === 'lobby' || phase === 'topic') && (
            <>
              {topic ? (
                <>
                  <DebateTopicCard category={formatDebateCategory(category)} text={topic} />
                  <DebateKindnessQuote />
                </>
              ) : null}
              {isJudge ? (
                <>
                  {!topic ? (
                    <DebateGoldButton
                      label="DRAW TOPIC"
                      onPress={() =>
                        void runLocked(async () => {
                          await rpcDrawTopic(sessionId, expectedPhase);
                        })
                      }
                    />
                  ) : (
                    <>
                      <DebateGoldButton
                        label="USE THIS TOPIC"
                        onPress={() =>
                          void runLocked(() => rpcConfirmTopic(sessionId, expectedPhase))
                        }
                      />
                      <DebateOutlineButton
                        label="SHUFFLE TOPIC"
                        icon="shuffle"
                        onPress={() =>
                          void runLocked(async () => {
                            await rpcShuffleTopic(sessionId, expectedPhase);
                          })
                        }
                      />
                    </>
                  )}
                </>
              ) : (
                <DebateWaitingDots label="LEADER IS CHOOSING A TOPIC..." />
              )}
            </>
          )}

          {phase === 'picking' && (
            <>
              <DebateTopicCard text={topic} compact />
              <DebateSideBoard
                agree={agreePlayers}
                disagree={disagreePlayers}
                selectedSide={me?.side ?? null}
                onPickSide={(side) =>
                  void runLocked(() => rpcChooseSide(sessionId, side, expectedPhase))
                }
                readOnly={isJudge || me?.role !== 'debater'}
              />
              {balance.judge ? (
                <DebateJudgeBar
                  name={judgeIsMe ? `${judgeName} (You)` : judgeName}
                  highlight={judgeIsMe}
                  hostBadge={!judgeIsMe}
                />
              ) : null}
              <DebateChoosingRow
                players={choosingPlayers}
                onSelectPlayer={isJudge ? (id) => setAssignUserId(id) : undefined}
              />
              {isJudge && assignUserId ? (
                <View style={styles.assignRow}>
                  <DebateMutedFooter>Assign side</DebateMutedFooter>
                  <View style={styles.assignButtons}>
                    {(['agree', 'disagree'] as const).map((side) => (
                      <Pressable
                        key={side}
                        onPress={() =>
                          void runLocked(async () => {
                            await rpcMovePlayer(sessionId, assignUserId, side, expectedPhase);
                            setAssignUserId(null);
                          })
                        }
                        style={styles.assignBtn}
                      >
                        <Text style={styles.assignBtnText}>{side.toUpperCase()}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
              {!startCheck.ok && isJudge ? (
                <DebateMutedFooter>Waiting for at least 1 player on each side</DebateMutedFooter>
              ) : null}
              {!isJudge ? <DebateWaitingOthersRow players={waitingOthersPick} /> : null}
              {isJudge ? (
                <DebateGoldButton
                  label="START DEBATE"
                  disabled={!startCheck.ok || !online || superseded}
                  onPress={() => void runLocked(() => rpcStartDebate(sessionId, expectedPhase))}
                />
              ) : (
                <DebateMutedFooter>WAITING FOR LEADER TO START</DebateMutedFooter>
              )}
            </>
          )}

          {phase === 'debating' && (
            <>
              {isJudge ? (
                <View style={styles.debateTopBar}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      void runLocked(async () => {
                        if (session.paused_at) await rpcResumeDebate(sessionId, expectedPhase);
                        else await rpcPauseDebate(sessionId, expectedPhase);
                      })
                    }
                    style={styles.iconBtn}
                  >
                    {session.paused_at ? (
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
              ) : (
                <View style={styles.debateTopBarPlayer}>
                  <DebateTimerChip label={formatElapsedChip(elapsedMs)} />
                </View>
              )}
              <DebateTopicCard text={topic} />
              <DebateSideBoard agree={agreePlayers} disagree={disagreePlayers} readOnly />
              {emptySideDuringDebate ? <DebateEmptySideBanner /> : null}
              {timer.kind === 'nudge' ? (
                <Text style={styles.nudge}>Time&apos;s up. Keep going or wrap up?</Text>
              ) : null}
              {isJudge ? (
                <DebateGoldButton
                  label="READY FOR VERDICT"
                  disabled={!online || superseded}
                  onPress={() => void runLocked(() => rpcRequestVerdict(sessionId, expectedPhase))}
                />
              ) : null}
            </>
          )}

          {phase === 'verdict' && isJudge && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel verdict"
                onPress={() => void runLocked(() => rpcCancelVerdict(sessionId, expectedPhase))}
                style={styles.cancelVerdict}
              >
                <X color={debateUi.muted} size={22} />
              </Pressable>
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
                  void runLocked(async () => {
                    await rpcPublishVerdict(sessionId, verdictSide, mvpId, expectedPhase);
                  });
                }}
              />
            </>
          )}

          {phase === 'verdict' && !isJudge && (
            <>
              <DebateTopicCard text={topic} compact />
              <DebatePlayerWait
                title="The leader is deciding..."
                body="Great arguments everyone! Let's see who took the crown this round."
                judgeName={judgeName}
              />
            </>
          )}
        </DebateScreenBody>
      </ScrollView>
      <LeaveGameSheet
        visible={leaveOpen}
        onStay={() => setLeaveOpen(false)}
        onLeave={() => {
          setLeaveOpen(false);
          router.replace('/debate');
        }}
      />
      <DebateSoftTimerSheet
        visible={softTimerOpen}
        selected={
          session.soft_timer_minutes === 3 ||
          session.soft_timer_minutes === 5 ||
          session.soft_timer_minutes === 10
            ? session.soft_timer_minutes
            : null
        }
        onClose={() => setSoftTimerOpen(false)}
        onSelect={(minutes) =>
          void runLocked(() => rpcSetSoftTimer(sessionId, minutes, expectedPhase))
        }
      />
      {rules.sheet}
    </Screen>
  );
}

function ResultsPane({
  snapshot,
  sessionId,
  userId,
  onReload,
  rules,
}: {
  snapshot: DebateSessionSnapshot | null;
  sessionId: string;
  userId: string | undefined;
  onReload: () => Promise<void>;
  rules: ReturnType<typeof useDebateRulesChrome>;
}) {
  const router = useRouter();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeSide, setChangeSide] = useState<'agree' | 'disagree' | 'draw' | null>(null);
  const [changeMvp, setChangeMvp] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const poll = setInterval(() => void onReload(), 5000);
    return () => clearInterval(poll);
  }, [onReload]);

  const results = snapshot?.results;
  const participants = snapshot?.participants ?? [];
  const session = snapshot?.session;
  if (!results || !session) return <Text style={styles.loading}>Loading results…</Text>;

  const winningSide: DebateSide | null =
    results.winning_side === 'agree'
      ? 'agree'
      : results.winning_side === 'disagree'
        ? 'disagree'
        : null;
  const mappedPlayers = participants.map((player) => ({
    id: player.user_id,
    displayName: player.display_name,
    side: player.side,
    avatarKey: player.avatar_key ?? undefined,
  }));
  const playerTotals = results.player_totals ?? {};
  const scores = Object.fromEntries(
    Object.entries(playerTotals).map(([id, total]) => {
      const n = Number(total);
      return [
        id,
        {
          playerId: id,
          participation: 1,
          sideWin: Math.max(0, n - 1),
          mvp: 0,
          total: n,
        },
      ];
    }),
  );
  const isJudge = session.judge_id === userId;
  const me = participants.find((player) => player.user_id === userId);
  const audience = isJudge
    ? 'leader'
    : me?.role === 'spectator'
      ? 'spectator'
      : ('player' as const);
  const announcedAt = session.verdict_announced_at
    ? new Date(session.verdict_announced_at).getTime()
    : null;
  const changeWindowOpen = isJudge && announcedAt !== null && nowMs < announcedAt + 30_000;
  const xpFinalized = Boolean(snapshot?.verdict?.xp_awarded_at ?? session.xp_awarded);
  const viewerScore = userId ? scores[userId] : undefined;
  const mvpPool = participants
    .filter((player) => player.role === 'debater')
    .map((player) => ({
      id: player.user_id,
      displayName: player.display_name,
      avatarKey: player.avatar_key,
    }));
  const groupId = session.group_id;
  const lobbyHref = groupId ? `/groups/${groupId}` : '/groups';

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <DebateModeHeader title="RESULTS" onInfo={rules.openRulesLink} />
      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
      <DebateResultsView
        variant="v2"
        dark
        resultsAudience={audience}
        viewerScore={viewerScore}
        showChangeVerdict={changeWindowOpen}
        onChangeVerdict={() => setChangeOpen(true)}
        xpEarned={xpFinalized ? (viewerScore?.total ?? 0) : 0}
        results={{
          winningSides: results.tie || !winningSide ? [] : [winningSide],
          sideTie: results.tie,
          sideTotals: {
            agree: results.side_totals?.agree ?? 0,
            disagree: results.side_totals?.disagree ?? 0,
          },
          playerTotals: results.player_totals ?? {},
          mvpIds: results.mvp_ids ?? [],
          mvpTie: (results.mvp_ids?.length ?? 0) !== 1,
        }}
        players={mappedPlayers}
        scores={scores}
        onPlayAgain={
          isJudge
            ? () => {
                setActionError(null);
                void rpcNextRound(sessionId, 'results')
                  .then(() => onReload())
                  .catch((caught) => setActionError(debateErrorMessage(caught)));
              }
            : undefined
        }
        onBack={() => {
          setActionError(null);
          if (isJudge) {
            void rpcEndSession(sessionId, 'results')
              .then(() => router.replace(lobbyHref as never))
              .catch((caught) => setActionError(debateErrorMessage(caught)));
          } else {
            router.replace(lobbyHref as never);
          }
        }}
        backLabel="BACK TO GROUP"
      />
      <ChangeVerdictSheet
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        mvpPlayers={mvpPool}
        selected={changeSide}
        mvpId={changeMvp}
        onSelect={setChangeSide}
        onMvp={setChangeMvp}
        submitting={changing}
        onSubmit={() => {
          if (!changeSide) return;
          setChanging(true);
          void rpcChangeVerdict(sessionId, changeSide, changeMvp, 'results')
            .then(() => {
              setChangeOpen(false);
              return onReload();
            })
            .catch((caught) => setActionError(debateErrorMessage(caught)))
            .finally(() => setChanging(false));
        }}
      />
      {rules.sheet}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 48 },
  error: { color: palette.coral, fontFamily: fontFamily.body, marginBottom: spacing.sm },
  nudge: { fontFamily: fontFamily.body, color: palette.gold, textAlign: 'center' },
  loading: { fontFamily: fontFamily.body, color: palette.white, padding: spacing.lg },
  debateTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debateTopBarPlayer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  assignRow: { gap: spacing.sm },
  assignButtons: { flexDirection: 'row', gap: spacing.sm },
  assignBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  assignBtnText: { fontFamily: fontFamily.bodySemi, color: palette.white },
  cancelVerdict: { alignSelf: 'flex-start', padding: spacing.sm },
  presenceStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
});
