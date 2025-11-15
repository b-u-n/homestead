import { Stack } from 'expo-router';
import { useEffect } from 'react';
import ErrorContainer from '../components/ErrorContainer';
import SessionStore from '../stores/SessionStore';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  useEffect(() => {
    // Initialize session when app starts
    SessionStore.initSession();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background.primary,
            borderBottomWidth: 2,
            borderBottomColor: Colors.vaporwave.cyan,
            shadowColor: Colors.vaporwave.pink,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          headerTintColor: Colors.vaporwave.cyan,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 20,
            color: Colors.text.primary,
            textShadowColor: Colors.vaporwave.purple,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          },
          headerBackTitleStyle: {
            color: Colors.vaporwave.cyan,
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: Colors.background.primary,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="username" options={{ headerShown: false }} />
        <Stack.Screen name="avatar" options={{ headerShown: false }} />
        <Stack.Screen name="town" options={{ headerShown: false }} />
        <Stack.Screen name="room" options={{ headerShown: false }} />
        <Stack.Screen name="inventory" options={{ headerShown: false }} />
        <Stack.Screen name="canvas" options={{ headerShown: false }} />
        <Stack.Screen name="debug" options={{ headerShown: false }} />
      </Stack>
      <ErrorContainer />
    </>
  );
}
