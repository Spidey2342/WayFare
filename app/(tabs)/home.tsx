import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Compass, Share2 } from 'lucide-react-native';

import { Avatar, Button, Chip, DeckTile, QuoteCard, Screen } from '@/components/ui';
import { deckCatalog, sampleVerse } from '@/data/catalog';
import { DeckIconView } from '@/features/decks/deckIcons';
import { journeyNodes, levelForXp } from '@/features/journey/progress';
import { todayLesson } from '@/features/learn/repository';
import { useOnline } from '@/hooks/useOnline';
import { useAppStore } from '@/store';
import { greeting } from '@/utils/greeting';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const name = useAppStore((state) => state.profile.name);
  const progress = useAppStore((state) => state.progress);
  const level = levelForXp(progress.xp);
  const color = useAppStore((state) => state.profile.avatarColor);
  const online = useOnline();
  const quick = deckCatalog.filter((deck) => deck.id === 'identity' || deck.id === 'courage');
  const lesson = todayLesson(progress.completedLessons);
  const nodes = journeyNodes(progress);
  const lessonProgress =
    progress.completedLessons.length === 0 ? 0 : Math.min(1, progress.completedLessons.length / 12);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {!online ? (
          <Text style={styles.offline}>You are offline. Saved decks and Learn still work.</Text>
        ) : null}
        <View style={styles.header}>
          <View>
            <Text style={[styles.hello, { color: colors.textSecondary }]}>{greeting()}</Text>
            <Text style={[styles.name, { color: colors.textPrimary }]}>Hello, {name}!</Text>
          </View>
          <Avatar name={name} color={color} size={48} />
        </View>
        <View style={styles.journey}>
          <View style={styles.journeyTop}>
            <Text style={styles.journeyTitle}>Continue Journey</Text>
            <Chip
              label={progress.streakDays > 0 ? `${progress.streakDays} DAY STREAK` : 'Start here'}
              tone="solidGold"
            />
          </View>
          <View style={styles.path}>
            {nodes.map((node) => (
              <View
                key={node.id}
                style={[
                  styles.node,
                  node.state === 'complete' && styles.nodeDone,
                  node.state === 'current' && styles.nodeOn,
                ]}
              >
                <Text style={[styles.nodeText, node.state === 'current' && styles.nodeTextOn]}>
                  {node.label.replace('W', '')}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.journeyMeta}>
            Level {level.level} · {level.displayTitle} · {progress.completedLessons.length}/12
            lessons
          </Text>
          <View style={styles.lessonBarTrack}>
            <View
              style={[styles.lessonBarFill, { width: `${Math.round(lessonProgress * 100)}%` }]}
            />
          </View>
          <Button
            label="Start playing"
            variant="gold"
            onPress={() => router.push('/deck/identity')}
          />
        </View>
        {lesson ? (
          <View
            style={[styles.today, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[typeScale.caption, { color: palette.goldDeep, letterSpacing: 1 }]}>
              TODAY&apos;S LESSON
            </Text>
            <Text style={[typeScale.h3, { color: colors.textPrimary }]}>{lesson.title}</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
              {lesson.estMinutes} min · {lesson.passage}
            </Text>
            <Button
              label="Open lesson"
              variant="secondary"
              onPress={() => router.push(`/learn/lesson/${lesson.id}`)}
            />
          </View>
        ) : (
          <View
            style={[styles.today, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[typeScale.h3, { color: colors.textPrimary }]}>All lessons complete</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
              Replay a path or try the Bible Quiz.
            </Text>
            <Button label="Learn hub" variant="secondary" onPress={() => router.push('/learn')} />
          </View>
        )}
        <Text style={[styles.section, { color: colors.textPrimary }]}>Quick Decks</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quick}
        >
          {quick.map((deck) => (
            <View key={deck.id} style={styles.quickItem}>
              <DeckTile
                title={deck.name}
                tagline={deck.tagline}
                count={deck.count}
                colors={deck.colors}
                icon={<DeckIconView name={deck.icon} color={palette.white} size={18} />}
                onPress={() => router.push(`/deck/${deck.id}`)}
              />
            </View>
          ))}
        </ScrollView>
        <QuoteCard
          verse={sampleVerse.text}
          reference={sampleVerse.reference}
          onShare={() => router.push('/share')}
        />
        <View style={[styles.community, { backgroundColor: colors.surface }]}>
          <Compass color={palette.goldDeep} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.section, { color: colors.textPrimary }]}>Community</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
              Example stories from youth nights. A live feed comes later.
            </Text>
          </View>
          <Button label="Open" variant="secondary" onPress={() => router.push('/community')} />
        </View>
        <View style={styles.shareRow}>
          <Share2 color={palette.warmGray} size={16} />
          <Text style={styles.shareHint}>Share a moment after you play.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  offline: {
    backgroundColor: palette.midnight,
    color: palette.white,
    fontFamily: fontFamily.bodyMedium,
    padding: spacing.sm,
    borderRadius: radii.md,
    textAlign: 'center',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { ...typeScale.bodyS },
  name: { ...typeScale.h2 },
  journey: {
    backgroundColor: palette.midnight,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  journeyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  journeyTitle: { fontFamily: fontFamily.heading, color: palette.white, fontSize: 20 },
  path: { flexDirection: 'row', gap: spacing.sm },
  node: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#2A2D42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: '#3D4460' },
  nodeOn: { backgroundColor: palette.gold },
  nodeText: { fontFamily: fontFamily.headingSemi, color: '#C9CDD6', fontSize: 14 },
  nodeTextOn: { color: palette.midnight },
  journeyMeta: { fontFamily: fontFamily.body, color: '#C9CDD6' },
  lessonBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2D42',
    overflow: 'hidden',
  },
  lessonBarFill: { height: '100%', backgroundColor: palette.gold },
  today: {
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  section: { ...typeScale.h3 },
  quick: { gap: spacing.sm },
  quickItem: { width: 180 },
  community: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shareHint: { fontFamily: fontFamily.body, color: palette.warmGray, fontSize: 13 },
});
