import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import ErrorContainer from '../components/ErrorContainer';
import SessionStore from '../stores/SessionStore';
import TiledBackground from '../components/TiledBackground';
import { Colors } from '../constants/colors';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'ChubbyTrail': require('../assets/fonts/ChubbyTrail.ttf'),
    'PWDottedFont': require('../assets/fonts/PWDottedFont.ttf'),
    'Comfortaa': require('../assets/fonts/Comfortaa-Regular.ttf'),
    'Comfortaa-Bold': require('../assets/fonts/Comfortaa-Bold.ttf'),
    'Comfortaa-Light': require('../assets/fonts/Comfortaa-Light.ttf'),
    'BleakSegments': require('../assets/fonts/bleakseg.ttf'),
    'DashDot': require('../assets/fonts/dashdot.ttf'),
    'HackSlash': require('../assets/fonts/hackslsh.ttf'),
    'Jagged': require('../assets/fonts/jagged.ttf'),
    'NeedleworkGood': require('../assets/fonts/Needlework Good.ttf'),
    'NeedleworkPerfect': require('../assets/fonts/Needlework Perfect.ttf'),
    'TextCircle': require('../assets/fonts/TextCircle-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Initialize session when app starts
      SessionStore.initSession();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TiledBackground>
      {Platform.OS === 'web' && (
        <style>{`
          /* Override React Navigation default backgrounds */
          [style*="rgb(242, 242, 242)"] {
            background-color: transparent !important;
          }
        `}</style>
      )}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: 'transparent',
            borderBottomWidth: 2,
            borderBottomColor: Colors.vaporwave.cyan,
            shadowColor: Colors.vaporwave.pink,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          headerTintColor: Colors.vaporwave.cyan,
          headerTitleStyle: {
            fontFamily: 'ChubbyTrail',
            fontSize: 24,
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
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="homestead" options={{ headerShown: false }} />
        <Stack.Screen name="inventory" options={{ headerShown: false }} />
        <Stack.Screen name="debug" options={{ headerShown: false }} />
      </Stack>
      <ErrorContainer />
    </TiledBackground>
  );
}
