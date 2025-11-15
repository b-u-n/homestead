import { Platform } from 'react-native';
import domain from '../utils/domain';

const getGoogleClientId = () => {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  } else if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  } else {
    // Web fallback
    return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  }
};

export const GOOGLE_CONFIG = {
  clientId: getGoogleClientId(),
  scopes: ['openid', 'profile', 'email'],
  // For Expo AuthSession, we use their proxy service
  // The custom scheme is only for deep linking AFTER auth
  scheme: 'com.heartsbox.homestead',
};

export default GOOGLE_CONFIG;