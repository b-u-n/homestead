import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import GradientBackground from '../components/GradientBackground';
import WoolButton from '../components/WoolButton';
import { Colors } from '../constants/colors';

const LandingScreen = observer(({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('Onboarding');
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.content} accessibilityRole="main">
        <Text 
          style={styles.title}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          Welcome to Homestead
        </Text>
        <Text 
          style={styles.subtitle}
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
});

export default LandingScreen;