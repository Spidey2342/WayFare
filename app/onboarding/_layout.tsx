import { Stack } from 'expo-router';

export default function GuidedOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { flex: 1 },
      }}
    />
  );
}
