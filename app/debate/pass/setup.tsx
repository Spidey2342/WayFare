import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Avatar, Screen, ScreenScroll } from '@/components/ui';
import {
  DebateGoldButton,
  DebateModeHeader,
  debateUi,
} from '@/features/debate/components/debateV2Ui';
import { avatarColorForKey } from '@/data/avatarPresets';
import { newLocalDebateId } from '@/features/debate/ids';
import { bundledDebateTopics, createPassSession, topicById } from '@/features/debate/localSession';
import { saveLocalDebate } from '@/features/debate/localStore';
import { fontFamily, minTapTarget, palette, radii, spacing, typeScale } from '@/theme';

export default function PassDebateSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ test?: string }>();
  const fast = params.test === '1' || process.env.EXPO_PUBLIC_DEBATE_TEST_TIMERS === 'true';
  const topics = bundledDebateTopics();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? 'topic-01');
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3']);
  const [judgeIndex, setJudgeIndex] = useState(1);
  const [newName, setNewName] = useState('');

  const topic = useMemo(() => topicById(topicId) ?? topics[0]!, [topicId, topics]);

  const addPlayer = () => {
    const name = newName.trim();
    if (!name || playerNames.length >= 8) return;
    setPlayerNames((list) => [...list, name]);
    setNewName('');
  };

  const start = () => {
    if (playerNames.length < 2) return;
    const players = playerNames.map((displayName, index) => ({
      id: `p${index + 1}`,
      displayName: index === 0 ? `${displayName} (You)` : displayName,
    }));
    const hostId = players[judgeIndex]?.id ?? players[0]!.id;
    const id = newLocalDebateId('pass');
    const session = createPassSession(id, topic, players, hostId, {
      prepSeconds: fast ? 1 : 30,
      debateSeconds: fast ? 2 : 120,
      votingSeconds: fast ? 2 : 30,
      debateExtensionSeconds: 30,
    });
    saveLocalDebate(session);
    router.push({ pathname: '/debate/pass/[sessionId]', params: { sessionId: id } });
  };

  return (
    <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <DebateModeHeader title="PLAYERS" onBack={() => router.replace('/debate')} />
        <Text style={typeScale.h2}>Players</Text>
        <Text style={styles.kicker}>WHO IS PLAYING TODAY?</Text>
        <View style={styles.list}>
          {playerNames.map((name, index) => {
            const isJudge = index === judgeIndex;
            return (
              <Pressable
                key={`${name}-${index}`}
                accessibilityRole="button"
                onPress={() => setJudgeIndex(index)}
                style={[styles.playerRow, isJudge && styles.playerRowJudge]}
              >
                <Avatar name={name} color={avatarColorForKey(name)} size={44} />
                <Text style={styles.playerName}>{name}</Text>
                <View style={styles.judgeToggle}>
                  <Text style={[styles.judgeLabel, isJudge && styles.judgeLabelOn]}>JUDGE</Text>
                  <View style={[styles.radio, isJudge && styles.radioOn]} />
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.addRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Player name"
            placeholderTextColor={debateUi.muted}
            style={styles.addInput}
            accessibilityLabel="New player name"
          />
          <Pressable accessibilityRole="button" onPress={addPlayer} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ ADD PLAYER</Text>
          </Pressable>
        </View>
        <Text style={styles.topicKicker}>Topic (tap to cycle)</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const idx = topics.findIndex((item) => item.id === topicId);
            setTopicId(topics[(idx + 1) % topics.length]!.id);
          }}
          style={styles.topicPreview}
        >
          <Text style={styles.topicPreviewText}>{topic.text}</Text>
        </Pressable>
        <DebateGoldButton label="CONTINUE" onPress={start} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  kicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 2,
    color: debateUi.muted,
  },
  list: { gap: spacing.sm },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.md,
    minHeight: minTapTarget + 8,
  },
  playerRowJudge: { borderColor: debateUi.gold, borderWidth: 2 },
  playerName: { flex: 1, fontFamily: fontFamily.bodySemi, fontSize: 16, color: palette.white },
  judgeToggle: { alignItems: 'flex-end', gap: 4 },
  judgeLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 10,
    letterSpacing: 1,
    color: debateUi.muted,
  },
  judgeLabelOn: { color: debateUi.gold },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: debateUi.muted,
  },
  radioOn: { borderColor: debateUi.gold, backgroundColor: debateUi.gold },
  addRow: { gap: spacing.sm },
  addInput: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.md,
    color: palette.white,
    fontFamily: fontFamily.body,
    backgroundColor: debateUi.card,
  },
  addBtn: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: debateUi.cardBorder,
    minHeight: minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.8,
    color: debateUi.muted,
  },
  topicKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: debateUi.muted,
    marginTop: spacing.sm,
  },
  topicPreview: {
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.md,
  },
  topicPreviewText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: palette.white,
    lineHeight: 20,
  },
});
