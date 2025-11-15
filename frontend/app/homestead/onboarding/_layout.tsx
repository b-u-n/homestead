import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen name="username" options={{ headerShown: false }} />
      <Stack.Screen name="avatar" options={{ headerShown: false }} />
    </Stack>
  );
}
