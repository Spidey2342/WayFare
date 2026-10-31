import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamily, minTapTarget, palette, radii, spacing, useTheme } from '@/theme';

const DOTS = ['#FFB800', '#FF6B6B', '#4ECDC4', '#4D98FF', '#A29BFE', '#1A1C2E'] as const;

export function PlayerRow({
  name,
  color,
  onColorChange,
  onRemove,
}: {
  name: string;
  color: string;
  onColorChange?: (color: string) => void;
  onRemove?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
      <View style={styles.dots}>
        {DOTS.map((dot) => {
          const selected = dot === color;
          return (
            <Pressable
              key={dot}
              accessibilityRole="button"
              accessibilityLabel={`Color ${dot}`}
              accessibilityState={{ selected }}
              hitSlop={10}
              onPress={() => onColorChange?.(dot)}
              style={styles.dotHit}
            >
              <View style={[styles.dot, { backgroundColor: dot }, selected && styles.selected]} />
            </Pressable>
          );
        })}
      </View>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name}`}
          onPress={onRemove}
        >
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: { width: 36, height: 36, borderRadius: 12 },
  name: { fontFamily: fontFamily.bodySemi, fontSize: 16, flex: 1 },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dotHit: { width: 28, height: minTapTarget, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8 },
  selected: { borderWidth: 2, borderColor: palette.midnight },
  remove: {
    fontFamily: fontFamily.bodySemi,
    color: palette.coral,
    minHeight: minTapTarget,
    textAlignVertical: 'center',
  },
});
