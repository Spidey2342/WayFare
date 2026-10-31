import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { palette } from '@/theme';

const colors = [
  palette.gold,
  palette.coral,
  palette.teal,
  palette.blue,
  palette.purple,
  palette.white,
];

export function Confetti({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: `piece-${index}`,
        left: (index * 17) % 100,
        delay: (index % 6) * 40,
        color: colors[index % colors.length] ?? palette.gold,
        spin: index % 2 === 0 ? 80 : -80,
      })),
    [],
  );

  if (!active || reduced) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece) => (
        <Piece key={piece.id} {...piece} />
      ))}
    </View>
  );
}

function Piece({
  left,
  delay,
  color,
  spin,
}: {
  left: number;
  delay: number;
  color: string;
  spin: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 1400 }));
  }, [delay, progress]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * 520 }, { rotate: `${progress.value * spin}deg` }],
    opacity: 1 - progress.value,
  }));
  return (
    <Animated.View style={[styles.piece, { left: `${left}%`, backgroundColor: color }, style]} />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 14,
    borderRadius: 2,
  },
});
