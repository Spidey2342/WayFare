import { useLocalSearchParams } from 'expo-router';

import { DebateV2FramePreview } from '@/features/debate/audit/DebateV2FramePreview';

export default function DebateV2FrameDevScreen() {
  const params = useLocalSearchParams<{ frame: string }>();
  const frame = typeof params.frame === 'string' ? params.frame : 'D1';
  return <DebateV2FramePreview frameId={frame} />;
}
