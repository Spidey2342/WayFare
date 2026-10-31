import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { JourneyNode, Screen } from '@/components/ui';
import { journeyNodes, levelForXp } from '@/features/journey/progress';
import { useAppStore } from '@/store';
import { palette, spacing, typeScale, useTheme } from '@/theme';

export default function JourneyScreen() {
  const { colors } = useTheme();
  const progress = useAppStore((state) => state.progress);
  const level = levelForXp(progress.xp);
  const weeks = journeyNodes(progress);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typeScale.caption, { color: palette.goldDeep }]}>Your journey</Text>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>
          Level {level.level} · {level.displayTitle}
        </Text>
        <Text style={[typeScale.bodyM, { color: colors.textSecondary }]}>
          {progress.streakDays > 0
            ? `${progress.streakDays} day streak. Weeks open in order.`
            : 'Finish a session today to start your streak. Weeks open in order.'}
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
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>
          Earned badges · {progress.badgesEarned.length}/24
        </Text>
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
