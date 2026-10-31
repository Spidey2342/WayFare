import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { DeckTile, EmptyState, ProDeckBanner, Screen, SegmentedTabs } from '@/components/ui';
import { deckCatalog, type DeckSummary } from '@/data/catalog';
import { DeckIconView } from '@/features/decks/deckIcons';
import { useAppStore } from '@/store';
import { palette, spacing, typeScale, useTheme } from '@/theme';

export default function DecksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const favorites = useAppStore((state) => state.favoriteDeckIds);
  type DeckTab = 'all' | 'challenges' | 'favorites';
  type DeckSegment = DeckTab | 'learn';
  const [tab, setTab] = useState<DeckTab>('all');

  const decks = useMemo(() => {
    const playable = deckCatalog.filter((deck) => !deck.isPro);
    if (tab === 'favorites') return playable.filter((deck) => favorites.includes(deck.id));
    if (tab === 'challenges')
      return playable.filter((deck) => deck.id === 'courage' || deck.id === 'serving');
    return playable;
  }, [favorites, tab]);

  const open = (deck: DeckSummary) => {
    if (deck.isPro) {
      router.push('/outing');
      return;
    }
    router.push(`/deck/${deck.id}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Explore Decks</Text>
        <SegmentedTabs<DeckSegment>
          value={tab}
          onChange={(value) => {
            if (value === 'learn') {
              router.push('/learn');
              return;
            }
            setTab(value);
          }}
          tabs={[
            { id: 'all', label: 'All Decks' },
            { id: 'challenges', label: 'Challenges' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'learn', label: 'Learn' },
          ]}
        />
        {decks.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            body="Open a deck and tap the heart. It will wait for you here."
          />
        ) : (
          <View style={styles.grid}>
            {decks.map((deck) => (
              <View key={deck.id} style={styles.cell}>
                <DeckTile
                  title={deck.name}
                  tagline={deck.locked ? (deck.lockReason ?? 'Locked') : deck.tagline}
                  count={deck.count}
                  colors={deck.colors}
                  locked={deck.locked}
                  icon={<DeckIconView name={deck.icon} color={palette.white} size={18} />}
                  onPress={() => open(deck)}
                />
              </View>
            ))}
          </View>
        )}
        <ProDeckBanner onPress={() => router.push('/outing')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { width: '48%' },
});
