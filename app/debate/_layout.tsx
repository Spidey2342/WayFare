import { Stack } from 'expo-router';

export default function DebateLayout() {
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
