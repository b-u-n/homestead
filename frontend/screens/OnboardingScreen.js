import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Image, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import VaporwaveButton from '../components/VaporwaveButton';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import AuthStore from '../stores/AuthStore';
import SessionStore from '../stores/SessionStore';
import WebSocketService from '../services/websocket';
import domain from '../utils/domain';

// Helper for web redirect
const webRedirect = (url) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = url;
  }
};

const OnboardingScreen = observer(() => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Handle OAuth callback on web
  const [handledToken, setHandledToken] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !handledToken) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        console.error('OAuth error:', error);
        // Clear the URL params
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      if (token) {
        setHandledToken(true);
        try {
          // Decode JWT to get sessionId and accountId
          const payload = JSON.parse(atob(token.split('.')[1]));
          const { accountId, sessionId } = payload;

          // Update SessionStore with the new session and account
          SessionStore.sessionId = sessionId;
          SessionStore.accountId = accountId;

          // Store token in AuthStore
          AuthStore.token = token;
          AuthStore.isAuthenticated = true;
          AuthStore.persist();

          // Connect websocket
          WebSocketService.connect();

          // Clear URL params
          window.history.replaceState({}, '', window.location.pathname);

          // Load account by ID (not session) and route based on whether they have username/avatar
          fetch(`${domain()}/api/accounts/${accountId}`)
            .then(res => res.json())
            .then(data => {
              const account = data.account;
              console.log('OAuth callback - loaded account:', account);
              console.log('userData:', account?.userData);

              // Update SessionStore with account data
              SessionStore.accountData = account;

              if (account?.userData?.username && account?.userData?.avatar) {
                console.log('Returning user - redirecting to map');
                // Update AuthStore with user data
                AuthStore.setUser({
                  id: account._id,
                  sessionId: sessionId,
                  username: account.userData.username,
                  avatar: account.userData.avatar,
                  avatarData: account.userData.avatarData,
                }, token);
                // User has completed onboarding, go to map (index will restore last location)
                router.push('/homestead/explore/map');
              } else {
                console.log('New user - redirecting to onboarding');
                // Still set basic auth info so session is persisted for onboarding
                AuthStore.setUser({
                  id: account._id,
                  sessionId: sessionId,
                }, token);
                // New user, go to onboarding
                router.push('/homestead/onboarding/username');
              }
            })
            .catch(err => {
              console.error('Error loading account:', err);
              router.push('/homestead/onboarding/username');
            });
        } catch (e) {
          console.error('Error processing OAuth token:', e);
        }
      }
    }
  }, [router, handledToken]);

  // Check if already authenticated on mount
  useEffect(() => {
    if (AuthStore.isInitialized && AuthStore.isAuthenticated && AuthStore.user) {
      // Only redirect to map if they have completed onboarding (have username and avatar)
      if (AuthStore.user.username && AuthStore.user.avatar) {
        // Delay to ensure layout is mounted
        const timer = setTimeout(() => {
          WebSocketService.connect();
          // Go to map index which will restore last location
          router.replace('/homestead/explore/map');
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [AuthStore.isAuthenticated, AuthStore.isInitialized, router]);

  useEffect(() => {
    // Handle deep link from auth callback
    const handleAuthCallback = (url) => {
      const params = new URLSearchParams(url.split('?')[1]);
      const token = params.get('token');
      const userStr = params.get('user');
      const error = params.get('error');

      if (error) {
        Alert.alert('Authentication Failed', 'Please try again');
        return;
      }

      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          AuthStore.setUser(user, token);
          WebSocketService.connect();
          router.push('/homestead/onboarding/username');
        } catch (e) {
          Alert.alert('Error', 'Failed to process authentication');
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthCallback(url);
    });

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthCallback(url);
    });

    return () => subscription?.remove();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const authUrl = `${domain()}/auth/google`;

    if (Platform.OS === 'web') {
      // Simple redirect on web
      webRedirect(authUrl);
      return;
    }

    // Use WebBrowser for native
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'com.heartsbox.homestead://'
      );

      if (result.type === 'cancel') {
        Alert.alert('Authentication cancelled');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    setIsLoading(true);
    const authUrl = `${domain()}/auth/discord`;

    if (Platform.OS === 'web') {
      // Simple redirect on web
      webRedirect(authUrl);
      return;
    }

    // Use WebBrowser for native
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'com.heartsbox.homestead://'
      );

      if (result.type === 'cancel') {
        Alert.alert('Authentication cancelled');
      }
    } catch (error) {
      console.error('Discord Sign-In error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipForNow = () => {
    // For development purposes
    router.push('/homestead/onboarding/username');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content} accessibilityRole="main">
          <View style={styles.headerContainer}>
          <Text
            style={[
              styles.title,
              Platform.OS === 'web' && {
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
              }
            ]}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            homestead
          </Text>
          <Text
            style={[
              styles.byHeartsbox,
              Platform.OS === 'web' && {
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
              }
            ]}
          >
            by heartsbox
          </Text>
          <Text
            style={[
              styles.subtitle,
              Platform.OS === 'web' && {
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
              }
            ]}
          >
            sign in to save your progress
          </Text>
        </View>

        <Image
          source={require('../assets/images/middle-graphic.png')}
          style={styles.middleGraphic}
          resizeMode="contain"
        />

        <View style={styles.buttonContainer}>
          <VaporwaveButton
            title={isLoading ? 'Connecting...' : 'Google Sign-in'}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            variant="green"
            style={styles.googleButton}
            accessibilityLabel={isLoading ? 'Connecting to Google' : 'Sign in with Google'}
            accessibilityHint="Authenticate with your Google account to save progress"
          />

          <VaporwaveButton
            title={isLoading ? 'Connecting...' : 'Discord Sign-in'}
            onPress={handleDiscordSignIn}
            disabled={isLoading}
            variant="blurple"
            style={styles.discordButton}
            accessibilityLabel={isLoading ? 'Connecting to Discord' : 'Sign in with Discord'}
            accessibilityHint="Authenticate with your Discord account to save progress"
          />

          <VaporwaveButton
            title="Skip & Explore"
            onPress={handleSkipForNow}
            variant="candy"
            style={styles.skipButton}
            accessibilityLabel="Skip authentication"
            accessibilityHint="Continue without signing in"
          />
        </View>

        <Text style={styles.footerText}></Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
    backgroundColor: 'transparent',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  middleGraphic: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  title: {
    fontFamily: Typography.fonts.header,
    fontSize: 42,
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.cottagecore.greyDark,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
  byHeartsbox: {
    fontFamily: Typography.fonts.header,
    fontSize: 28,
    marginBottom: 24,
    textAlign: 'center',
    color: Colors.cottagecore.greyDark,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Typography.fonts.subheader,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.cottagecore.greyDark,
    lineHeight: 26,
    paddingHorizontal: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'stretch',
    gap: 16,
  },
  googleButton: {
    width: '100%',
  },
  discordButton: {
    width: '100%',
  },
  skipButton: {
    width: '100%',
  },
  footerText: {
    marginTop: 40,
  },
});

export default OnboardingScreen;