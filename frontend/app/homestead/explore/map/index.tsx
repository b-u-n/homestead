import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import SessionStore from '../../../../stores/SessionStore';

export default function MapIndex() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Check for a pending deep link redirect (e.g. user arrived via link, went through auth first)
    const pendingUrl = SessionStore.consumeRedirect();
    if (pendingUrl) {
      const timeout = setTimeout(() => {
        router.replace(pendingUrl);
      }, 0);
      return () => clearTimeout(timeout);
    }

    // Otherwise restore last visited location (web only)
    let lastLocation = 'town-square';

    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('lastMapLocation');
      if (saved && typeof saved === 'string') {
        lastLocation = saved;
      }
    }

    if (typeof lastLocation !== 'string') {
      lastLocation = 'town-square';
    }

    const timeout = setTimeout(() => {
      router.replace(`/homestead/explore/map/${lastLocation}`);
    }, 0);

    return () => clearTimeout(timeout);
  }, [isMounted, router]);

  return null;
}
