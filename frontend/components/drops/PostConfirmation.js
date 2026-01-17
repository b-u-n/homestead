import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import FontSettingsStore from '../../stores/FontSettingsStore';

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
        <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(20), color: FontSettingsStore.getFontColor('#403F3E') }]}>We hear you.</Text>

        <Text style={[styles.message, { fontSize: FontSettingsStore.getScaledFontSize(14), lineHeight: FontSettingsStore.getScaledFontSize(22), color: FontSettingsStore.getFontColor('#403F3E') }]}>
          Thank you for sharing what's on your mind. We'll deliver your message to a listener when they connect.
        </Text>

        <Text style={[styles.message, { fontSize: FontSettingsStore.getScaledFontSize(14), lineHeight: FontSettingsStore.getScaledFontSize(22), color: FontSettingsStore.getFontColor('#403F3E') }]}>
          Wait times can vary, but we promise someone will be there for you.
        </Text>

        <View style={styles.divider} />

        <Text style={[styles.encouragementTitle, { fontSize: FontSettingsStore.getScaledFontSize(16), color: FontSettingsStore.getFontColor('#403F3E') }]}>While you wait...</Text>

        <Text style={[styles.message, { fontSize: FontSettingsStore.getScaledFontSize(14), lineHeight: FontSettingsStore.getScaledFontSize(22), color: FontSettingsStore.getFontColor('#403F3E') }]}>
          Responding to others is a wonderful way to lift your spirits. When you support someone else, your post gets noticed faster too.
        </Text>

        <Text style={[styles.message, { fontSize: FontSettingsStore.getScaledFontSize(14), lineHeight: FontSettingsStore.getScaledFontSize(22), color: FontSettingsStore.getFontColor('#403F3E') }]}>
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
