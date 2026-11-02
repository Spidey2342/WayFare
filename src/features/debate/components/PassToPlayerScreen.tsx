import { StyleSheet, Text, View } from 'react-native';
import { Smartphone } from 'lucide-react-native';

import { Avatar, Button } from '@/components/ui';
import { avatarColorForKey } from '@/data/avatarPresets';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

type Props = {
  playerName: string;
  avatarKey?: string;
  onConfirm: () => void;
};

export function PassToPlayerScreen({ playerName, avatarKey, onConfirm }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Smartphone color={palette.teal} size={32} />
      </View>
      <Text style={styles.title}>Pass to {playerName}</Text>
      <Avatar name={playerName} color={avatarColorForKey(avatarKey ?? playerName)} size={88} ring />
      <Text style={styles.hint}>Only {playerName} should see the next screen.</Text>
      <Button label={`I'm ${playerName}`} variant="gold" onPress={onConfirm} />
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typeScale.h1, color: palette.white, textAlign: 'center' },
  hint: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.warmGray,
    textAlign: 'center',
    maxWidth: 320,
  },
});
