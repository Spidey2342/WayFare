import type { Href } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import { GameRulesSheet } from '@/components/game/GameRulesSheet';
import { BackButton, Button } from '@/components/ui';
import { useGameRules } from '@/features/game/useGameRules';
import { spacing } from '@/theme';

type Props = {
  fallback: Href;
  backLabel?: string;
  showRulesOnMount?: boolean;
};

export function useDebateRulesChrome({ fallback, backLabel = 'Exit', showRulesOnMount }: Props) {
  const { entry, open, openRules, openIfFirstTime, closeRules } = useGameRules('debate');

  useEffect(() => {
    if (showRulesOnMount) openIfFirstTime();
  }, [openIfFirstTime, showRulesOnMount]);

  const header = (
    <View style={styles.headerRow}>
      <BackButton label={backLabel} fallback={fallback} />
      <Button label="?" variant="ghost" onPress={openRules} />
    </View>
  );

  const sheet = <GameRulesSheet open={open} onClose={closeRules} entry={entry} />;

  return { header, sheet, openRulesLink: openRules };
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
