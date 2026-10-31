import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamily, minTapTarget, palette, spacing } from '@/theme';

export const ROUND_STEPS = [5, 10, 15, 20, 25] as const;
export type RoundMinutes = (typeof ROUND_STEPS)[number];

export function RoundSlider({
  value,
  onChange,
}: {
  value: RoundMinutes;
  onChange: (value: RoundMinutes) => void;
}) {
  const [width, setWidth] = useState(1);
  const index = Math.max(0, ROUND_STEPS.indexOf(value));
  const ratio = index / (ROUND_STEPS.length - 1);

  const selectAt = (x: number) => {
    const nextIndex = Math.round((x / width) * (ROUND_STEPS.length - 1));
    const bounded = Math.min(ROUND_STEPS.length - 1, Math.max(0, nextIndex));
    const next = ROUND_STEPS[bounded];
    if (next !== undefined) onChange(next);
  };

  return (
    <View>
      <Text style={styles.label}>{value} MINS</Text>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel="Round length"
        accessibilityValue={{ min: 5, max: 25, now: value, text: `${value} minutes` }}
        accessibilityActions={[
          { name: 'increment', label: 'Longer round' },
          { name: 'decrement', label: 'Shorter round' },
        ]}
        onAccessibilityAction={(event) => {
          const direction = event.nativeEvent.actionName === 'increment' ? 1 : -1;
          const next = ROUND_STEPS[index + direction];
          if (next !== undefined) onChange(next);
        }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onPress={(event) => selectAt(event.nativeEvent.locationX)}
        style={styles.hit}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: Math.max(0, ratio * width - 14) }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fontFamily.heading,
    fontSize: 14,
    letterSpacing: 1,
    color: palette.midnight,
    marginBottom: spacing.sm,
  },
  hit: {
    minHeight: minTapTarget,
    justifyContent: 'center',
  },
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#E6E8EE',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: palette.gold,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.white,
    borderWidth: 4,
    borderColor: palette.gold,
    top: 8,
  },
});
