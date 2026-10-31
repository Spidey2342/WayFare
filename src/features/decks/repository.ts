import churchCulture from '@/data/decks/church-culture.json';
import courage from '@/data/decks/courage.json';
import identity from '@/data/decks/identity.json';
import outingMixed from '@/data/decks/outing-mixed.json';
import serving from '@/data/decks/serving.json';
import theJourney from '@/data/decks/the-journey.json';
import wisdomTales from '@/data/decks/wisdom-tales.json';
import type { EngineCard } from '@/features/game/types';

import { cardCountsByType, DeckSchema, type Card, type Deck } from './deck.schema';
import { repairDeckRaw } from './repairDeckRaw';

const rawDecks = [identity, courage, serving, theJourney, churchCulture, wisdomTales, outingMixed];

function parseDeck(raw: unknown): Deck {
  const repaired = repairDeckRaw(raw as Record<string, unknown>);
  return DeckSchema.parse(repaired);
}

export const decks: Deck[] = rawDecks.map(parseDeck);

const deckById = new Map(decks.map((deck) => [deck.id, deck]));

export function getDeck(id: string): Deck | undefined {
  return deckById.get(id);
}

export function getAllDecks(): Deck[] {
  return decks;
}

export function deckSummary(deck: Deck) {
  const counts = cardCountsByType(deck);
  const gradient = deck.coverGradient ?? ([deck.coverColor, deck.coverColor] as [string, string]);
  return {
    id: deck.id,
    name: deck.name,
    tagline: deck.tagline,
    series: deck.series,
    description: deck.description,
    colors: gradient,
    coverColor: deck.coverColor,
    icon: deck.icon,
    difficulty: deck.difficulty,
    difficultyLabel:
      deck.difficulty === 'beginner'
        ? 'Beginner Friendly'
        : deck.difficulty === 'intermediate'
          ? 'Growing'
          : 'Advanced',
    minutes: `${deck.estMinutes}`,
    estMinutes: deck.estMinutes,
    count: deck.cards.length,
    locked: deck.locked,
    isPro: deck.isPro,
    badge: deck.badge,
    lockReason: deck.locked
      ? deck.isPro
        ? 'Pro deck'
        : deck.id === 'church-culture'
          ? 'Unlocks at Level 5'
          : 'Complete earlier paths first'
      : undefined,
    countsByType: counts,
    translation: deck.translation,
  };
}

export function findDeckSummary(id: string) {
  const deck = getDeck(id);
  return deck ? deckSummary(deck) : undefined;
}

export function toEngineCards(deck: Deck): EngineCard[] {
  return deck.cards.map((card: Card) => ({
    id: card.id,
    deckId: card.deckId,
    type: card.type,
    prompt: card.prompt,
    title: card.title,
    reference: card.reference,
    body: card.body,
    instruction: card.instruction,
    points: card.points,
    timerSeconds: card.timerSeconds,
    difficulty: card.difficulty,
  }));
}

export function allEngineCards(): EngineCard[] {
  return decks.flatMap(toEngineCards);
}
