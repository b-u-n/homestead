import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import AuthStore from '../../../stores/AuthStore';

const ExploreLayout = observer(() => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const needsAuth = AuthStore.isInitialized &&
    (!AuthStore.isAuthenticated || !AuthStore.user?.username || !AuthStore.user?.avatar);

  useEffect(() => {
    if (!isMounted || !AuthStore.isInitialized) return;

    if (needsAuth) {
      const timeout = setTimeout(() => {
        router.replace('/');
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isMounted, AuthStore.isInitialized, needsAuth]);

  // Always render the navigator so Expo Router doesn't complain,
  // but the redirect will kick in on the next tick if not authed
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen name="map" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
    </Stack>
  );
});

export default ExploreLayout;
