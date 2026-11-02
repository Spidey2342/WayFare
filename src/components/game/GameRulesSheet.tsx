import { useEffect, useState } from 'react';
import { Animated, AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Crown, Hand, Layers, MessageCircle, SkipForward, Star, Trophy } from 'lucide-react-native';

import { BottomSheet, Button } from '@/components/ui';
import type { GameRulesEntry } from '@/data/gameRules';
import { motion } from '@/theme/motion';
import { fontFamily, minTapTarget, palette, radii, spacing, typeScale } from '@/theme';

const rowIcons: LucideIcon[] = [
  MessageCircle,
  Hand,
  Crown,
  Trophy,
  Layers,
  SkipForward,
  Star,
  Trophy,
];

type Props = {
  open: boolean;
  onClose: () => void;
  entry: GameRulesEntry;
};

export function GameRulesSheet({ open, onClose, entry }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [anims, setAnims] = useState(() => entry.rows.map(() => new Animated.Value(0)));

  useEffect(() => {
    // Recreate row animations when a different rules entry is shown.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync animated values to row count
    setAnims(entry.rows.map(() => new Animated.Value(0)));
  }, [entry.title, entry.rows]);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      anims.forEach((anim) => anim.setValue(0));
      return;
    }
    if (reduceMotion) {
      anims.forEach((anim) => anim.setValue(1));
      return;
    }
    const timers = entry.rows.map((_, index) =>
      setTimeout(() => {
        Animated.spring(anims[index]!, {
          toValue: 1,
          useNativeDriver: true,
          ...motion.spring.sheet,
        }).start();
      }, index * motion.duration.stagger),
    );
    return () => timers.forEach(clearTimeout);
  }, [open, entry.rows, anims, reduceMotion]);

  const accent =
    entry.accent === 'coral'
      ? palette.coral
      : entry.accent === 'teal'
        ? palette.teal
        : palette.gold;
  const accentSoft =
    entry.accent === 'coral'
      ? palette.coralSoft
      : entry.accent === 'teal'
        ? palette.tealSoft
        : '#FFF4D2';

  return (
    <BottomSheet visible={open} onClose={onClose} title="">
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
          <Trophy color={accent} size={28} />
        </View>
        <Text style={styles.title}>{entry.title}</Text>
      </View>
      <View style={styles.rows}>
        {entry.rows.map((row, index) => {
          const Icon = rowIcons[index % rowIcons.length]!;
          const opacity = anims[index] ?? new Animated.Value(1);
          const translateY = opacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
          return (
            <Animated.View
              key={row.title}
              style={[styles.row, { opacity, transform: [{ translateY }] }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: accentSoft }]}>
                <Icon color={accent} size={18} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowBody}>{row.body}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
      <Button label="Got it" variant="gold" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typeScale.h2, color: palette.midnight, textAlign: 'center' },
  rows: { gap: spacing.md, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowIcon: {
    width: minTapTarget,
    height: minTapTarget,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: fontFamily.headingSemi, fontSize: 16, color: palette.midnight },
  rowBody: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20, color: palette.warmGray },
});
