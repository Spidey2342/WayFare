import { BottomSheet } from '@/components/ui';
import { DebateSoftTimerRow } from '@/features/debate/components/debateV2Ui';

type Props = {
  visible: boolean;
  selected: 3 | 5 | 10 | null;
  onClose: () => void;
  onSelect: (minutes: 3 | 5 | 10 | null) => void;
};

export function DebateSoftTimerSheet({ visible, selected, onClose, onSelect }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add soft timer">
      <DebateSoftTimerRow
        selected={selected}
        onSelect={(minutes) => {
          onSelect(minutes);
          onClose();
        }}
      />
    </BottomSheet>
  );
}
