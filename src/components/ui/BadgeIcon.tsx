import { createElement } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import {
  Award,
  BookOpen,
  CalendarCheck,
  Circle,
  Compass,
  Cross,
  Feather,
  Flame,
  Footprints,
  HandHeart,
  Heart,
  Landmark,
  Layers3,
  Leaf,
  MessageCircleQuestion,
  Mountain,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Swords,
  Users,
} from 'lucide-react-native';

import { DoveIcon } from '@/components/icons/DoveIcon';
import { normalizeBadgeIconName } from '@/features/journey/badgeIconNames';
import { palette } from '@/theme';

export type BadgeColorToken = 'gold' | 'coral' | 'teal' | 'blue' | 'purple';

const tintByToken: Record<BadgeColorToken, string> = {
  gold: palette.gold,
  coral: palette.coral,
  teal: palette.teal,
  blue: palette.blue,
  purple: palette.purple,
};

const softByToken: Record<BadgeColorToken, string> = {
  gold: '#FFF4D2',
  coral: palette.coralSoft,
  teal: palette.tealSoft,
  blue: palette.blueSoft,
  purple: palette.purpleSoft,
};

const iconMap: Record<string, LucideIcon | 'dove'> = {
  footprints: Footprints,
  'book-open': BookOpen,
  flame: Flame,
  smartphone: Smartphone,
  users: Users,
  shield: Shield,
  dove: 'dove',
  landmark: Landmark,
  heart: Heart,
  'calendar-check': CalendarCheck,
  calendar: CalendarCheck,
  route: Mountain,
  mountain: Mountain,
  'map-pin': Mountain,
  'message-circle-question': MessageCircleQuestion,
  'message-circle': MessageCircleQuestion,
  feather: Feather,
  'hand-heart': HandHeart,
  star: Star,
  swords: Swords,
  sparkles: Sparkles,
  circle: Circle,
  'layers-3': Layers3,
  leaf: Leaf,
  cross: Cross,
  sun: Sun,
  compass: Compass,
  award: Award,
};

export function badgeTintColor(token: BadgeColorToken): string {
  return tintByToken[token] ?? palette.gold;
}

export function badgeSoftColor(token: BadgeColorToken): string {
  return softByToken[token] ?? softByToken.gold;
}

export function BadgeIcon({
  name,
  colorToken,
  color,
  size = 22,
  strokeWidth = 2.2,
}: {
  name: string;
  colorToken?: BadgeColorToken;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const resolved = normalizeBadgeIconName(name);
  const tint = color ?? (colorToken ? badgeTintColor(colorToken) : palette.gold);
  const entry = iconMap[resolved] ?? Award;

  if (entry === 'dove') {
    return <DoveIcon color={tint} size={size} strokeWidth={strokeWidth} />;
  }

  return createElement(entry, { color: tint, size, strokeWidth });
}
