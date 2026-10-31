import type { EngineCard } from '@/features/game/types';

export const previewCards: EngineCard[] = [
  {
    id: 'identity-w1',
    deckId: 'identity',
    type: 'word',
    title: 'Fearfully and Wonderfully Made',
    prompt:
      'Explain the verse in your own words. In team mode, the other team says if it was clear.',
    reference: 'Psalm 139:14',
    body: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
    points: 2,
  },
  {
    id: 'identity-q1',
    deckId: 'identity',
    type: 'question',
    title: 'Known',
    prompt:
      'When do you feel most sure that God knows you? One sentence is enough, and you may skip.',
    reference: 'Psalm 139:1',
    points: 1,
  },
  {
    id: 'identity-d1',
    deckId: 'identity',
    type: 'dare',
    title: 'A kind word',
    prompt: 'Give a sincere compliment to the person on your right.',
    points: 2,
  },
  {
    id: 'identity-c1',
    deckId: 'identity',
    type: 'challenge',
    title: 'Say it together',
    prompt: 'As a team, put Psalm 23:1 into your own words in thirty seconds.',
    reference: 'Psalm 23:1',
    points: 3,
  },
  {
    id: 'identity-t1',
    deckId: 'identity',
    type: 'testimony',
    title: 'A quiet faithfulness',
    prompt:
      'Share one short story of God being faithful, or pass with kindness. The group may pray one sentence.',
    points: 1,
  },
  {
    id: 'identity-q2',
    deckId: 'identity',
    type: 'question',
    title: 'Belonging',
    prompt: 'Who in this circle helps you remember that you belong to Jesus?',
    points: 1,
  },
  {
    id: 'identity-d2',
    deckId: 'identity',
    type: 'dare',
    title: 'Blessing',
    prompt: 'Pray a one-sentence blessing over the person on your left.',
    points: 2,
  },
  {
    id: 'identity-w2',
    deckId: 'identity',
    type: 'word',
    title: 'Hidden in the heart',
    prompt: 'Read the verse, then say one way you want to remember it this week.',
    reference: 'Psalm 119:11',
    body: 'Thy word have I hid in mine heart, that I might not sin against thee.',
    points: 2,
  },
];
