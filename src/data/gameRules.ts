export type GameRulesId = 'debate' | 'card-game';

export type GameRulesEntry = {
  id: GameRulesId;
  title: string;
  accent: 'coral' | 'gold' | 'teal';
  rows: { title: string; body: string }[];
};

export const gameRules: Record<GameRulesId, GameRulesEntry> = {
  debate: {
    id: 'debate',
    title: 'How Debate Works',
    accent: 'coral',
    rows: [
      {
        title: 'Pick a side.',
        body: "You'll be given FOR or AGAINST. You might not agree with it, and that's the fun.",
      },
      {
        title: 'Make your case.',
        body: 'Argue your side before the timer ends. Be sharp, be kind.',
      },
      {
        title: 'Vote.',
        body: "Pick the player who convinced you most. You can't vote for yourself.",
      },
      {
        title: 'Win.',
        body: 'The side with the most votes wins. The top player is the MVP.',
      },
    ],
  },
  'card-game': {
    id: 'card-game',
    title: 'How to Play',
    accent: 'gold',
    rows: [
      {
        title: 'Draw a card.',
        body: 'Tap the deck to flip a card.',
      },
      {
        title: 'Do it.',
        body: 'Read the verse, answer the question, take the dare, or play the challenge.',
      },
      {
        title: 'Skip once.',
        body: 'You can skip one card each round.',
      },
      {
        title: 'Score.',
        body: 'Finish a card to earn points. The most points wins.',
      },
    ],
  },
};

export function rulesForGame(id: GameRulesId): GameRulesEntry {
  return gameRules[id];
}
