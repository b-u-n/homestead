import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';

/**
 * PostConfirmation Drop
 * Confirms post submission and encourages helping others
 */
const PostConfirmation = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  const handleHelpOthers = () => {
    onComplete({ action: 'list' });
  };

  const handleDone = () => {
    onComplete({ action: 'done' });
  };

  return (
    <View style={styles.container}>
      <MinkyPanel
        overlayColor="rgba(112, 68, 199, 0.15)"
        borderRadius={12}
        padding={20}
        paddingTop={20}
      >
        <Text style={styles.title}>We hear you.</Text>

        <Text style={styles.message}>
          Thank you for sharing what's on your mind. We'll deliver your message to a listener when they connect.
        </Text>

        <Text style={styles.message}>
          Wait times can vary, but we promise someone will be there for you.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.encouragementTitle}>While you wait...</Text>

        <Text style={styles.message}>
          Responding to others is a wonderful way to lift your spirits. When you support someone else, your post gets noticed faster too.
        </Text>

        <Text style={styles.message}>
          Sometimes the best way to feel better is to help someone else feel heard.
        </Text>
      </MinkyPanel>

      {/* Primary action - Help others */}
      <WoolButton
        title="HELP OTHERS"
        onPress={handleHelpOthers}
        variant="primary"
      />

      {/* Secondary action - Done */}
      <WoolButton
        title="I'LL WAIT"
        onPress={handleDone}
        variant="secondary"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
    marginVertical: 12,
  },
  encouragementTitle: {
    fontSize: 16,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#403F3E',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default PostConfirmation;
