export interface DeckSummary {
  id: string;
  name: string;
  tagline: string;
  series: string;
  description: string;
  colors: readonly [string, string];
  icon: 'identity' | 'courage' | 'serving' | 'journey' | 'church' | 'wisdom';
  difficulty: string;
  minutes: string;
  count: number;
  locked: boolean;
  lockReason?: string;
  isPro?: boolean;
}

export const deckCatalog: readonly DeckSummary[] = [
  {
    id: 'identity',
    name: 'Identity',
    tagline: 'Who God says you are',
    series: 'Foundations',
    description:
      'A beginner path about being known, loved, and made on purpose. Read a verse, talk honestly, and practice seeing yourself the way God does.',
    colors: ['#A29BFE', '#6C63D9'],
    icon: 'identity',
    difficulty: 'Beginner Friendly',
    minutes: '20-30',
    count: 24,
    locked: false,
  },
  {
    id: 'courage',
    name: 'Courage',
    tagline: 'Brave faith for real life',
    series: 'Foundations',
    description:
      'Practice speaking up with kindness, facing fear with prayer, and trusting that God stays close.',
    colors: ['#FF6B6B', '#E25555'],
    icon: 'courage',
    difficulty: 'Beginner Friendly',
    minutes: '20-30',
    count: 24,
    locked: false,
  },
  {
    id: 'serving',
    name: 'Serving',
    tagline: 'Love that shows up',
    series: 'Foundations',
    description:
      'Small, safe ways to serve the people in the room and the church family you belong to.',
    colors: ['#4D98FF', '#3A7FE0'],
    icon: 'serving',
    difficulty: 'Beginner Friendly',
    minutes: '20-30',
    count: 24,
    locked: false,
  },
  {
    id: 'the-journey',
    name: 'The Journey',
    tagline: 'Walk with Jesus this week',
    series: 'Foundations',
    description:
      'A week of following Jesus one step at a time: Word, honesty, a challenge, and a closing prayer.',
    colors: ['#4ECDC4', '#2FA8A0'],
    icon: 'journey',
    difficulty: 'Beginner Friendly',
    minutes: '20-30',
    count: 24,
    locked: false,
  },
  {
    id: 'church-culture',
    name: 'Church Culture',
    tagline: 'How we belong together',
    series: 'Church History',
    description:
      'Talk about worship, welcome, and the habits of a healthy church. Unlocks as you grow on the journey.',
    colors: ['#1A1C2E', '#3A3D5C'],
    icon: 'church',
    difficulty: 'Growing',
    minutes: '25-35',
    count: 12,
    locked: true,
    lockReason: 'Unlocks at Level 5',
  },
  {
    id: 'wisdom-tales',
    name: 'Wisdom Tales',
    tagline: 'Stories that steady the heart',
    series: 'Wisdom',
    description:
      'Short scenes from Scripture and questions that help a group practice wisdom together.',
    colors: ['#7C8CFF', '#A29BFE'],
    icon: 'wisdom',
    difficulty: 'Beginner Friendly',
    minutes: '20-30',
    count: 12,
    locked: false,
  },
  {
    id: 'outing-mixed',
    name: 'Outing (Mixed)',
    tagline: 'For trips and youth nights',
    series: 'Pro',
    description: 'A mixed deck for outings. This mode is planned for a later update.',
    colors: ['#FFB800', '#1A1C2E'],
    icon: 'journey',
    difficulty: 'Mixed',
    minutes: '30-45',
    count: 12,
    locked: true,
    isPro: true,
    lockReason: 'Coming later',
  },
];

export function findDeck(id: string): DeckSummary | undefined {
  return deckCatalog.find((deck) => deck.id === id);
}

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
