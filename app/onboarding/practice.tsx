import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, CardFace, Confetti, Screen, ScreenScroll } from '@/components/ui';
import { getDeck } from '@/features/decks/repository';
import { saveProfilePatch, useAuth } from '@/features/auth/AuthContext';
import { trackOnboardingEvent } from '@/features/onboarding/events';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

type CoachStep = 'card' | 'skip' | 'done' | 'timer';

export default function PracticeRoundScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, setProfileLocal } = useAuth();
  const awardFirstStepFromTutorial = useAppStore((state) => state.awardFirstStepFromTutorial);
  const completeLocalTutorial = useAppStore((state) => state.completeLocalTutorial);
  const [coach, setCoach] = useState<CoachStep>('card');
  const [cardIndex, setCardIndex] = useState(0);
  const [seconds] = useState(45);
  const [confetti, setConfetti] = useState(false);

  const deck = getDeck('identity');
  const cards = deck
    ? [
        deck.cards.find((card) => card.type === 'word'),
        deck.cards.find((card) => card.type === 'question'),
      ].filter(Boolean)
    : [];

  const current = cards[cardIndex];

  const finish = async () => {
    awardFirstStepFromTutorial();
    completeLocalTutorial();
    setConfetti(true);
    if (user) {
      await saveProfilePatch(
        user.id,
        { tutorial_completed: true, tutorial_step: 3 },
        setProfileLocal,
      );
      await trackOnboardingEvent(user.id, 'practice', 'completed');
    }
    setTimeout(() => router.replace('/home'), 1200);
  };

  const nextCoach = () => {
    if (coach === 'card') setCoach('skip');
    else if (coach === 'skip') setCoach('done');
    else if (coach === 'done') setCoach('timer');
    else if (cardIndex === 0) {
      setCardIndex(1);
      setCoach('card');
    } else {
      void finish();
    }
  };

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      {confetti ? <Confetti active /> : null}
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Practice round</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          About 60 seconds. Follow the tips, then tap Done.
        </Text>
        {current ? (
          <CardFace
            type={current.type}
            title={current.title}
            prompt={current.prompt}
            reference={current.reference}
            body={current.body}
          />
        ) : null}
        <View style={styles.coach}>
          <Text style={styles.coachLabel}>Tip</Text>
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.body, lineHeight: 22 }}>
            {coach === 'card' && 'This is your card. Read it out loud.'}
            {coach === 'skip' && 'Skip once if you need a different card.'}
            {coach === 'done' && 'Tap Done when you have answered or tried the challenge.'}
            {coach === 'timer' && `Timer keeps the pace (${seconds}s on real rounds).`}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button label="Skip once" variant="ghost" onPress={nextCoach} />
          <Button label="Done" variant="gold" onPress={nextCoach} />
        </View>
        <Button label="Next tip" variant="secondary" onPress={nextCoach} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  coach: {
    borderRadius: radii.card,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
    gap: spacing.xs,
  },
  coachLabel: { ...typeScale.caption, color: palette.goldDeep },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
