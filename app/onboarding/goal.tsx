import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button, Screen, ScreenScroll } from '@/components/ui';
import { saveProfilePatch, useAuth } from '@/features/auth/AuthContext';
import { trackOnboardingEvent } from '@/features/onboarding/events';
import { nextTutorialStep } from '@/features/auth/routing';
import { useAppStore } from '@/store';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

const goals = [
  { id: 'friends', label: 'Play with friends' },
  { id: 'solo', label: 'Study on my own' },
  { id: 'lead', label: 'Lead a youth group' },
] as const;

export default function GoalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, setProfileLocal } = useAuth();
  const setLocalTutorialStep = useAppStore((state) => state.setLocalTutorialStep);

  const pick = async (goal: string) => {
    setLocalTutorialStep(nextTutorialStep(0));
    if (user) {
      await saveProfilePatch(user.id, { goal }, setProfileLocal);
      await trackOnboardingEvent(user.id, 'goal', 'completed');
    }
    router.push('/onboarding/how-wayfare');
  };

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>What brings you here?</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          One tap helps us point you to the right next step.
        </Text>
        {goals.map((goal) => (
          <Button
            key={goal.id}
            label={goal.label}
            variant="secondary"
            onPress={() => void pick(goal.id)}
          />
        ))}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
});
