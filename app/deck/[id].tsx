import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Church, Compass, HandHeart, Heart, Sparkles } from 'lucide-react-native';

import { Button, Chip, DeckCover, Screen } from '@/components/ui';
import { findDeck } from '@/data/catalog';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

const icons = {
  identity: BookOpen,
  courage: Heart,
  serving: HandHeart,
  journey: Compass,
  church: Church,
  wisdom: Sparkles,
} as const;

const breakdown = [
  { label: 'Word', count: 5 },
  { label: 'Question', count: 5 },
  { label: 'Dare', count: 5 },
  { label: 'Challenge', count: 5 },
  { label: 'Testimony', count: 4 },
];

export default function DeckDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const deck = findDeck(id);
  const favorites = useAppStore((state) => state.favoriteDeckIds);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  if (!deck) {
    return (
      <Screen>
        <View style={styles.missing}>
          <Text style={typeScale.h2}>This deck is not on the map.</Text>
          <Button label="Back to decks" onPress={() => router.replace('/decks')} />
        </View>
      </Screen>
    );
  }

  const Icon = icons[deck.icon];
  const loved = favorites.includes(deck.id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <DeckCover
          tall
          title={deck.name}
          series={deck.series}
          colors={deck.colors}
          icon={<Icon color="#fff" size={22} />}
        />
        <View style={styles.actions}>
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
          <Button
            label={loved ? 'Saved' : 'Save'}
            variant="secondary"
            onPress={() => toggleFavorite(deck.id)}
          />
        </View>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>{deck.name}</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          {deck.minutes} mins · {deck.count} cards
        </Text>
        <Chip label={deck.difficulty} tone="teal" />
        <Text style={[typeScale.bodyM, { color: colors.textPrimary }]}>{deck.description}</Text>
        {deck.locked ? <Text style={styles.lock}>{deck.lockReason ?? 'Locked'}</Text> : null}
        <View style={styles.grid}>
          {breakdown.map((item) => (
            <View key={item.label} style={[styles.tile, { backgroundColor: colors.surface }]}>
              <Text style={styles.count}>{item.count}</Text>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Button
          label="Start journey"
          variant="gold"
          disabled={deck.locked}
          onPress={() => router.push({ pathname: '/setup', params: { deckId: deck.id } })}
        />
        <Text style={styles.footer}>Scripture on the cards is from the King James Version.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '30%', borderRadius: radii.lg, padding: spacing.sm, alignItems: 'center' },
  count: { fontFamily: fontFamily.heading, fontSize: 20, color: palette.midnight },
  label: { fontFamily: fontFamily.body, fontSize: 12, color: palette.warmGray },
  lock: { fontFamily: fontFamily.bodySemi, color: palette.coral },
  footer: { fontFamily: fontFamily.body, fontSize: 12, color: palette.warmGray },
  missing: { flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.md },
});
