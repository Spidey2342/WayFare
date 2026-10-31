import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Chip, DiceCube, Screen } from '@/components/ui';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

const results = ['TRUTH', 'DARE', 'WILD', 'BLESS'] as const;

export default function DiceScreen() {
  const router = useRouter();
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(1);
  const [result, setResult] = useState<(typeof results)[number] | null>(null);

  const roll = () => {
    setRolling(true);
    setResult(null);
    const next = 1 + Math.floor(Math.random() * 6);
    setTimeout(() => {
      setFace(next);
      setRolling(false);
      setResult(results[(next - 1) % results.length] ?? 'DARE');
    }, 700);
  };

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.title}>Roll for your destiny</Text>
        <Text style={styles.sub}>Tap the cube. Truth, dare, wild, or a blessing.</Text>
        <DiceCube face={face} rolling={rolling} onPress={roll} />
        {result ? <Chip label="Result" tone="gold" /> : null}
        <Text style={styles.result}>{result ?? ' '}</Text>
        <Button label="Continue" disabled={!result} onPress={() => router.push('/game/preview')} />
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
