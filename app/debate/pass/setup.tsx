import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { newLocalDebateId } from '@/features/debate/ids';
import { bundledDebateTopics, createPassSession, topicById } from '@/features/debate/localSession';
import { saveLocalDebate } from '@/features/debate/localStore';
import { palette, radii, spacing, typeScale } from '@/theme';

export default function PassDebateSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ test?: string }>();
  const fast = params.test === '1' || process.env.EXPO_PUBLIC_DEBATE_TEST_TIMERS === 'true';
  const topics = bundledDebateTopics();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? 'topic-01');
  const [names, setNames] = useState('Kofi\nAma');

  const start = () => {
    const topic = topicById(topicId) ?? topics[0]!;
    const lines = names
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);
    if (lines.length < 2) return;
    const id = newLocalDebateId('pass');
    const players = lines.map((displayName, index) => ({
      id: `p${index + 1}`,
      displayName,
    }));
    const session = createPassSession(id, topic, players, 'p1', {
      prepSeconds: fast ? 1 : 30,
      debateSeconds: fast ? 2 : 120,
      votingSeconds: fast ? 2 : 30,
      debateExtensionSeconds: 30,
    });
    saveLocalDebate(session);
    router.push({ pathname: '/debate/pass/[sessionId]', params: { sessionId: id } });
  };

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback="/debate" />
        <Text style={typeScale.h2}>Same-phone debate</Text>
        <Text style={styles.label}>Topic</Text>
        <View style={styles.topicList}>
          {topics.map((topic) => (
            <Button
              key={topic.id}
              label={topic.text.slice(0, 48) + (topic.text.length > 48 ? '…' : '')}
              variant={topicId === topic.id ? 'primary' : 'ghost'}
              onPress={() => setTopicId(topic.id)}
            />
          ))}
        </View>
        <Text style={styles.label}>Players (one name per line, 2–8)</Text>
        <TextInput
          multiline
          value={names}
          onChangeText={setNames}
          style={styles.input}
          accessibilityLabel="Player names"
        />
        <Button label="Start lobby" variant="gold" onPress={start} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 48 },
  label: { ...typeScale.caption, color: palette.warmGray, marginTop: spacing.sm },
  topicList: { gap: spacing.xs },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radii.card,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: palette.white,
  },
});
