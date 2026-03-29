import { Platform } from 'react-native';

const getBackendDomain = () => {
  // Check if we're in development or production
  if (__DEV__) {
    // Development: on web, use the same host the page was loaded from;
    // on mobile devices, use the local network IP
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `http://${window.location.hostname}:9000`;
    }
    return 'http://192.168.0.199:9000';
  }

  // Production web: use same origin (nginx handles proxy)
  if (Platform.OS === 'web') {
    return window.location.origin;
  }

  // Production mobile: use production domain
  return 'https://homestead.heartsbox.com';
};

/**
 * Resolve an avatar URL to a full URL using the current backend domain.
 * Handles relative paths and strips hardcoded dev/prod domains.
 */
export const resolveAvatarUrl = (url) => {
  if (!url) return null;
  // Already a relative path - prepend current domain
  if (url.startsWith('/')) return `${getBackendDomain()}${url}`;
  // Strip any hardcoded domain and re-resolve with current domain
  const apiIndex = url.indexOf('/api/avatars/');
  if (apiIndex !== -1) return `${getBackendDomain()}${url.slice(apiIndex)}`;
  // Rewrite GCS public URLs to go through backend proxy
  const gcsMatch = url.match(/storage\.googleapis\.com\/[^/]+\/(bazaar_[^?#]+)/);
  if (gcsMatch) return `${getBackendDomain()}/api/bazaar-content/${gcsMatch[1]}`;
  return url;
};

export const domain = getBackendDomain;
export default domain;