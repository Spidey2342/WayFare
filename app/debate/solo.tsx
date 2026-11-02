import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, ScreenScroll, TimerRing } from '@/components/ui';
import { DebatePrepPanel } from '@/features/debate/components/DebatePrepPanel';
import { useDebateRulesChrome } from '@/features/debate/components/DebateRulesChrome';
import { DebateStage } from '@/features/debate/components/DebateStage';
import { newLocalDebateId } from '@/features/debate/ids';
import {
  bundledDebateTopics,
  createSoloSession,
  soloAdvance,
  soloComplete,
  soloStartPrepTimer,
  topicById,
} from '@/features/debate/localSession';
import { saveLocalDebate, updateLocalDebate } from '@/features/debate/localStore';
import type { DebateSide, LocalDebateSession } from '@/features/debate/types';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function SoloDebateScreen() {
  const router = useRouter();
  const topics = bundledDebateTopics();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? 'topic-01');
  const [sidePick, setSidePick] = useState<DebateSide | 'random'>('random');
  const [session, setSession] = useState<LocalDebateSession | null>(null);
  const [recording, setRecording] = useState(false);
  const applyDebate = useAppStore((state) => state.applyDebateAward);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const rules = useDebateRulesChrome({ fallback: '/debate', showRulesOnMount: true });

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
    const topic = topicById(topicId) ?? topics[0]!;
    const id = newLocalDebateId('solo');
    let created = createSoloSession(id, topic, sidePick);
    created = soloStartPrepTimer(created);
    saveLocalDebate(created);
    setSession(created);
  };

  const finish = () => {
    if (!session) return;
    const done = soloComplete(session);
    saveLocalDebate(done);
    applyDebate({
      sessionId: done.id,
      xpGained: 4,
      votedThisRound: false,
      wasMvp: false,
    });
    router.replace('/home');
  };

  if (!session) {
    return (
      <>
        <Screen background={palette.offWhite} gutter={palette.offWhite}>
          <ScreenScroll contentContainerStyle={styles.content}>
            {rules.header}
            <Text style={typeScale.h1}>Solo debate</Text>
            <Text style={styles.lead}>Practice both sides on your own time.</Text>
            <Pressable accessibilityRole="button" onPress={rules.openRulesLink}>
              <Text style={styles.howLink}>How to play</Text>
            </Pressable>
            {topics.slice(0, 4).map((topic) => (
              <Button
                key={topic.id}
                label={topic.text.slice(0, 56) + (topic.text.length > 56 ? '…' : '')}
                variant={topicId === topic.id ? 'primary' : 'ghost'}
                onPress={() => setTopicId(topic.id)}
              />
            ))}
            <View style={styles.sideRow}>
              {(['agree', 'disagree', 'random'] as const).map((side) => (
                <Button
                  key={side}
                  label={
                    side === 'random' ? 'Surprise me' : side === 'agree' ? 'AGREE' : 'DISAGREE'
                  }
                  variant={sidePick === side ? 'gold' : 'secondary'}
                  onPress={() => setSidePick(side)}
                />
              ))}
            </View>
            <Button label="Begin" variant="gold" onPress={start} />
          </ScreenScroll>
        </Screen>
        {rules.sheet}
      </>
    );
  }

  const solo = session.solo!;
  const player = session.players[0]!;
  const side = player.side ?? 'agree';
  const secondsLeft = session.phaseEndsAt
    ? Math.max(0, Math.ceil((session.phaseEndsAt - nowMs) / 1000))
    : 0;

  if (solo.soloPhase === 'prep') {
    return (
      <>
        <Screen background={palette.midnight} gutter={palette.midnight}>
          <ScreenScroll contentContainerStyle={styles.content}>
            {rules.header}
            <DebatePrepPanel
              topic={session.topic.text}
              side={side}
              secondsLeft={secondsLeft}
              totalSeconds={session.config.prepSeconds}
              notes={solo.prepNotes}
              onNotesChange={(text) =>
                setSession({
                  ...session,
                  solo: { ...solo, prepNotes: text },
                })
              }
            />
            <Button
              label="Start arguing"
              variant="gold"
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
    const sideColor = activeSide === 'agree' ? palette.coral : palette.teal;
    const sideSoft = activeSide === 'agree' ? palette.coralSoft : palette.tealSoft;
    const forPlayers = session.players.filter((p) => p.side === 'agree');
    const againstPlayers = session.players.filter((p) => p.side === 'disagree');
    return (
      <>
        <Screen background={palette.midnight} gutter={palette.midnight}>
          <ScreenScroll contentContainerStyle={styles.content}>
            {rules.header}
            <View style={[styles.sideChip, { backgroundColor: sideSoft, borderColor: sideColor }]}>
              <Text style={styles.sideKicker}>YOUR SIDE</Text>
              <Text style={[styles.sideValue, { color: sideColor }]}>
                {activeSide.toUpperCase()}
              </Text>
            </View>
            <View style={styles.timerCenter}>
              <TimerRing secondsLeft={secondsLeft} total={60} size={120} />
            </View>
            <DebateStage
              topic={session.topic.text}
              secondsLeft={secondsLeft}
              totalSeconds={60}
              forPlayers={forPlayers}
              againstPlayers={againstPlayers}
              readyCount={0}
              playerCount={1}
              showReadyButton={false}
              announceTimer={false}
            />
            {Platform.OS === 'web' && typeof MediaRecorder !== 'undefined' ? (
              <Button
                label={recording ? 'Stop voice note' : 'Optional voice note'}
                variant="ghost"
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
              />
            ) : null}
            <Button
              label="Next side"
              variant="gold"
              onPress={() => setSession(soloAdvance(session))}
            />
          </ScreenScroll>
        </Screen>
        {rules.sheet}
      </>
    );
  }

  return (
    <>
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Text style={typeScale.h2}>Reflection</Text>
          <Text style={styles.lead}>Which side was harder? What did you learn?</Text>
          <TextInput
            multiline
            style={styles.notesLight}
            value={solo.reflection}
            onChangeText={(text) => setSession({ ...session, solo: { ...solo, reflection: text } })}
          />
          <View style={styles.sideRow}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                label={String(rating)}
                variant={solo.rating === rating ? 'gold' : 'ghost'}
                onPress={() => setSession({ ...session, solo: { ...solo, rating } })}
              />
            ))}
          </View>
          <Button label="Finish and earn XP" variant="primary" onPress={finish} />
        </ScreenScroll>
      </Screen>
      {rules.sheet}
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  lead: { ...typeScale.bodyM, color: palette.warmGray },
  howLink: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
    color: palette.teal,
    textDecorationLine: 'underline',
  },
  sideRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sideChip: {
    alignSelf: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  sideKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: palette.warmGray,
  },
  sideValue: { fontFamily: fontFamily.heading, fontSize: 28 },
  timerCenter: { alignItems: 'center' },
  notesLight: {
    minHeight: 120,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    backgroundColor: palette.white,
  },
});
