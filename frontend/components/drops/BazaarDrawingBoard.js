import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';

const BazaarDrawingBoard = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.introTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(18),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Welcome to the Drawing Board!
          </Text>

          <Text style={[styles.introText, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            lineHeight: FontSettingsStore.getScaledSpacing(20),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            This is where you can contribute art to Homestead. Here's how it works:
          </Text>

          <View style={styles.stepList}>
            <Text style={[styles.stepText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(20),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              1. Submit your art — you can propose updates to existing platform assets or create something entirely new
            </Text>
            <Text style={[styles.stepText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(20),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              2. A moderator will review your submission manually — please be patient, this is done by real people
            </Text>
            <Text style={[styles.stepText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(20),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              3. Approved items go to the Bazaar shop where other users can buy them with hearts
            </Text>
            <Text style={[styles.stepText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(20),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              4. You earn hearts every time someone purchases your work!
            </Text>
          </View>

          <Text style={[styles.noteText, {
            fontSize: FontSettingsStore.getScaledFontSize(12),
            lineHeight: FontSettingsStore.getScaledSpacing(18),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Not everything will be approved for the platform itself — but your work always has a home in the shop and earns hearts when purchased. There are no limits on submissions and no deadlines. Work on as many as you want simultaneously. You'll get notifications for all feedback, approvals, and purchases — and you can revise anytime.
          </Text>
        </MinkyPanel>

        <View style={styles.actionButtons}>
          <WoolButton variant="purple" size="medium" onPress={() => onComplete({ action: 'browseAssets' })}>
            Browse Platform Assets
          </WoolButton>

          <WoolButton variant="blue" size="medium" onPress={() => onComplete({ action: 'submitNew' })}>
            Submit New Art
          </WoolButton>
        </View>

        <View style={styles.secondaryActions}>
          <WoolButton variant="secondary" size="small" onPress={() => onComplete({ action: 'openMySubmissions' })}>
            My Submissions
          </WoolButton>
          <WoolButton variant="secondary" size="small" onPress={() => onComplete({ action: 'openStyleGuide' })}>
            Style Guide
          </WoolButton>
        </View>
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  introTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  introText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  stepList: {
    gap: 10,
    marginBottom: 16,
  },
  stepText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    paddingLeft: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  noteText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontStyle: 'italic',
    opacity: 0.9,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

export default BazaarDrawingBoard;
