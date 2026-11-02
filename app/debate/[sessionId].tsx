import { useLocalSearchParams } from 'expo-router';

import { OnlineDebateSession } from '@/features/debate/components/OnlineDebateSession';

export default function OnlineDebateScreen() {
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  return <OnlineDebateSession sessionId={sessionId} />;
}
