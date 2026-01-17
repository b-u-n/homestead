import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import GradientBackground from '../components/GradientBackground';
import WoolButton from '../components/WoolButton';
import { Colors } from '../constants/colors';
import FontSettingsStore from '../stores/FontSettingsStore';

const LandingScreen = observer(({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('Onboarding');
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.content} accessibilityRole="main">
        <Text
          style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(42), color: FontSettingsStore.getFontColor(Colors.text.primary) }]}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          Welcome to Homestead
        </Text>
        <Text
          style={[styles.subtitle, { fontSize: FontSettingsStore.getScaledFontSize(18), lineHeight: FontSettingsStore.getScaledFontSize(24), color: FontSettingsStore.getFontColor(Colors.light.primary) }]}
          accessibilityRole="text"
        >
          Explore virtual spaces, create your own rooms, and connect with others
        </Text>

        <WoolButton
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          style={styles.button}
          accessibilityHint="Navigate to the onboarding screen"
        />

        {/* Accessibility Mode Toggle */}
        <View style={styles.accessibilityToggle}>
          <Text style={[styles.accessibilityLabel, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor(Colors.light.primary) }]}>
            Accessibility Mode
          </Text>
          <Switch
            value={FontSettingsStore.accessibilityMode}
            onValueChange={(value) => FontSettingsStore.setAccessibilityMode(value)}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: Colors.vaporwave.cyan }}
            thumbColor={FontSettingsStore.accessibilityMode ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="rgba(255,255,255,0.3)"
            style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}
          />
        </View>
      </View>
    </GradientBackground>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.text.primary,
    textShadowColor: Colors.vaporwave.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 60,
    color: Colors.light.primary,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 20,
  },
  accessibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  accessibilityLabel: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
});

export default LandingScreen;