import { StyleSheet, Text, TextInput, View } from 'react-native';

import { TimerRing } from '@/components/ui';
import type { DebateSide } from '@/features/debate/types';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

type Props = {
  topic: string;
  side: DebateSide;
  secondsLeft: number;
  totalSeconds: number;
  notes?: string;
  onNotesChange?: (text: string) => void;
  readOnlyNotes?: boolean;
};

export function DebatePrepPanel({
  topic,
  side,
  secondsLeft,
  totalSeconds,
  notes,
  onNotesChange,
  readOnlyNotes,
}: Props) {
  const sideColor = side === 'for' ? palette.coral : palette.teal;
  const sideSoft = side === 'for' ? palette.coralSoft : palette.tealSoft;

  return (
    <View style={styles.wrap}>
      <View style={styles.topicCard}>
        <Text style={styles.topicLabel}>Topic</Text>
        <Text style={styles.topicText}>{topic}</Text>
      </View>
      <View style={[styles.sideChip, { backgroundColor: sideSoft, borderColor: sideColor }]}>
        <Text style={styles.sideKicker}>YOUR SIDE</Text>
        <Text style={[styles.sideValue, { color: sideColor }]}>{side.toUpperCase()}</Text>
      </View>
      <View style={styles.timerRow}>
        <TimerRing secondsLeft={secondsLeft} total={totalSeconds} size={96} />
      </View>
      {onNotesChange ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            multiline
            editable={!readOnlyNotes}
            placeholder="Your 3 points…"
            placeholderTextColor={palette.warmGray}
            style={styles.notesInput}
            value={notes}
            onChangeText={onNotesChange}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  topicCard: {
    backgroundColor: palette.midnightRaised,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topicLabel: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: palette.warmGray,
  },
  topicText: { ...typeScale.h3, color: palette.white, lineHeight: 28 },
  sideChip: {
    alignSelf: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  sideKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: palette.warmGray,
  },
  sideValue: { fontFamily: fontFamily.heading, fontSize: 28 },
  timerRow: { alignItems: 'center' },
  notesCard: {
    backgroundColor: palette.midnightRaised,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  notesLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: palette.warmGray,
    letterSpacing: 0.6,
  },
  notesInput: {
    minHeight: 96,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    color: palette.white,
  },
});
