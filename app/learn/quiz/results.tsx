import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BackButton, Button, Confetti, Screen } from '@/components/ui';
import { useAppStore } from '@/store';
import { palette, spacing, typeScale } from '@/theme';

export default function QuizResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ score?: string; total?: string; category?: string }>();
  const score = Number(params.score ?? 0);
  const total = Number(params.total ?? 10);
  const completeQuiz = useAppStore((state) => state.completeQuiz);

  useEffect(() => {
    completeQuiz();
  }, [completeQuiz]);

  return (
    <Screen>
      <Confetti active />
      <View style={styles.body}>
        <Text style={styles.kicker}>Quiz complete</Text>
        <Text style={typeScale.h1}>
          You scored {score} / {total}
        </Text>
        <Text style={{ color: palette.warmGray, fontFamily: typeScale.bodyM.fontFamily }}>
          Review missed questions with your group and look up each reference in the KJV.
        </Text>
        <Button label="Play again" variant="gold" onPress={() => router.replace('/learn/quiz')} />
        <BackButton label="Back to Learn" fallback="/learn" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, gap: spacing.md },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
});
