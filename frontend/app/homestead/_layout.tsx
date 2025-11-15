import { Stack } from 'expo-router';

export default function HomesteadLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="explore" options={{ headerShown: false }} />
    </Stack>
  );
}
