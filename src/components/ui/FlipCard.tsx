import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

export function FlipCard({
  flipped,
  front,
  back,
}: {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
}) {
  const reduced = useReducedMotion();
  const rotation = useSharedValue(flipped ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(flipped ? 180 : 0, { duration: reduced ? 1 : 520 });
  }, [flipped, reduced, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    opacity: rotation.value <= 90 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value + 180}deg` }],
    opacity: rotation.value > 90 ? 1 : 0,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.face, frontStyle]}>{front}</Animated.View>
      <Animated.View style={[styles.face, styles.back, backStyle]}>{back}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 380 },
  face: { backfaceVisibility: 'hidden' },
  back: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
