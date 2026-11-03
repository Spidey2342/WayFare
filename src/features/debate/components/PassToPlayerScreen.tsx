import { StyleSheet, Text, View } from 'react-native';
import { Hand } from 'lucide-react-native';

import { Avatar } from '@/components/ui';
import { DebateGoldButton, debateUi } from '@/features/debate/components/debateV2Ui';
import { avatarColorForKey } from '@/data/avatarPresets';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

type Props = {
  playerName: string;
  avatarKey?: string;
  onConfirm: () => void;
};

export function PassToPlayerScreen({ playerName, avatarKey, onConfirm }: Props) {
  const firstName = playerName.split(' ')[0] ?? playerName;
  return (
    <View style={styles.wrap}>
      <View style={styles.avatarRing}>
        <Avatar
          name={playerName}
          color={avatarColorForKey(avatarKey ?? playerName)}
          size={120}
          ring
        />
        <View style={styles.handBadge}>
          <Hand color={debateUi.ink} size={18} />
        </View>
      </View>
      <Text style={styles.title}>Pass the phone to {firstName}</Text>
      <Text style={styles.hint}>
        It&apos;s time to pick a side. Hand the device over to {playerName} to continue.
      </Text>
      <DebateGoldButton label={`I'M ${firstName.toUpperCase()}`} onPress={onConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  avatarRing: { position: 'relative' },
  handBadge: {
    position: 'absolute',
    bottom: 4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: debateUi.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typeScale.h2, color: palette.white, textAlign: 'center' },
  hint: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: debateUi.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
});
