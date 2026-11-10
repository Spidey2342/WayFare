import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Flame, Gavel, Mic, Wand2, Zap } from 'lucide-react-native';

import { Screen, ScreenScroll, TimerRing } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { useDebateRulesChrome } from '@/features/debate/components/DebateRulesChrome';
import {
  DebateDailyChallengeCard,
  DebateGoldButton,
  DebateModeHeader,
  DebateOutlineButton,
  DebateStanceToggle,
  DebateTimerChip,
  debateUi,
} from '@/features/debate/components/debateV2Ui';
import { newLocalDebateId } from '@/features/debate/ids';
import {
  bundledDebateTopics,
  hydrateDebateTopics,
  createSoloSession,
  soloAdvance,
  soloComplete,
  soloStartPrepTimer,
  topicById,
} from '@/features/debate/localSession';
import { soloDisplayXp } from '@/features/debate/engine/soloDailyCap';
import { saveLocalDebate, updateLocalDebate } from '@/features/debate/localStore';
import { awardSoloDebatesSignedIn, ensureOutboxFlushOnReconnect } from '@/features/debate/outbox';
import { readCachedStats, syncMyStats } from '@/features/debate/statsCache';
import type { DebateSide, LocalDebateSession } from '@/features/debate/types';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

function shuffleTopicId(current: string, topics: ReturnType<typeof bundledDebateTopics>) {
  const pool = topics.filter((topic) => topic.id !== current);
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? current;
}

function parsePoints(notes: string): [string, string, string] {
  const lines = notes.split('\n');
  return [lines[0] ?? '', lines[1] ?? '', lines[2] ?? ''];
}

function joinPoints(a: string, b: string, c: string) {
  return [a, b, c].join('\n');
}

export default function SoloDebateScreen() {
  const router = useRouter();
  const topics = bundledDebateTopics();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? 'topic-01');
  const [stance, setStance] = useState<DebateSide>('agree');
  const [session, setSession] = useState<LocalDebateSession | null>(null);
  const [recording, setRecording] = useState(false);
  const [verdictPick, setVerdictPick] = useState<'agree' | 'disagree' | null>(null);
  const { user } = useAuth();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [o3Xp, setO3Xp] = useState(1);
  const [o3Streak, setO3Streak] = useState(0);
  const [o3Pending, setO3Pending] = useState(false);
  const awardStarted = useRef(false);
  const rules = useDebateRulesChrome({ fallback: '/debate', showRulesOnMount: true });

  const topic = useMemo(() => topicById(topicId) ?? topics[0]!, [topicId, topics]);

  useEffect(() => {
    void hydrateDebateTopics();
    ensureOutboxFlushOnReconnect();
  }, []);

  useEffect(() => {
    if (!session?.solo || session.solo.soloPhase !== 'reflect') return;
    if (awardStarted.current) return;
    awardStarted.current = true;
    void (async () => {
      if (!user) return;
      const cached = await readCachedStats();
      const clientId = `${session.id}:solo`;
      const result = await awardSoloDebatesSignedIn(clientId);
      const synced = await syncMyStats();
      const todayCount = synced.stats?.solo_debates_today ?? cached.stats?.solo_debates_today ?? 0;
      const streak =
        result.streak_days ?? synced.stats?.streak_days ?? cached.stats?.streak_days ?? 0;
      setO3Pending(Boolean(result.pending));
      setO3Streak(streak);
      setO3Xp(soloDisplayXp(todayCount, result.xp ?? 0));
    })();
  }, [session, user]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session?.phaseEndsAt) return undefined;
    const timer = setInterval(() => {
      if (session.phaseEndsAt && Date.now() >= session.phaseEndsAt) {
        updateLocalDebate(session.id, soloAdvance);
        setSession((current) =>
          current ? (updateLocalDebate(current.id, soloAdvance) ?? current) : current,
        );
      }
    }, 500);
    return () => clearInterval(timer);
  }, [session]);

  const start = () => {
    const id = newLocalDebateId('solo');
    let created = createSoloSession(id, topic, stance);
    created = soloStartPrepTimer(created);
    saveLocalDebate(created);
    setSession(created);
  };

  const surprise = () => {
    setTopicId(shuffleTopicId(topicId, topics));
    setStance(Math.random() > 0.5 ? 'agree' : 'disagree');
  };

  const finish = () => {
    if (!session) return;
    const done = soloComplete(session);
    saveLocalDebate(done);
    router.replace('/home');
  };

  if (!session) {
    return (
      <>
        <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
          <ScreenScroll contentContainerStyle={styles.content}>
            <DebateModeHeader
              title="SOLO MODE"
              onBack={() => router.replace('/debate')}
              onInfo={rules.openRulesLink}
            />
            <DebateDailyChallengeCard
              text={topic.text}
              onShuffle={() => setTopicId(shuffleTopicId(topicId, topics))}
            />
            <DebateStanceToggle selected={stance} onSelect={setStance} />
            <Pressable accessibilityRole="button" onPress={surprise} style={styles.surpriseBtn}>
              <Wand2 color={debateUi.muted} size={18} />
              <Text style={styles.surpriseText}>SURPRISE ME</Text>
            </Pressable>
            <DebateGoldButton label="START SOLO DEBATE" onPress={start} />
          </ScreenScroll>
        </Screen>
        {rules.sheet}
      </>
    );
  }

  const solo = session.solo!;
  const player = session.players[0]!;
  const side = player.side ?? 'agree';
  const sideColor = side === 'agree' ? debateUi.agree : debateUi.disagree;
  const secondsLeft = session.phaseEndsAt
    ? Math.max(0, Math.ceil((session.phaseEndsAt - nowMs) / 1000))
    : 0;
  const [p1, p2, p3] = parsePoints(solo.prepNotes);

  if (solo.soloPhase === 'prep') {
    const minutes = Math.floor(secondsLeft / 60);
    const secs = String(secondsLeft % 60).padStart(2, '0');
    return (
      <>
        <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
          <ScreenScroll contentContainerStyle={styles.content}>
            <View style={styles.prepHead}>
              <Text style={[styles.stanceLabel, { color: sideColor }]}>
                STANCE: {side.toUpperCase()}
              </Text>
              <DebateTimerChip label={`${minutes}:${secs}`} />
            </View>
            <Text style={styles.prepTitle}>Make Your Case</Text>
            <Text style={styles.prepQuote}>&ldquo;{session.topic.text}&rdquo;</Text>
            <View style={styles.pointsCard}>
              <Text style={styles.pointsKicker}>YOUR 3 MAIN POINTS</Text>
              {[0, 1, 2].map((index) => {
                const value = [p1, p2, p3][index] ?? '';
                const placeholders = [
                  'Tap to add your first point…',
                  'Tap to add your second point…',
                  'Tap to add your third point…',
                ];
                return (
                  <View key={index} style={styles.pointRow}>
                    <Text style={styles.pointNum}>{index + 1}</Text>
                    <TextInput
                      multiline
                      placeholder={placeholders[index]}
                      placeholderTextColor={debateUi.muted}
                      style={[styles.pointInput, value ? styles.pointInputFilled : null]}
                      value={value}
                      onChangeText={(text) => {
                        const next = [p1, p2, p3];
                        next[index] = text;
                        setSession({
                          ...session,
                          solo: {
                            ...solo,
                            prepNotes: joinPoints(next[0] ?? '', next[1] ?? '', next[2] ?? ''),
                          },
                        });
                      }}
                    />
                  </View>
                );
              })}
            </View>
            {Platform.OS === 'web' && typeof MediaRecorder !== 'undefined' ? (
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  if (recording) {
                    setRecording(false);
                    return;
                  }
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const recorder = new MediaRecorder(stream);
                    recorder.start();
                    setRecording(true);
                    recorder.onstop = () => stream.getTracks().forEach((track) => track.stop());
                  } catch {
                    setRecording(false);
                  }
                }}
                style={styles.voiceBtn}
              >
                <Mic color={debateUi.muted} size={18} />
                <Text style={styles.voiceText}>
                  {recording ? 'STOP RECORDING' : 'RECORD VOICE NOTE'}
                </Text>
              </Pressable>
            ) : null}
            <DebateGoldButton
              label="I'VE MADE MY CASE"
              onPress={() => setSession(soloAdvance(session))}
            />
          </ScreenScroll>
        </Screen>
        {rules.sheet}
      </>
    );
  }

  if (solo.soloPhase === 'agree' || solo.soloPhase === 'disagree') {
    const activeSide = solo.soloPhase;
    const activeColor = activeSide === 'agree' ? debateUi.agree : debateUi.disagree;
    return (
      <>
        <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
          <ScreenScroll contentContainerStyle={styles.content}>
            <Text style={[styles.stanceLabel, { color: activeColor }]}>
              PRACTICE: {activeSide.toUpperCase()}
            </Text>
            <View style={styles.timerCenter}>
              <TimerRing secondsLeft={secondsLeft} total={60} size={120} />
            </View>
            <Text style={styles.prepQuote}>&ldquo;{session.topic.text}&rdquo;</Text>
            <DebateGoldButton label="NEXT" onPress={() => setSession(soloAdvance(session))} />
          </ScreenScroll>
        </Screen>
        {rules.sheet}
      </>
    );
  }

  return (
    <>
      <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <View style={styles.verdictIcon}>
            <Gavel color={debateUi.ink} size={28} />
          </View>
          <Text style={styles.prepTitle}>The Verdict</Text>
          <Text style={styles.verdictSub}>Which side convinced you more?</Text>
          <View style={styles.verdictRow}>
            {(['agree', 'disagree'] as const).map((pick) => (
              <Pressable
                key={pick}
                onPress={() => setVerdictPick(pick)}
                style={[
                  styles.verdictPill,
                  verdictPick === pick && {
                    borderColor: pick === 'agree' ? debateUi.agree : debateUi.disagree,
                  },
                ]}
              >
                <Text style={styles.verdictPillText}>{pick.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.unsure}>STILL UNSURE</Text>
          <View style={styles.rewardRow}>
            <View style={styles.rewardTile}>
              {o3Pending ? (
                <Clock color={debateUi.gold} size={18} />
              ) : (
                <Zap color={debateUi.gold} size={18} />
              )}
              <Text style={styles.rewardValue}>+{o3Xp}</Text>
              <Text style={styles.rewardLabel}>POINTS EARNED</Text>
            </View>
            <View style={styles.rewardTile}>
              <Flame color={debateUi.agree} size={18} />
              <Text style={styles.rewardValue}>{o3Streak}</Text>
              <Text style={styles.rewardLabel}>DAY STREAK</Text>
            </View>
          </View>
          <DebateGoldButton
            label="ANOTHER TOPIC"
            onPress={() => {
              awardStarted.current = false;
              setSession(null);
            }}
          />
          <DebateOutlineButton label="BACK TO DASHBOARD" onPress={finish} />
        </ScreenScroll>
      </Screen>
      {rules.sheet}
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  surpriseBtn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: debateUi.cardBorder,
    minHeight: 48,
  },
  surpriseText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    letterSpacing: 0.8,
    color: debateUi.muted,
  },
  prepHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stanceLabel: { fontFamily: fontFamily.bodySemi, fontSize: 12, letterSpacing: 1 },
  prepTitle: { ...typeScale.h2, color: palette.white },
  prepQuote: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: debateUi.muted,
    fontStyle: 'italic',
  },
  pointsCard: {
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pointsKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: debateUi.gold,
  },
  pointRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  pointNum: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: debateUi.gold,
    width: 20,
    marginTop: 10,
  },
  pointInput: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.sm,
    color: palette.white,
    fontFamily: fontFamily.body,
    fontSize: 15,
    backgroundColor: '#141824',
  },
  pointInputFilled: {
    borderColor: debateUi.disagree,
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
  },
  voiceBtn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  voiceText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
    color: debateUi.muted,
  },
  timerCenter: { alignItems: 'center' },
  verdictIcon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: debateUi.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdictSub: { fontFamily: fontFamily.body, color: debateUi.muted, textAlign: 'center' },
  verdictRow: { flexDirection: 'row', gap: spacing.sm },
  verdictPill: {
    flex: 1,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: debateUi.cardBorder,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: debateUi.card,
  },
  verdictPillText: { fontFamily: fontFamily.bodySemi, color: palette.white, letterSpacing: 0.5 },
  unsure: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: debateUi.muted,
    textAlign: 'center',
  },
  rewardRow: { flexDirection: 'row', gap: spacing.sm },
  rewardTile: {
    flex: 1,
    backgroundColor: debateUi.card,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
  },
  rewardValue: { fontFamily: fontFamily.headingSemi, fontSize: 18, color: palette.white },
  rewardLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 9,
    letterSpacing: 0.8,
    color: debateUi.muted,
    textAlign: 'center',
  },
});
