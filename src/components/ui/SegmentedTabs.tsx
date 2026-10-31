import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamily, minTapTarget, palette, radii, spacing } from '@/theme';

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  accessibilityLabel = 'Sections',
}: {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  accessibilityLabel?: string;
}) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.track}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F4',
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: minTapTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  active: {
    backgroundColor: palette.white,
    shadowColor: palette.midnight,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 13,
    color: palette.warmGray,
  },
  activeLabel: {
    color: palette.midnight,
    fontFamily: fontFamily.bodySemi,
  },
});
