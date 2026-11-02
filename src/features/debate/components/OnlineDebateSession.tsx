import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, useToast } from '@/components/ui';
import {
  fetchDebateSession,
  fetchDebateResults,
  fetchDebateTopicText,
  fetchSessionPlayers,
  rpcChooseSide,
  rpcConfirmTopic,
  rpcDebateTouchSession,
  rpcDrawTopic,
  rpcPublishVerdict,
  rpcRequestVerdict,
  rpcServerNow,
  rpcSetSoftTimer,
  rpcShuffleTopic,
  rpcStartDebate,
  type OnlineDebateSessionRow,
  type OnlineSessionPlayerRow,
} from '@/features/debate/api';
import { useDebateRulesChrome } from '@/features/debate/components/DebateRulesChrome';
import { DebateResultsView } from '@/features/debate/components/DebateResultsView';
import { balanceSummary } from '@/features/debate/engine/balanceSummary';
import { canStart } from '@/features/debate/engine/canStart';
import { formatElapsedChip, softTimerState } from '@/features/debate/engine/softTimerState';
import { scoreDebate } from '@/features/debate/engine/scoreDebate';
import { bundledDebateTopics } from '@/features/debate/localSession';
import type { DebateSide } from '@/features/debate/types';
import { useAuth } from '@/features/auth/AuthContext';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

type Props = { sessionId: string };

export function OnlineDebateSession({ sessionId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const rules = useDebateRulesChrome({ fallback: '/debate', showRulesOnMount: true });
  const [session, setSession] = useState<OnlineDebateSessionRow | null>(null);
  const [players, setPlayers] = useState<OnlineSessionPlayerRow[]>([]);
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [verdictSide, setVerdictSide] = useState<'agree' | 'disagree' | 'draw' | null>(null);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const lastJudgeRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const reload = useCallback(async () => {
    if (!sessionId || !isSupabaseConfigured) return;
    setReconnecting(true);
    try {
      const row = await fetchDebateSession(sessionId);
      const roster = await fetchSessionPlayers(sessionId);
      setSession(row);
      setPlayers(roster);
      if (row?.judge_id && lastJudgeRef.current && lastJudgeRef.current !== row.judge_id) {
        toast.show('The judge role was reassigned.');
      }
      if (row?.judge_id) lastJudgeRef.current = row.judge_id;
      if (row?.topic_id) {
        const bundled = bundledDebateTopics().find((item) => item.id === row.topic_id);
        const remote = await fetchDebateTopicText(row.topic_id);
        setTopic(remote ?? bundled?.text ?? '');
        setCategory(bundled?.category?.toUpperCase() ?? 'TOPIC');
      }
      setError(null);
    } catch {
      setError('Reconnecting…');
    } finally {
      setReconnecting(false);
    }
  }, [sessionId, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session fetch
    void reload();
    void rpcServerNow().then((iso) => {
      setServerOffsetMs(new Date(iso).getTime() - Date.now());
    });
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
    }, 8000);
    const clock = setInterval(() => setClockMs(Date.now()), 1000);
    return () => {
      clearInterval(heartbeat);
      clearInterval(clock);
      void requireSupabase().removeChannel(channel);
    };
  }, [sessionId, reload]);

  const isJudge = session?.judge_id === user?.id;
  const me = players.find((player) => player.user_id === user?.id);
  const balance = useMemo(
    () =>
      balanceSummary(
        players.map((p) => ({
          id: p.user_id,
          displayName: p.display_name,
          side: p.side,
          role: p.role,
        })),
      ),
    [players],
  );
  const startCheck = canStart(
    session?.phase ?? '',
    players.map((p) => ({
      id: p.user_id,
      displayName: p.display_name,
      side: p.side,
      role: p.role,
    })),
  );

  const nowMs = clockMs + serverOffsetMs;
  const elapsedMs = session?.debate_started_at
    ? Math.max(0, nowMs - new Date(session.debate_started_at).getTime())
    : 0;
  const timer = softTimerState(
    session?.soft_timer_minutes === null || session?.soft_timer_minutes === undefined
      ? null
      : (session.soft_timer_minutes as 3 | 5 | 10),
    session?.debate_started_at ? new Date(session.debate_started_at).getTime() : null,
    nowMs,
  );

  const runLocked = async (fn: () => Promise<void>) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      await fn();
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.');
    } finally {
      inFlightRef.current = false;
    }
  };

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
          {reconnecting ? 'Loading…' : 'Session not found'}
        </Text>
      </Screen>
    );
  }

  if (session.phase === 'results' || session.status === 'finished') {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ResultsPane sessionId={sessionId} onBack={() => router.replace('/groups')} rules={rules} />
      </Screen>
    );
  }

  const dark = session.phase !== 'lobby';

  return (
    <Screen
      background={dark ? palette.midnight : palette.offWhite}
      gutter={dark ? palette.midnight : palette.offWhite}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {rules.header}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {(session.phase === 'lobby' || session.phase === 'topic') && (
          <View style={styles.block}>
            <Text style={[styles.eyebrow, dark && styles.eyebrowDark]}>DEBATE MODE</Text>
            {topic ? (
              <>
                <Text style={[styles.category, dark && styles.categoryDark]}>
                  CATEGORY: {category}
                </Text>
                <View style={[styles.topicCard, dark && styles.topicCardDark]}>
                  <Text style={[styles.topicText, dark && styles.topicTextDark]}>{topic}</Text>
                </View>
                <Text style={styles.kindness}>
                  Be sharp, be kind. The best arguments are built on grace and logic.
                </Text>
              </>
            ) : null}
            {isJudge ? (
              <>
                {!topic ? (
                  <Button
                    label="Draw topic"
                    variant="gold"
                    onPress={() =>
                      void runLocked(async () => {
                        await rpcDrawTopic(sessionId);
                      })
                    }
                  />
                ) : (
                  <>
                    <Button
                      label="USE THIS TOPIC"
                      variant="gold"
                      onPress={() => void runLocked(() => rpcConfirmTopic(sessionId))}
                    />
                    <Button
                      label="SHUFFLE TOPIC"
                      variant="secondary"
                      onPress={() =>
                        void runLocked(async () => {
                          await rpcShuffleTopic(sessionId);
                        })
                      }
                    />
                  </>
                )}
              </>
            ) : (
              <Text style={styles.waitGold}>LEADER IS CHOOSING A TOPIC...</Text>
            )}
          </View>
        )}

        {session.phase === 'picking' && (
          <View style={styles.block}>
            <Text style={[styles.eyebrow, styles.eyebrowDark]}>
              {isJudge ? 'CHOOSE SIDES' : 'CHOOSE YOUR SIDE'}
            </Text>
            <View style={[styles.topicCard, styles.topicCardDark]}>
              <Text style={styles.topicTextDark}>{topic}</Text>
            </View>
            <View style={styles.sideRow}>
              <SideColumn
                label="AGREE"
                tint={palette.coral}
                count={balance.agree.length}
                players={balance.agree}
                selected={me?.side === 'agree'}
                onPick={
                  !isJudge && me?.role === 'debater'
                    ? () => void runLocked(() => rpcChooseSide(sessionId, 'agree'))
                    : undefined
                }
              />
              <SideColumn
                label="DISAGREE"
                tint={palette.teal}
                count={balance.disagree.length}
                players={balance.disagree}
                selected={me?.side === 'disagree'}
                onPick={
                  !isJudge && me?.role === 'debater'
                    ? () => void runLocked(() => rpcChooseSide(sessionId, 'disagree'))
                    : undefined
                }
              />
            </View>
            {balance.judge ? (
              <View style={styles.judgeCard}>
                <Text style={styles.judgeBadge}>THE JUDGE</Text>
                <Text style={styles.judgeName}>{balance.judge.displayName}</Text>
              </View>
            ) : null}
            {!startCheck.ok && isJudge ? (
              <Text style={styles.wait}>Waiting for at least 1 player on each side</Text>
            ) : null}
            {isJudge ? (
              <Button
                label="START DEBATE"
                variant="gold"
                disabled={!startCheck.ok}
                onPress={() => void runLocked(() => rpcStartDebate(sessionId))}
              />
            ) : (
              <Text style={styles.wait}>WAITING FOR LEADER TO START</Text>
            )}
          </View>
        )}

        {session.phase === 'debating' && (
          <View style={styles.block}>
            <View style={styles.timerChip}>
              <Text style={styles.timerText}>{formatElapsedChip(elapsedMs)}</Text>
            </View>
            <Text style={styles.eyebrowDark}>CURRENT TOPIC</Text>
            <View style={[styles.topicCard, styles.topicCardDark]}>
              <Text style={styles.topicTextDark}>{topic}</Text>
            </View>
            <View style={styles.sideRow}>
              <SideColumn
                label="AGREE"
                tint={palette.coral}
                count={balance.agree.length}
                players={balance.agree}
              />
              <SideColumn
                label="DISAGREE"
                tint={palette.teal}
                count={balance.disagree.length}
                players={balance.disagree}
              />
            </View>
            {timer.kind === 'nudge' ? (
              <Text style={styles.nudge}>Time&apos;s up. Keep going or wrap up?</Text>
            ) : null}
            {isJudge ? (
              <>
                <Button
                  label="READY FOR VERDICT"
                  variant="gold"
                  onPress={() => void runLocked(() => rpcRequestVerdict(sessionId))}
                />
                <View style={styles.timerPickRow}>
                  {[null, 3, 5, 10].map((minutes) => (
                    <Pressable
                      key={String(minutes)}
                      style={[
                        styles.timerPick,
                        session.soft_timer_minutes === minutes && styles.timerPickOn,
                      ]}
                      onPress={() => void runLocked(() => rpcSetSoftTimer(sessionId, minutes))}
                    >
                      <Text style={styles.timerPickLabel}>
                        {minutes === null ? 'No limit' : `${minutes} min`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.wait}>
                Discuss face to face. The leader will call the verdict when ready.
              </Text>
            )}
          </View>
        )}

        {session.phase === 'verdict' && isJudge && (
          <View style={styles.block}>
            <Text style={styles.eyebrowDark}>FINAL JUDGMENT</Text>
            <Text style={styles.verdictQ}>Who made the stronger case?</Text>
            <View style={styles.sideRow}>
              {(['agree', 'disagree'] as const).map((side) => (
                <Pressable
                  key={side}
                  style={[styles.verdictCard, verdictSide === side && styles.verdictCardOn]}
                  onPress={() => setVerdictSide(side)}
                >
                  <Text style={styles.verdictCardLabel}>
                    {side === 'agree' ? 'AGREE' : 'DISAGREE'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              label="= IT'S A DRAW"
              variant="secondary"
              onPress={() => setVerdictSide('draw')}
            />
            <Text style={styles.mvpLabel}>SELECT MVP (OPTIONAL)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mvpRow}
            >
              {balance.agree.concat(balance.disagree).map((player) => (
                <Pressable key={player.id} onPress={() => setMvpId(player.id)}>
                  <Text style={[styles.mvpName, mvpId === player.id && styles.mvpNameOn]}>
                    {player.displayName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              label="ANNOUNCE WINNER"
              variant="gold"
              disabled={!verdictSide}
              onPress={() => {
                if (!verdictSide) return;
                void runLocked(async () => {
                  await rpcPublishVerdict(sessionId, verdictSide, mvpId);
                });
              }}
            />
          </View>
        )}

        {session.phase === 'verdict' && !isJudge && (
          <View style={styles.block}>
            <Text style={styles.eyebrowDark}>DEBATE CONCLUDED</Text>
            <Text style={styles.waitTitle}>The leader is deciding...</Text>
            <Text style={styles.waitItalic}>
              Great arguments everyone! Let&apos;s see who took the crown this round.
            </Text>
            {balance.judge ? (
              <Text style={styles.wait}>JUDGE {balance.judge.displayName}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
      {rules.sheet}
    </Screen>
  );
}

function SideColumn({
  label,
  tint,
  count,
  players,
  selected,
  onPick,
}: {
  label: string;
  tint: string;
  count: number;
  players: { id: string; displayName: string }[];
  selected?: boolean;
  onPick?: () => void;
}) {
  return (
    <Pressable
      style={[styles.sideCol, { borderColor: tint }, selected && styles.sideColSelected]}
      onPress={onPick}
      disabled={!onPick}
    >
      <Text style={[styles.sideLabel, { color: tint }]}>{label}</Text>
      <Text style={styles.sideCount}>{count}</Text>
      {players.slice(0, 6).map((player) => (
        <Text key={player.id} style={styles.sidePlayer} numberOfLines={1}>
          {player.displayName}
        </Text>
      ))}
      {players.length > 6 ? <Text style={styles.showAll}>Show all ({players.length})</Text> : null}
      {selected ? <Text style={styles.selectedTag}>SELECTED</Text> : null}
    </Pressable>
  );
}

function ResultsPane({
  sessionId,
  onBack,
  rules,
}: {
  sessionId: string;
  onBack: () => void;
  rules: ReturnType<typeof useDebateRulesChrome>;
}) {
  const [results, setResults] = useState<Awaited<ReturnType<typeof fetchDebateResults>>>(null);
  const [players, setPlayers] = useState<OnlineSessionPlayerRow[]>([]);
  useEffect(() => {
    void fetchDebateResults(sessionId).then(setResults);
    void fetchSessionPlayers(sessionId).then(setPlayers);
  }, [sessionId]);
  if (!results) return <Text style={styles.wait}>Loading results…</Text>;
  const winningSide: DebateSide | null =
    results.winning_side === 'agree' || results.winning_side === 'for'
      ? 'agree'
      : results.winning_side === 'disagree' || results.winning_side === 'against'
        ? 'disagree'
        : null;
  const mappedPlayers = players.map((player) => ({
    id: player.user_id,
    displayName: player.display_name,
    side: player.side,
  }));
  const rawScores = scoreDebate(
    players.map((p) => ({
      id: p.user_id,
      displayName: p.display_name,
      side: p.side,
      role: p.role,
    })),
    results.tie ? 'draw' : (winningSide ?? 'draw'),
    results.mvp_ids[0] ?? null,
  );
  const scores = Object.fromEntries(
    Object.entries(rawScores).map(([id, line]) => [
      id,
      {
        playerId: id,
        participation: line.participation,
        sideWin: line.sideBonus,
        mvp: line.mvp,
        total: line.total,
      },
    ]),
  );
  return (
    <>
      {rules.header}
      <DebateResultsView
        dark
        results={{
          winningSides: results.tie || !winningSide ? [] : [winningSide],
          sideTie: results.tie,
          sideTotals: {
            agree: results.side_totals?.agree ?? results.side_totals?.for ?? 0,
            disagree: results.side_totals?.disagree ?? results.side_totals?.against ?? 0,
          },
          playerTotals: results.player_totals ?? {},
          mvpIds: results.mvp_ids,
          mvpTie: results.mvp_ids.length !== 1,
        }}
        players={mappedPlayers}
        scores={scores}
        onBack={onBack}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  block: { gap: spacing.md },
  eyebrow: {
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1.2,
    textAlign: 'center',
    color: palette.ink,
  },
  eyebrowDark: { color: palette.white },
  category: { fontFamily: fontFamily.bodySemi, color: palette.gold, textAlign: 'center' },
  categoryDark: { color: palette.gold },
  topicCard: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  topicCardDark: { backgroundColor: palette.midnightRaised },
  topicText: { ...typeScale.bodyL, color: palette.ink, textAlign: 'center' },
  topicTextDark: { color: palette.white, textAlign: 'center' },
  kindness: {
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
    color: palette.warmGray,
    textAlign: 'center',
  },
  waitGold: { fontFamily: fontFamily.bodySemi, color: palette.gold, textAlign: 'center' },
  wait: { fontFamily: fontFamily.body, color: palette.warmGray, textAlign: 'center' },
  waitTitle: { ...typeScale.h2, color: palette.white, textAlign: 'center' },
  waitItalic: {
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
    color: palette.warmGray,
    textAlign: 'center',
  },
  sideRow: { flexDirection: 'row', gap: spacing.sm },
  sideCol: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
    minHeight: 160,
  },
  sideColSelected: { borderWidth: 3 },
  sideLabel: { fontFamily: fontFamily.headingSemi, fontSize: 16, textAlign: 'center' },
  sideCount: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 22,
    textAlign: 'center',
    color: palette.white,
  },
  sidePlayer: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: palette.white,
    textAlign: 'center',
  },
  showAll: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: palette.gold,
    textAlign: 'center',
  },
  selectedTag: { fontFamily: fontFamily.bodySemi, color: palette.gold, textAlign: 'center' },
  judgeCard: {
    backgroundColor: palette.midnightRaised,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  judgeBadge: { fontFamily: fontFamily.bodySemi, color: palette.gold, letterSpacing: 1 },
  judgeName: { fontFamily: fontFamily.body, color: palette.white },
  timerChip: {
    alignSelf: 'center',
    backgroundColor: palette.gold,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  timerText: { fontFamily: fontFamily.headingSemi, color: palette.ink },
  nudge: { fontFamily: fontFamily.body, color: palette.gold, textAlign: 'center' },
  timerPickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timerPick: {
    borderWidth: 1,
    borderColor: palette.warmGray,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  timerPickOn: { borderColor: palette.gold, backgroundColor: palette.midnightRaised },
  timerPickLabel: { fontFamily: fontFamily.body, color: palette.white, fontSize: 12 },
  verdictQ: { ...typeScale.h3, color: palette.white, textAlign: 'center' },
  verdictCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: palette.warmGray,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  verdictCardOn: { borderColor: palette.gold },
  verdictCardLabel: { fontFamily: fontFamily.headingSemi, color: palette.white },
  mvpLabel: { fontFamily: fontFamily.bodySemi, color: palette.gold, letterSpacing: 1 },
  mvpRow: { gap: spacing.md, paddingVertical: spacing.sm },
  mvpName: { fontFamily: fontFamily.body, color: palette.warmGray },
  mvpNameOn: { color: palette.gold, fontFamily: fontFamily.bodySemi },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
