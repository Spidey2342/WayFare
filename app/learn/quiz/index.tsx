import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, ScreenScroll, SegmentedTabs } from '@/components/ui';
import { quizCategories } from '@/features/learn/repository';
import { spacing, typeScale, useTheme } from '@/theme';

export default function QuizPickerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [category, setCategory] = useState('mixed');
  const [mode, setMode] = useState<'solo' | 'team'>('solo');

  const tabs = [
    { id: 'mixed', label: 'Mixed' },
    ...quizCategories.map((item) => ({ id: item.id, label: item.name })),
  ];

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Bible Quiz</Text>
        <Text style={[typeScale.bodyM, { color: colors.textSecondary }]}>
          Pick a category and play solo or with teams. Explanations include KJV references.
        </Text>
        <SegmentedTabs value={category} onChange={setCategory} tabs={tabs} />
        <SegmentedTabs
          value={mode}
          onChange={setMode}
          tabs={[
            { id: 'solo', label: 'Solo' },
            { id: 'team', label: 'Team' },
          ]}
        />
        <Button
          label="Start quiz"
          variant="gold"
          onPress={() =>
            router.push({
              pathname: '/learn/quiz/play',
              params: { category, mode },
            })
          }
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
});
