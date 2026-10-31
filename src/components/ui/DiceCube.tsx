import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { fontFamily, palette, radii } from '@/theme';

const faces = ['·', '··', '···', '····', '·····', '✶'] as const;

export function DiceCube({
  face,
  rolling,
  onPress,
}: {
  face: number;
  rolling: boolean;
  onPress?: () => void;
}) {
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);

  useEffect(() => {
    if (rolling && !reduced) {
      spin.value = withRepeat(withTiming(360, { duration: 420 }), -1, false);
      return;
    }
    spin.value = withTiming(0, { duration: 180 });
  }, [reduced, rolling, spin]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }, { scale: rolling && !reduced ? 0.96 : 1 }],
  }));

  const index = Math.min(faces.length - 1, Math.max(0, face - 1));
  const glyph = faces[index] ?? '·';

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Roll the dice" onPress={onPress}>
      <Animated.View style={[styles.cube, style]}>
        <Text style={styles.pips}>{glyph}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cube: {
    width: 148,
    height: 148,
    borderRadius: radii.card,
    backgroundColor: palette.midnight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  pips: {
    color: palette.gold,
    fontFamily: fontFamily.heading,
    fontSize: 36,
    letterSpacing: 4,
  },
});
