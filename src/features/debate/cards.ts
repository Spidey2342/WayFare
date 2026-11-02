import { getDeck, toEngineCards } from '@/features/decks/repository';

export function debateStatementsForDeck(deckId: string, limit = 8) {
  const deck = getDeck(deckId);
  if (!deck) return [];
  return toEngineCards(deck)
    .filter((card) => card.type === 'question' || card.type === 'challenge')
    .slice(0, limit)
    .map((card) => ({ cardId: card.id, prompt: card.prompt }));
}
