import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DebateTopicCard, debateUi } from '@/features/debate/components/debateV2Ui';
import type { DebateSide } from '@/features/debate/types';
import { fontFamily, minTapTarget, palette, radii, spacing } from '@/theme';

type Props = {
  topic: string;
  playerName: string;
  onPick: (side: DebateSide) => void;
};

export function PassSidePickScreen({ topic, playerName, onPick }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>CHOOSE YOUR SIDE</Text>
      <Text style={styles.lead}>Only {playerName} should see this screen.</Text>
      <DebateTopicCard text={topic} compact />
      <View style={styles.row}>
        {(['agree', 'disagree'] as const).map((side) => {
          const tint = side === 'agree' ? debateUi.agree : debateUi.disagree;
          return (
            <Pressable
              key={side}
              accessibilityRole="button"
              onPress={() => onPick(side)}
              style={[styles.sideBtn, { borderColor: tint }]}
            >
              <Text style={[styles.sideLabel, { color: tint }]}>
                {side === 'agree' ? 'AGREE' : 'DISAGREE'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  kicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 2,
    color: palette.white,
    textAlign: 'center',
  },
  lead: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: debateUi.muted,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  sideBtn: {
    flex: 1,
    minHeight: minTapTarget + 32,
    borderRadius: radii.lg,
    borderWidth: 2,
    backgroundColor: debateUi.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLabel: { fontFamily: fontFamily.headingSemi, fontSize: 16, letterSpacing: 0.5 },
});
