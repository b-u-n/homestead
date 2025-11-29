import { Stack } from 'expo-router';
import { useEffect, useState, createContext } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, Dimensions, StyleSheet } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import ErrorContainer from '../components/ErrorContainer';
import SessionStore from '../stores/SessionStore';
import TiledBackground from '../components/TiledBackground';
import { Colors } from '../constants/colors';

// Design width - the app is designed for this width
const DESIGN_WIDTH = 600;

// Scale context for child components
export const ScaleContext = createContext({ scale: 1, designWidth: DESIGN_WIDTH });

const transparentTheme = {
  dark: false,
  colors: {
    primary: Colors.vaporwave.cyan,
    background: 'transparent',
    card: 'transparent',
    text: Colors.text.primary,
    border: 'transparent',
    notification: Colors.vaporwave.pink,
  },
  fonts: {
    regular: { fontFamily: 'Comfortaa', fontWeight: '400' as const },
    medium: { fontFamily: 'Comfortaa', fontWeight: '500' as const },
    bold: { fontFamily: 'Comfortaa-Bold', fontWeight: '700' as const },
    heavy: { fontFamily: 'Comfortaa-Bold', fontWeight: '900' as const },
  },
};

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

  // Calculate scale factor for mobile
  const getScale = () => {
    if (screenWidth >= DESIGN_WIDTH) return 1;
    return screenWidth / DESIGN_WIDTH;
  };

  const scale = getScale();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

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
    <ThemeProvider value={transparentTheme}>
      <ScaleContext.Provider value={{ scale, designWidth: DESIGN_WIDTH }}>
        <TiledBackground>
          <View style={styles.rootContainer}>
            <View style={[
              styles.scaledContent,
              scale < 1 && {
                transform: [{ scale }],
                width: DESIGN_WIDTH,
                minHeight: screenHeight / scale,
                transformOrigin: 'top left',
              }
            ]}>
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
            </View>
          </View>
        </TiledBackground>
      </ScaleContext.Provider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  scaledContent: {
    flex: 1,
  },
});
