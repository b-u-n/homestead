import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export default function MapIndex() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Get last visited location from localStorage (web only)
    let lastLocation = 'town-square';

    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('lastMapLocation');
      if (saved && typeof saved === 'string') {
        lastLocation = saved;
      }
    }

    // Ensure lastLocation is a string
    if (typeof lastLocation !== 'string') {
      lastLocation = 'town-square';
    }

    // Small delay to ensure router is ready
    const timeout = setTimeout(() => {
      router.replace(`/homestead/explore/map/${lastLocation}`);
    }, 0);

    return () => clearTimeout(timeout);
  }, [isMounted, router]);

  return null;
}
