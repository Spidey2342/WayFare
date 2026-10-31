import { createElement } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import {
  BookOpen,
  Calendar,
  Circle,
  Cross,
  Flame,
  Footprints,
  HandHeart,
  Heart,
  HelpCircle,
  Landmark,
  Leaf,
  MessageCircle,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Swords,
  Trophy,
  Users,
} from 'lucide-react-native';

const map: Record<string, LucideIcon> = {
  footprints: Footprints,
  'book-open': BookOpen,
  flame: Flame,
  smartphone: Smartphone,
  users: Users,
  dove: Heart,
  landmark: Landmark,
  heart: Heart,
  calendar: Calendar,
  'map-pin': Footprints,
  'message-circle': MessageCircle,
  star: Star,
  swords: Swords,
  sparkles: Sparkles,
  'hand-heart': HandHeart,
  circle: Circle,
  'layers-3': BookOpen,
  leaf: Leaf,
  cross: Cross,
  sunflower: Sun,
  compass: Trophy,
  sun: Sun,
};

export function badgeIcon(name: string): LucideIcon {
  return map[name] ?? HelpCircle;
}

export function BadgeIconView({
  name,
  color,
  size,
  strokeWidth,
}: {
  name: string;
  color: string;
  size: number;
  strokeWidth?: number;
}) {
  return createElement(map[name] ?? HelpCircle, { color, size, strokeWidth });
}
