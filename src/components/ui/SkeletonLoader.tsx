import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { radii } from '@/theme';

export function SkeletonLoader({ height = 88 }: { height?: number }) {
  const pulse = useSharedValue(0.4);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[styles.block, { height }, style]} />;
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    borderRadius: radii.lg,
    backgroundColor: '#E4E6ED',
  },
});
