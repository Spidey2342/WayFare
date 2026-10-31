import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamily, minTapTarget, palette, radii, spacing } from '@/theme';

const reactions = ['Praying', 'Praise', 'Encouraged', 'Amen'] as const;
export type ReactionName = (typeof reactions)[number];

export function ReactionBar({
  counts,
  onReact,
}: {
  counts: Partial<Record<ReactionName, number>>;
  onReact?: (name: ReactionName) => void;
}) {
  return (
    <View style={styles.row}>
      {reactions.map((name) => (
        <Pressable
          key={name}
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${counts[name] ?? 0}`}
          onPress={() => onReact?.(name)}
          style={styles.chip}
        >
          <Text style={styles.label}>
            {name} {counts[name] ?? 0}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minHeight: minTapTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fontFamily.bodyMedium, color: palette.midnight, fontSize: 13 },
});
