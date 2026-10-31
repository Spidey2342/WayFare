import { createElement } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import {
  BookOpen,
  Bus,
  Church,
  Compass,
  Fingerprint,
  HandHeart,
  HelpCircle,
  Shield,
} from 'lucide-react-native';

const deckIconMap: Record<string, LucideIcon> = {
  fingerprint: Fingerprint,
  shield: Shield,
  'hand-heart': HandHeart,
  compass: Compass,
  church: Church,
  'book-open': BookOpen,
  bus: Bus,
};

export function deckIcon(name: string): LucideIcon {
  return deckIconMap[name] ?? HelpCircle;
}

export type DeckIconName = keyof typeof deckIconMap;

export function DeckIconView({ name, color, size }: { name: string; color: string; size: number }) {
  return createElement(deckIconMap[name] ?? HelpCircle, { color, size });
}
