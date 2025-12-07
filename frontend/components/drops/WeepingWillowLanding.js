import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import MinkyButton, { Text } from '../MinkyButton';

const weepingWillowImage = require('../../assets/images/weeping-willow.png');

/**
 * WeepingWillow Landing Drop
 * Shows two buttons - "Ask for help" and "Help others"
 */
const WeepingWillowLanding = ({
  input,
  context,
  onComplete,
  canGoBack
}) => {
  const handleView = () => {
    onComplete({ action: 'view' });
  };

  const handleCreate = () => {
    onComplete({ action: 'create' });
  };

  return (
    <View style={styles.container}>
      {/* Ask for help button */}
      <MinkyButton
        onPress={handleCreate}
        variant="purple"
        accessibilityLabel="Ask for help"
      >
        <View style={styles.buttonContent}>
          <Image
            source={weepingWillowImage}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
          <Text>Ask for help</Text>
        </View>
      </MinkyButton>

      {/* Help others button */}
      <MinkyButton
        onPress={handleView}
        variant="secondary"
        accessibilityLabel="Help others"
      >
        <View style={styles.buttonContent}>
          <Image
            source={weepingWillowImage}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
          <Text>Help others</Text>
        </View>
      </MinkyButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    gap: 20,
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  buttonIcon: {
    width: 32,
    height: 32,
  },
});

export default WeepingWillowLanding;
