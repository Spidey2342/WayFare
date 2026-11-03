import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone, Users } from 'lucide-react-native';

import { AvatarStack, Button, Chip, Screen, ScreenScroll } from '@/components/ui';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, shadows, spacing, typeScale } from '@/theme';

export default function ChooseModeScreen() {
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const markIntroSeen = useAppStore((state) => state.markIntroSeen);
  const [mode, setMode] = useState<'pass' | 'team'>('team');

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={styles.body}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={styles.backText}>BACK</Text>
        </Pressable>
        <Text style={styles.title}>Start your adventure.</Text>
        <Text style={styles.sub}>How do you want to play today?</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'pass' }}
          onPress={() => setMode('pass')}
          style={[styles.card, mode === 'pass' && styles.selected]}
        >
          <Smartphone color={palette.midnight} size={22} />
          <Text style={styles.cardTitle}>Pass-the-Phone</Text>
          <Text style={styles.cardBody}>
            Perfect for small groups. One phone, kind turns, no scoreboard.
          </Text>
          <AvatarStack
            people={[
              { name: 'P1', color: palette.gold },
              { name: 'P2', color: palette.teal },
              { name: 'P3', color: palette.coral },
            ]}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'team' }}
          onPress={() => setMode('team')}
          style={[styles.card, styles.dark, mode === 'team' && styles.selectedGold]}
        >
          <Users color={palette.gold} size={22} />
          <Text style={[styles.cardTitle, styles.light]}>Team Mode</Text>
          <Text style={styles.darkBody}>
            Split into teams, answer together, and cheer for the whole room.
          </Text>
          <View style={styles.tags}>
            <Chip label="Teams 2-4" tone="dark" />
            <Chip label="Competitive" tone="solidGold" />
          </View>
        </Pressable>
        <Button
          label="Continue"
          variant="gold"
          onPress={() => {
            completeOnboarding(mode);
            markIntroSeen();
            router.replace('/home');
          }}
        />
        <Text style={styles.verse}>
          Let your speech be always with grace, seasoned with salt. — Colossians 4:6
        </Text>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.xl, gap: spacing.md, paddingBottom: 48 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { fontFamily: fontFamily.bodySemi, letterSpacing: 1, color: palette.warmGray },
  title: { ...typeScale.h1, color: palette.midnight },
  sub: { ...typeScale.bodyM, color: palette.warmGray },
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.soft,
  },
  dark: { backgroundColor: palette.midnight },
  selected: { borderWidth: 2, borderColor: palette.gold },
  selectedGold: { borderWidth: 2, borderColor: palette.gold },
  cardTitle: { fontFamily: fontFamily.headingSemi, fontSize: 18, color: palette.midnight },
  light: { color: palette.white },
  cardBody: { fontFamily: fontFamily.body, color: palette.warmGray, lineHeight: 20 },
  darkBody: { fontFamily: fontFamily.body, color: '#C9CDD6', lineHeight: 20 },
  tags: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  verse: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: palette.warmGray,
    textAlign: 'center',
  },
});
