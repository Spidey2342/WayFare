import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BookOpen,
  Flame,
  MessageCircle,
  Sparkles,
  Swords,
  type LucideIcon,
} from 'lucide-react-native';

import {
  cardTypeColors,
  fontFamily,
  palette,
  radii,
  spacing,
  type CardTypeColorKey,
} from '@/theme';

const icons: Record<CardTypeColorKey, LucideIcon> = {
  word: BookOpen,
  question: MessageCircle,
  dare: Flame,
  challenge: Swords,
  testimony: Sparkles,
};

const labels: Record<CardTypeColorKey, string> = {
  word: 'Word',
  question: 'Question',
  dare: 'Dare',
  challenge: 'Challenge',
  testimony: 'Testimony',
};

export function CardFace({
  type,
  title,
  prompt,
  reference,
  body,
  instruction,
  footer,
}: {
  type: CardTypeColorKey;
  title?: string;
  prompt: string;
  reference?: string;
  body?: string;
  instruction?: string;
  footer?: ReactNode;
}) {
  const colors = cardTypeColors[type];
  const Icon = icons[type];
  const ink =
    type === 'word' || type === 'question' || type === 'testimony'
      ? palette.midnight
      : palette.white;
  const muted =
    type === 'word'
      ? '#6B5200'
      : type === 'question' || type === 'testimony'
        ? '#3E4560'
        : 'rgba(255,255,255,0.85)';

  const showKjv = type === 'word' && (body || reference) && !footer;

  return (
    <View style={[styles.card, { backgroundColor: colors.base }]}>
      <View style={styles.badge}>
        <Icon color={colors.base} size={18} strokeWidth={2.4} />
      </View>
      <Text style={[styles.kicker, { color: muted }]}>{labels[type]}</Text>
      {title ? <Text style={[styles.title, { color: ink }]}>{title}</Text> : null}
      {body ? <Text style={[styles.scripture, { color: ink }]}>{body}</Text> : null}
      {reference ? <Text style={[styles.reference, { color: muted }]}>{reference}</Text> : null}
      <Text style={[styles.prompt, { color: ink }]}>{prompt}</Text>
      {instruction ? (
        <Text style={[styles.instruction, { color: muted }]}>{instruction}</Text>
      ) : null}
      {footer}
      {showKjv ? <Text style={[styles.kjv, { color: muted }]}>KJV</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    minHeight: 360,
    padding: spacing.xl,
    justifyContent: 'flex-end',
    gap: spacing.sm,
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  badge: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    lineHeight: 34,
  },
  scripture: {
    fontFamily: fontFamily.scripture,
    fontSize: 18,
    lineHeight: 28,
  },
  prompt: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  reference: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
  },
  instruction: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  kjv: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
});
