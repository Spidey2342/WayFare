import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Layers, Users } from 'lucide-react-native';

import { Button, Screen, ScreenScroll } from '@/components/ui';
import { nextTutorialStep } from '@/features/auth/routing';
import { saveProfilePatch, useAuth } from '@/features/auth/AuthContext';
import { trackOnboardingEvent } from '@/features/onboarding/events';
import { useAppStore } from '@/store';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

const steps = [
  {
    title: 'Draw a card',
    body: 'Each card is a Word, question, or challenge from Scripture.',
    Icon: Layers,
  },
  {
    title: 'Do it together',
    body: 'Talk, laugh, and respond as a group or on your own.',
    Icon: Users,
  },
  {
    title: 'Grow in the Word',
    body: 'Lessons and streaks help habits stick after game night.',
    Icon: BookOpen,
  },
];

export default function HowWayfareScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const { user, setProfileLocal } = useAuth();
  const setLocalTutorialStep = useAppStore((state) => state.setLocalTutorialStep);

  const finish = async (action: 'completed' | 'skipped') => {
    setLocalTutorialStep(nextTutorialStep(1));
    if (user) {
      await saveProfilePatch(user.id, { tutorial_step: 2 }, setProfileLocal);
      await trackOnboardingEvent(user.id, `how-wayfare-${index}`, action);
    }
    router.push('/onboarding/practice');
  };

  const step = steps[index];
  const Icon = step?.Icon ?? Layers;

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>How Wayfare works</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Icon color={palette.blue} size={28} />
          <Text style={[typeScale.h2, { color: colors.textPrimary }]}>{step?.title}</Text>
          <Text
            style={{ color: colors.textSecondary, fontFamily: fontFamily.body, lineHeight: 22 }}
          >
            {step?.body}
          </Text>
        </View>
        {index < steps.length - 1 ? (
          <Button label="Next" variant="primary" onPress={() => setIndex((value) => value + 1)} />
        ) : (
          <Button
            label="Try your first card"
            variant="gold"
            onPress={() => void finish('completed')}
          />
        )}
        <Button label="Skip tour" variant="ghost" onPress={() => void finish('skipped')} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
  card: { borderRadius: 16, padding: spacing.lg, gap: spacing.sm },
});
