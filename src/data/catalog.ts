import { deckSummary, findDeckSummary, getAllDecks, getDeck } from '@/features/decks/repository';

export type DeckSummary = ReturnType<typeof deckSummary>;

export const deckCatalog: readonly DeckSummary[] = getAllDecks().map(deckSummary);

export function findDeck(id: string): DeckSummary | undefined {
  return findDeckSummary(id);
}

export { getDeck, getAllDecks, deckSummary };

export const sampleVerse = {
  text: 'Thy word have I hid in mine heart, that I might not sin against thee.',
  reference: 'Psalm 119:11',
};

export const journeyWeeks = [
  { id: 'w1', label: 'W1', title: 'Identity', state: 'complete' as const },
  { id: 'w2', label: 'W2', title: 'Courage', state: 'complete' as const },
  { id: 'w3', label: 'W3', title: 'Serving', state: 'complete' as const },
  { id: 'w4', label: 'W4', title: 'The Journey', state: 'current' as const },
  {
    id: 'w5',
    label: 'W5',
    title: 'Church History',
    state: 'locked' as const,
    caption: 'Unlocks at Level 5',
  },
];

export type { Deck } from '@/features/decks/deck.schema';
