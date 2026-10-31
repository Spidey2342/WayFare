import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeTile, JourneyNode, Screen, ScreenScroll } from '@/components/ui';
import type { BadgeColorToken } from '@/components/ui/BadgeIcon';
import { badges, journeyNodes, levelForXp } from '@/features/journey/progress';
import { useAppStore } from '@/store';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

export default function JourneyScreen() {
  const progress = useAppStore((state) => state.progress);
  const level = levelForXp(progress.xp);
  const weeks = journeyNodes(progress);
  const earned = badges.filter((badge) => progress.badgesEarned.includes(badge.id));

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={[typeScale.caption, { color: palette.goldDeep }]}>Your journey</Text>
        <Text style={[typeScale.h1, { color: palette.ink }]}>
          Level {level.level} · {level.displayTitle}
        </Text>
        <Text style={[typeScale.bodyM, { color: palette.warmGray }]}>
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

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Earned badges</Text>
          <Text style={styles.sectionMeta}>{progress.badgesEarned.length} / 24</Text>
        </View>
        {earned.length === 0 ? (
          <Text style={[typeScale.bodyS, { color: palette.warmGray }]}>
            Badges appear here after you play or complete Learn activities.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewRow}
          >
            {earned.map((badge) => (
              <BadgeTile
                key={badge.id}
                compact
                name={badge.name}
                icon={badge.icon}
                color={badge.color as BadgeColorToken}
                earned
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.grid}>
          {badges.map((badge) => (
            <BadgeTile
              key={badge.id}
              name={badge.name}
              icon={badge.icon}
              color={badge.color as BadgeColorToken}
              earned={progress.badgesEarned.includes(badge.id)}
            />
          ))}
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  path: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typeScale.h3,
    color: palette.ink,
    fontFamily: fontFamily.headingSemi,
  },
  sectionMeta: {
    fontFamily: fontFamily.bodySemi,
    color: palette.warmGray,
    fontSize: 14,
  },
  previewRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
