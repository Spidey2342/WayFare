import { Redirect } from 'expo-router';

import { useAppStore } from '@/store';

export default function Index() {
  const hydrated = useAppStore((state) => state.hydrated);
  const onboarded = useAppStore((state) => state.onboarded);
  if (!hydrated) return null;
  return <Redirect href={onboarded ? '/home' : '/auth/welcome'} />;
}
