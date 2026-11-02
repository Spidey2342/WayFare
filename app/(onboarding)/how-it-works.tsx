import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, HeartHandshake, Users } from 'lucide-react-native';

import { Button, Screen, ScreenScroll } from '@/components/ui';
import { useAppStore } from '@/store';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

const steps = [
  {
    n: '1',
    title: 'Draw a card',
    body: 'A prompt rooted in Scripture and the life of the church.',
    icon: BookOpen,
    bg: '#FFF4D2',
  },
  {
    n: '2',
    title: 'Do it',
    body: 'Answer, encourage, or take a kind dare. Skipping is always allowed.',
    icon: HeartHandshake,
    bg: '#FFE8E8',
  },
  {
    n: '3',
    title: 'Grow together',
    body: 'Pray, listen, and leave closer than you arrived.',
    icon: Users,
    bg: '#E5F8F6',
  },
] as const;

export default function HowItWorksScreen() {
  const router = useRouter();
  const markIntroSeen = useAppStore((state) => state.markIntroSeen);
  return (
    <Screen>
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotOn]} />
            <View style={styles.dot} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={() => {
              markIntroSeen();
              router.replace('/home');
            }}
            style={styles.skip}
          >
            <Text style={styles.skipText}>SKIP</Text>
          </Pressable>
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Grow as you go.</Text>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <View key={step.n} style={styles.step}>
                <View style={[styles.icon, { backgroundColor: step.bg }]}>
                  <Icon color={palette.midnight} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>
                    {step.n}. {step.title}
                  </Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              </View>
            );
          })}
          <View style={styles.art}>
            <Users color={palette.gold} size={42} />
          </View>
          <Button label="Next" onPress={() => router.push('/choose-mode')} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 48 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D5D8E0' },
  dotOn: { width: 18, backgroundColor: palette.midnight },
  skip: { minHeight: 44, justifyContent: 'center' },
  skipText: { fontFamily: fontFamily.bodySemi, letterSpacing: 1, color: palette.warmGray },
  body: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.lg },
  title: { ...typeScale.h1, color: palette.midnight },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontFamily: fontFamily.headingSemi, fontSize: 16, color: palette.midnight },
  stepBody: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20, color: palette.warmGray },
  art: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: palette.midnight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
});
