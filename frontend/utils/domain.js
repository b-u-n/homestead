import { Platform } from 'react-native';

const getBackendDomain = () => {
  // Check if we're in development or production
  if (__DEV__) {
    // Development: use local IP for testing on physical devices
    return 'http://192.168.0.198:9000';
  }

  // Production web: use same origin (nginx handles proxy)
  if (Platform.OS === 'web') {
    return window.location.origin;
  }

  // Production mobile: use production domain
  return 'https://homestead.heartsbox.com';
};

export const domain = getBackendDomain;
export default domain;