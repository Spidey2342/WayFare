import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/ui';
import {
  DebateGoldButton,
  DebateVerdictPicker,
  type DebateSidePlayer,
} from '@/features/debate/components/debateV2Ui';
import { spacing } from '@/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  mvpPlayers: DebateSidePlayer[];
  selected: 'agree' | 'disagree' | 'draw' | null;
  mvpId: string | null;
  onSelect: (side: 'agree' | 'disagree' | 'draw') => void;
  onMvp: (id: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

/** D8 Change verdict — same fields as D6, no extra confirm sheet (spec DECISION #4). */
export function ChangeVerdictSheet({
  open,
  onClose,
  mvpPlayers,
  selected,
  mvpId,
  onSelect,
  onMvp,
  onSubmit,
  submitting,
}: Props) {
  return (
    <BottomSheet visible={open} onClose={onClose} title="Change verdict">
      <View style={styles.wrap}>
        <DebateVerdictPicker
          selected={selected}
          onSelect={onSelect}
          mvpPlayers={mvpPlayers}
          mvpId={mvpId}
          onMvp={onMvp}
        />
        <DebateGoldButton
          label="UPDATE VERDICT"
          disabled={!selected || submitting}
          onPress={onSubmit}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingBottom: 24 },
});
