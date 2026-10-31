import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Chip, DeckCover, Screen } from '@/components/ui';
import { findDeck } from '@/data/catalog';
import { DeckIconView } from '@/features/decks/deckIcons';
import { useAppStore } from '@/store';
import { cardTypeColors, fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

const typeLabels = {
  word: 'Word',
  question: 'Question',
  dare: 'Dare',
  challenge: 'Challenge',
  testimony: 'Testimony',
} as const;

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

  const loved = favorites.includes(deck.id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <DeckCover
          tall
          title={deck.name}
          series={deck.series}
          colors={deck.colors}
          icon={<DeckIconView name={deck.icon} color={palette.white} size={22} />}
        />
        {deck.badge ? <Chip label={deck.badge} tone="blue" /> : null}
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
          {deck.estMinutes} mins · {deck.count} cards
        </Text>
        <Chip label={deck.difficultyLabel} tone="teal" />
        <Text style={[typeScale.bodyM, { color: colors.textPrimary }]}>{deck.description}</Text>
        {deck.locked ? <Text style={styles.lock}>{deck.lockReason ?? 'Locked'}</Text> : null}
        <View style={styles.grid}>
          {(Object.keys(typeLabels) as (keyof typeof typeLabels)[]).map((type) => (
            <View key={type} style={[styles.tile, { backgroundColor: cardTypeColors[type].soft }]}>
              <Text style={[styles.count, { color: cardTypeColors[type].ink }]}>
                {deck.countsByType[type]}
              </Text>
              <Text style={[styles.label, { color: cardTypeColors[type].ink }]}>
                {typeLabels[type]}
              </Text>
            </View>
          ))}
        </View>
        <Button
          label="Start journey"
          variant="gold"
          disabled={deck.locked}
          onPress={() => router.push({ pathname: '/setup', params: { deckId: deck.id } })}
        />
        <Text style={styles.footer}>Scripture on the cards is from the {deck.translation}.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  missing: { flex: 1, padding: spacing.xl, gap: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '47%', borderRadius: radii.lg, padding: spacing.sm, alignItems: 'center' },
  count: { fontFamily: fontFamily.heading, fontSize: 20 },
  label: { fontFamily: fontFamily.bodySemi, fontSize: 12 },
  lock: { fontFamily: fontFamily.bodySemi, color: palette.coral },
  footer: { ...typeScale.caption, color: palette.warmGray, textAlign: 'center' },
});
