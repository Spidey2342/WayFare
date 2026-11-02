import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Smartphone, User, Users } from 'lucide-react-native';

import { BackButton, Screen, ScreenScroll } from '@/components/ui';
import { GameRulesSheet } from '@/components/game/GameRulesSheet';
import { useGameRules } from '@/features/game/useGameRules';
import { fontFamily, minTapTarget, palette, radii, shadows, spacing, typeScale } from '@/theme';

const tiles = [
  {
    id: 'solo' as const,
    title: 'Solo',
    body: 'Practice both sides on your own.',
    href: '/debate/solo' as const,
    icon: User,
    tint: palette.coralSoft,
    iconColor: palette.coral,
  },
  {
    id: 'pass' as const,
    title: 'Same phone',
    body: 'Pass the device for secret votes.',
    href: '/debate/pass/setup' as const,
    icon: Smartphone,
    tint: palette.tealSoft,
    iconColor: palette.teal,
  },
  {
    id: 'online' as const,
    title: 'Join online',
    body: 'Room code with your group.',
    href: '/debate/join' as const,
    icon: Users,
    tint: '#FFF4D2',
    iconColor: palette.goldDeep,
  },
];

export default function DebateHubScreen() {
  const router = useRouter();
  const { entry, open, openRules, openIfFirstTime, closeRules } = useGameRules('debate');

  useEffect(() => {
    openIfFirstTime();
  }, [openIfFirstTime]);

  return (
    <>
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <BackButton label="Back" fallback="/home" />
          <Text style={typeScale.h1}>Debate</Text>
          <Pressable accessibilityRole="button" onPress={openRules} style={styles.howLink}>
            <Text style={styles.howText}>How to play</Text>
          </Pressable>
          <View style={styles.tiles}>
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Pressable
                  key={tile.id}
                  accessibilityRole="button"
                  onPress={() => router.push(tile.href)}
                  style={styles.tile}
                >
                  <View style={[styles.iconCircle, { backgroundColor: tile.tint }]}>
                    <Icon color={tile.iconColor} size={22} />
                  </View>
                  <View style={styles.tileText}>
                    <Text style={styles.tileTitle}>{tile.title}</Text>
                    <Text style={styles.tileBody}>{tile.body}</Text>
                  </View>
                  <ChevronRight color={palette.warmGray} size={20} />
                </Pressable>
              );
            })}
          </View>
        </ScreenScroll>
      </Screen>
      <GameRulesSheet open={open} onClose={closeRules} entry={entry} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  howLink: { minHeight: minTapTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  howText: { fontFamily: fontFamily.bodySemi, color: palette.goldDeep, fontSize: 14 },
  tiles: { gap: spacing.sm, marginTop: spacing.sm },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.lg,
    minHeight: minTapTarget + 16,
    ...shadows.soft,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { flex: 1, gap: 4 },
  tileTitle: { fontFamily: fontFamily.headingSemi, fontSize: 18, color: palette.midnight },
  tileBody: { fontFamily: fontFamily.body, fontSize: 14, color: palette.warmGray },
});
