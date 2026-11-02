import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { DebateSide } from '@/features/debate/types';
import { DEBATE_KINDNESS_REMINDER } from '@/features/debate/types';
import { motion } from '@/theme/motion';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

type Props = {
  side: DebateSide;
  playerName?: string;
};

export function SideRevealCard({ side, playerName }: Props) {
  const rotateY = useSharedValue(90);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let reduce = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduce = enabled;
      if (reduce) {
        rotateY.value = 0;
        opacity.value = 1;
        return;
      }
      rotateY.value = withSpring(0, motion.spring.flip);
      opacity.value = withTiming(1, { duration: motion.duration.screen });
    });
  }, [opacity, rotateY]);

  const colors =
    side === 'agree' ? ([palette.coral, '#E85A4F'] as const) : ([palette.teal, '#1F8A84'] as const);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ perspective: 800 }, { rotateY: `${rotateY.value}deg` }],
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.cardWrap, cardStyle]}>
        <LinearGradient colors={colors} style={styles.card}>
          {playerName ? <Text style={styles.playerName}>{playerName}</Text> : null}
          <Text style={styles.sideLabel}>{side.toUpperCase()}</Text>
        </LinearGradient>
      </Animated.View>
      <Text style={styles.kindness}>{DEBATE_KINDNESS_REMINDER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: spacing.xl, paddingHorizontal: spacing.lg },
  cardWrap: { borderRadius: 24, overflow: 'hidden' },
  card: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  playerName: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 18,
    color: 'rgba(255,255,255,0.92)',
  },
  sideLabel: {
    fontFamily: fontFamily.heading,
    fontSize: 56,
    letterSpacing: 2,
    color: palette.white,
  },
  kindness: { ...typeScale.bodyM, color: palette.warmGray, textAlign: 'center', lineHeight: 24 },
});
