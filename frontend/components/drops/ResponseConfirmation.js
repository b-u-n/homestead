import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';

/**
 * ResponseConfirmation Drop (Overlay)
 * Thanks the user for responding to a post
 * Displays hearts earned if first responder
 */
const ResponseConfirmation = observer(({
  input,
  context,
  onComplete,
}) => {
  // Get hearts info from the respond drop's output
  const respondOutput = input['weepingWillow:respond'] || input['wishingWell:respond'] || {};
  const heartsAwarded = respondOutput.heartsAwarded || 0;

  const handleContinue = () => {
    onComplete({ action: 'continue' });
  };

  return (
    <View style={styles.container}>
      <MinkyPanel
        overlayColor="rgba(112, 68, 199, 0.15)"
        borderRadius={12}
        padding={20}
        paddingTop={20}
      >
        <Text style={styles.title}>Response Sent!</Text>

        <Text style={styles.message}>
          Thank you for being there for someone. Your kindness makes a difference.
        </Text>

        {heartsAwarded > 0 && (
          <View style={styles.heartsContainer}>
            <Text style={styles.heartsText}>
              You earned {heartsAwarded} {heartsAwarded === 1 ? 'heart' : 'hearts'}!
            </Text>
            <Text style={styles.heartsEmoji}>
              {'❤️'.repeat(Math.min(heartsAwarded, 5))}
            </Text>
          </View>
        )}
      </MinkyPanel>

      <WoolButton
        title="CONTINUE"
        onPress={handleContinue}
        variant="primary"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    lineHeight: 22,
    textAlign: 'center',
  },
  heartsContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  heartsText: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textAlign: 'center',
  },
  heartsEmoji: {
    fontSize: 24,
  },
});

export default ResponseConfirmation;
