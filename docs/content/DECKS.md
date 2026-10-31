# Wayfare deck content

Seven deck files, 132 cards total. Drop these into `src/data/decks/` and the schema into `src/features/decks/deck.schema.ts`.

| Deck           | Cards | Locked (per design) | Notes                   |
| -------------- | ----- | ------------------- | ----------------------- |
| identity       | 24    | no                  | Foundation Series       |
| courage        | 24    | no                  | Strength Series         |
| serving        | 24    | yes                 | Heart Series            |
| the-journey    | 24    | yes                 | Pilgrim Series          |
| church-culture | 12    | no                  | badge: Popular in Ghana |
| wisdom-tales   | 12    | no                  | badge: New Released     |
| outing-mixed   | 12    | yes                 | isPro                   |

## Rules baked into the data

- Scripture text is **KJV** (public domain). Do not paste NIV/ESV/NLT text.
- Points: word 2, question 1, dare 2, challenge 3, testimony 1 (testimony is the group bonus).
- Word cards always have `reference` and `body`. Challenge cards always have `timerSeconds`.
- `cardCountsByType` is derived in code, never stored.

## Adding a card

1. Append an object to the deck's `cards` array.
2. Use the next id in sequence, e.g. `identity-w06`. Prefix letters: w word, q question, d dare, c challenge, t testimony.
3. Run the content validation test. The build fails if anything is invalid.

## Icons

`icon` values are names from your icon set: fingerprint, shield, hand-heart, compass, church, book-open, bus.
If one doesn't exist in the chosen set, map it in a single `deckIcons.ts` file.
