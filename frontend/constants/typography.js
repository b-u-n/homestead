// Global typography configuration for consistent font usage across the app
export const Typography = {
  fonts: {
    header: 'SuperStitch',
    subheader: 'PWDottedFont', // Note: Only supports uppercase text
    body: 'Comfortaa',
    bodyBold: 'Comfortaa-Bold',
    bodyLight: 'Comfortaa-Light',
    bleakSegments: 'BleakSegments',
    dashDot: 'DashDot',
    hackSlash: 'HackSlash',
    jagged: 'Jagged',
    needleworkGood: 'NeedleworkGood',
    needleworkPerfect: 'NeedleworkPerfect',
    textCircle: 'TextCircle',
    superStitch: 'SuperStitch',
  },

  sizes: {
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    subheader: 18,
    body: 16,
    caption: 14,
  },

  // Pre-configured text styles
  styles: {
    h1: {
      fontFamily: 'SuperStitch',
      fontSize: 32,
      letterSpacing: 1.2,
      opacity: 0.8,
    },
    h2: {
      fontFamily: 'SuperStitch',
      fontSize: 28,
      letterSpacing: 1,
      opacity: 0.8,
    },
    h3: {
      fontFamily: 'SuperStitch',
      fontSize: 24,
      letterSpacing: 0.8,
      opacity: 0.8,
    },
    h4: {
      fontFamily: 'SuperStitch',
      fontSize: 20,
      letterSpacing: 0.6,
      opacity: 0.8,
    },
    subheader: {
      fontFamily: 'PWDottedFont',
      fontSize: 18,
      letterSpacing: 0.5,
      textTransform: 'uppercase', // PWDottedFont only supports uppercase
    },
    body: {
      fontFamily: 'Comfortaa',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    caption: {
      fontFamily: 'Comfortaa-Light',
      fontSize: 14,
      letterSpacing: 0.2,
    },
  },
};
