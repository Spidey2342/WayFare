import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Compass, Heart, Share2 } from 'lucide-react-native';

import { Avatar, Button, Chip, DeckTile, QuoteCard, Screen } from '@/components/ui';
import { deckCatalog, sampleVerse } from '@/data/catalog';
import { useOnline } from '@/hooks/useOnline';
import { useAppStore } from '@/store';
import { greeting } from '@/utils/greeting';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const name = useAppStore((state) => state.profile.name);
  const color = useAppStore((state) => state.profile.avatarColor);
  const online = useOnline();
  const quick = deckCatalog.filter((deck) => deck.id === 'identity' || deck.id === 'courage');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {!online ? (
          <Text style={styles.offline}>You are offline. Saved decks still play.</Text>
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
            <Chip label="Start here" tone="solidGold" />
          </View>
          <View style={styles.path}>
            {['1', '2', '3', '4'].map((node, index) => (
              <View key={node} style={[styles.node, index === 0 && styles.nodeOn]}>
                <Text style={styles.nodeText}>{node}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.journeyMeta}>Level 1 · Seeker</Text>
          <Button
            label="Start playing"
            variant="gold"
            onPress={() => router.push('/deck/identity')}
          />
        </View>
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
                icon={
                  deck.id === 'identity' ? (
                    <BookOpen color="#fff" size={18} />
                  ) : (
                    <Heart color="#fff" size={18} />
                  )
                }
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
  nodeOn: { backgroundColor: palette.gold },
  nodeText: { fontFamily: fontFamily.headingSemi, color: palette.midnight },
  journeyMeta: { fontFamily: fontFamily.body, color: '#C9CDD6' },
  section: { ...typeScale.h3 },
  quick: { gap: spacing.sm },
  quickItem: { width: 180 },
  community: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shareHint: { fontFamily: fontFamily.body, color: palette.warmGray, fontSize: 13 },
});
