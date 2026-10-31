import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { JourneyNode, Screen } from '@/components/ui';
import { palette, spacing, typeScale, useTheme } from '@/theme';

const weeks = [
  { id: 'w1', label: 'W1', state: 'current' as const },
  { id: 'w2', label: 'W2', state: 'locked' as const },
  { id: 'w3', label: 'W3', state: 'locked' as const },
  { id: 'w4', label: 'W4', state: 'locked' as const },
  { id: 'w5', label: 'W5', state: 'locked' as const, caption: 'Unlocks at Level 5' },
];

export default function JourneyScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typeScale.caption, { color: palette.goldDeep }]}>Your journey</Text>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Level 1 · Seeker</Text>
        <Text style={[typeScale.bodyM, { color: colors.textSecondary }]}>
          Finish a session today to start your streak. Weeks open in order.
        </Text>
        <View style={styles.path}>
          {weeks.map((week) => (
            <JourneyNode
              key={week.id}
              label={week.label}
              state={week.state}
              caption={week.caption}
            />
          ))}
        </View>
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Earned badges · 0/24</Text>
        <Text style={[typeScale.bodyS, { color: colors.textSecondary }]}>
          Badges appear here after you play. Church History unlocks at level 5.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  path: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
