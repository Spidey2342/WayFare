import { Redirect, type Href } from 'expo-router';

import { useSessionStore } from '@/features/game/sessionStore';

export default function PlayTab() {
  const session = useSessionStore((state) => state.session);
  if (session && session.status === 'active') {
    return <Redirect href={{ pathname: '/game/[sessionId]', params: { sessionId: session.id } }} />;
  }
  return <Redirect href={'/games' as Href} />;
}
