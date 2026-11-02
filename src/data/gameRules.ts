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
        title: 'A topic appears.',
        body: 'We pick a random topic for your group.',
      },
      {
        title: 'Pick your side.',
        body: 'Tap Agree or Disagree. You can switch until the leader starts.',
      },
      {
        title: 'Talk it out.',
        body: 'Take as long as you need. Be sharp, be kind.',
      },
      {
        title: 'The leader decides.',
        body: 'The leader picks the side that made the stronger case, and the best speaker if they want.',
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
