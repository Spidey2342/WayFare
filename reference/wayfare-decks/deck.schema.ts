import { z } from 'zod';

export const CardTypeSchema = z.enum(['word', 'question', 'dare', 'challenge', 'testimony']);
export const CardDifficultySchema = z.enum(['light', 'medium', 'deep']);
export const DeckDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-digit hex color like #FFB800');

export const CardSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+-[wqdct]\d{2}$/, 'Card id must look like identity-w01'),
    deckId: z.string().min(1),
    type: CardTypeSchema,
    title: z.string().min(1).max(60).optional(),
    prompt: z.string().min(1).max(400),
    reference: z.string().optional(), // scripture reference, e.g. "Psalm 139:14"
    body: z.string().optional(), // scripture text (KJV, public domain)
    instruction: z.string().max(300).optional(),
    timerSeconds: z.number().int().positive().max(900).optional(),
    points: z.number().int().min(0).max(5),
    difficulty: CardDifficultySchema,
  })
  .superRefine((card, ctx) => {
    if (card.type === 'word' && (!card.reference || !card.body)) {
      ctx.addIssue({ code: 'custom', message: 'Word cards require both reference and body' });
    }
    if (card.type === 'challenge' && !card.timerSeconds) {
      ctx.addIssue({ code: 'custom', message: 'Challenge cards require timerSeconds' });
    }
  });

export const DeckSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    tagline: z.string().min(1),
    series: z.string().min(1),
    description: z.string().min(1),
    coverColor: hexColor,
    coverGradient: z.tuple([hexColor, hexColor]).optional(),
    icon: z.string().min(1), // icon name from the app's icon set
    difficulty: DeckDifficultySchema,
    estMinutes: z.number().int().positive(),
    locked: z.boolean(),
    isPro: z.boolean(),
    badge: z.string().optional(), // e.g. "Popular in Ghana", "New Released", "Pro Deck"
    translation: z.literal('KJV'),
    cards: z.array(CardSchema).min(1),
  })
  .superRefine((deck, ctx) => {
    const seen = new Set<string>();
    deck.cards.forEach((card, i) => {
      if (card.deckId !== deck.id) {
        ctx.addIssue({ code: 'custom', path: ['cards', i, 'deckId'], message: 'deckId must match deck id' });
      }
      if (seen.has(card.id)) {
        ctx.addIssue({ code: 'custom', path: ['cards', i, 'id'], message: `Duplicate card id ${card.id}` });
      }
      seen.add(card.id);
    });
  });

export type Card = z.infer<typeof CardSchema>;
export type Deck = z.infer<typeof DeckSchema>;
export type CardType = z.infer<typeof CardTypeSchema>;

/** Derived, never stored in JSON. */
export const cardCountsByType = (deck: Deck): Record<CardType, number> => {
  const counts: Record<CardType, number> = { word: 0, question: 0, dare: 0, challenge: 0, testimony: 0 };
  deck.cards.forEach((c) => (counts[c.type] += 1));
  return counts;
};
