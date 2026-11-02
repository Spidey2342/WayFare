import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll, TimerRing } from '@/components/ui';
import { DebateHelpSheet } from '@/features/debate/components/DebateHelpSheet';
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
  const [helpOpen, setHelpOpen] = useState(() => !useAppStore.getState().playModeHelpSeen.debate);
  const [recording, setRecording] = useState(false);
  const applyDebate = useAppStore((state) => state.applyDebateAward);
  const markHelp = useAppStore((state) => state.markPlayModeHelpSeen);
  const [nowMs, setNowMs] = useState(() => Date.now());

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
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <BackButton label="Back" fallback="/debate" />
          <Text style={typeScale.h1}>Solo debate</Text>
          <Text style={styles.lead}>Practice both sides on your own time.</Text>
          {topics.slice(0, 4).map((topic) => (
            <Button
              key={topic.id}
              label={topic.text.slice(0, 56) + (topic.text.length > 56 ? '…' : '')}
              variant={topicId === topic.id ? 'primary' : 'ghost'}
              onPress={() => setTopicId(topic.id)}
            />
          ))}
          <View style={styles.sideRow}>
            {(['for', 'against', 'random'] as const).map((side) => (
              <Button
                key={side}
                label={side === 'random' ? 'Random side' : side.toUpperCase()}
                variant={sidePick === side ? 'gold' : 'secondary'}
                onPress={() => setSidePick(side)}
              />
            ))}
          </View>
          <Button label="Begin" variant="gold" onPress={start} />
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

  const solo = session.solo!;
  const secondsLeft = session.phaseEndsAt
    ? Math.max(0, Math.ceil((session.phaseEndsAt - nowMs) / 1000))
    : 0;

  if (solo.soloPhase === 'prep') {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Header onHelp={() => setHelpOpen(true)} />
          <Text style={styles.phase}>Prep · 30s</Text>
          <TimerRing secondsLeft={secondsLeft} total={session.config.prepSeconds} />
          <Text style={styles.topic}>{session.topic.text}</Text>
          <TextInput
            multiline
            placeholder="Your 3 points…"
            placeholderTextColor={palette.warmGray}
            style={styles.notes}
            value={solo.prepNotes}
            onChangeText={(text) =>
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
    );
  }

  if (solo.soloPhase === 'for' || solo.soloPhase === 'against') {
    const forPlayers = session.players.filter((player) => player.side === 'for');
    const againstPlayers = session.players.filter((player) => player.side === 'against');
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Header onHelp={() => setHelpOpen(true)} />
          <DebateStage
            topic={session.topic.text}
            secondsLeft={secondsLeft}
            totalSeconds={60}
            forPlayers={forPlayers}
            againstPlayers={againstPlayers}
            readyCount={0}
            playerCount={1}
            showReadyButton={false}
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
    );
  }

  return (
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
  );
}

function Header({ onHelp }: { onHelp: () => void }) {
  return (
    <View style={styles.headerRow}>
      <BackButton label="Exit" fallback="/debate" />
      <Button label="?" variant="ghost" onPress={onHelp} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  lead: { ...typeScale.bodyM, color: palette.warmGray },
  sideRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phase: { color: palette.gold, fontFamily: fontFamily.bodySemi },
  topic: { color: palette.white, fontFamily: fontFamily.headingSemi, fontSize: 20, lineHeight: 28 },
  notes: {
    minHeight: 100,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    color: palette.white,
    backgroundColor: palette.midnightRaised,
  },
  notesLight: {
    minHeight: 120,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    backgroundColor: palette.white,
  },
});
