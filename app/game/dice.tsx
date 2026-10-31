import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Chip, DiceCube, Screen } from '@/components/ui';
import { useSessionStore } from '@/features/game/sessionStore';
import type { DiceFace } from '@/features/game/types';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

const labels: Record<DiceFace, string> = {
  truth: 'TRUTH',
  dare: 'DARE',
  wild: 'WILD',
  bless: 'BLESS',
};

const cubeFace: Record<DiceFace, number> = {
  truth: 1,
  dare: 3,
  wild: 5,
  bless: 6,
};

export default function DiceScreen() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const lastDice = useSessionStore((state) => state.lastDice);
  const rollStore = useSessionStore((state) => state.roll);
  const draw = useSessionStore((state) => state.draw);
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(1);

  const roll = () => {
    if (!session || session.status !== 'active' || session.currentCardId) return;
    setRolling(true);
    const next = rollStore();
    setTimeout(() => {
      setFace(cubeFace[next]);
      setRolling(false);
    }, 700);
  };

  const continuePlay = () => {
    if (!session) {
      router.replace('/setup');
      return;
    }
    if (lastDice !== 'bless') draw();
    router.replace({ pathname: '/game/[sessionId]', params: { sessionId: session.id } });
  };

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.title}>Roll for your destiny</Text>
        <Text style={styles.sub}>Tap the cube. Truth, dare, wild, or a blessing.</Text>
        <DiceCube face={face} rolling={rolling} onPress={roll} />
        {lastDice && !rolling ? <Chip label="Result" tone="gold" /> : null}
        <Text style={styles.result}>{lastDice && !rolling ? labels[lastDice] : ' '}</Text>
        <Button label="Continue" disabled={!lastDice || rolling} onPress={continuePlay} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, gap: spacing.md, alignItems: 'center' },
  title: { ...typeScale.h1, color: palette.midnight, textAlign: 'center' },
  sub: { ...typeScale.bodyM, color: palette.warmGray, textAlign: 'center' },
  result: {
    fontFamily: fontFamily.display,
    fontSize: 40,
    color: palette.midnight,
    letterSpacing: 2,
  },
});
