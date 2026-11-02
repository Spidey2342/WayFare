import { GameHelpSheet } from '@/components/game/GameHelpSheet';

export const DEBATE_HOW_TO = [
  'Pick a topic and join For or Against.',
  'Prep your points, then argue while the timer runs.',
  'Tap Ready to Vote when your side is done speaking.',
  'Vote for the person who convinced you most (not yourself).',
];

export function DebateHelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <GameHelpSheet open={open} onClose={onClose} lines={DEBATE_HOW_TO} title="How Debate works" />
  );
}
