import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import { getCrisisLifeline } from '../../utils/crisisLifelines';

/**
 * sticky-top-banner-chrome — top-of-surface banner / chrome.
 * Spec: ../_meta-canonical/sticky-top-banner-chrome.json
 */
const StickyTopBannerChrome = observer(({
  role = 'header-activity-framing',
  titleOrLabel,
  framingCopy,
  subtitleCopy,
  scopeLabel,
  scopeNavigationControls,
  tipsList,
  leftColumnLabel,
  leftColumnColor = 'rgba(135, 180, 210, 0.55)',
  rightColumnLabel,
  rightColumnColor = 'rgba(220, 130, 130, 0.4)',
  sourceArtifactText,
  primaryLifelineNumber,
  textLineNumber,
  countryCode,
  optionalIllustration,
  beginButtonLabel,
  alwaysVisible = true,
  interactivity = 'non-interactive',
  onScrollPast,
  onBeginTapped,
  onDismissed,
  onScopeChanged,
  onTapToCall,
  onTapToText,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const tipsTimer = useRef(null);

  useEffect(() => {
    if (role === 'dismissable-tips-strip' && tipsList?.length > 1) {
      tipsTimer.current = setInterval(() => {
        setTipIdx(i => (i + 1) % tipsList.length);
      }, 6000);
      return () => clearInterval(tipsTimer.current);
    }
  }, [role, tipsList?.length]);

  if (dismissed) return null;

  // Crisis lifeline banner — country-aware lookup if numbers not explicitly provided
  if (role === 'crisis-lifeline-988-banner') {
    const lifeline = getCrisisLifeline(countryCode);
    const tel = primaryLifelineNumber || lifeline.tel;
    const sms = textLineNumber || lifeline.sms;
    const url = lifeline.url;

    const callPress = () => {
      if (!tel) return;
      onTapToCall && onTapToCall(tel);
      Linking.openURL(`tel:${tel.replace(/\s/g, '')}`).catch(() => {});
    };
    const textPress = () => {
      if (!sms) return;
      onTapToText && onTapToText(sms);
      Linking.openURL(`sms:${sms.replace(/\s/g, '')}`).catch(() => {});
    };
    const urlPress = () => {
      if (!url) return;
      Linking.openURL(url).catch(() => {});
    };

    return (
      <MinkyPanel borderRadius={12} padding={14} paddingTop={14} overlayColor="rgba(220, 130, 130, 0.4)">
        <View style={styles.crisisRow}>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
              In crisis? You're not alone.
            </Text>
            <Text style={[styles.subtitle, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              {lifeline.name} — free, confidential, 24/7.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {tel ? (
              <Pressable onPress={callPress} hitSlop={6}>
                <MinkyPanel borderRadius={20} padding={8} paddingTop={8} overlayColor="rgba(255, 255, 255, 0.45)">
                  <Text style={[styles.crisisAction, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                    📞 Call {tel}
                  </Text>
                </MinkyPanel>
              </Pressable>
            ) : null}
            {sms ? (
              <Pressable onPress={textPress} hitSlop={6}>
                <MinkyPanel borderRadius={20} padding={8} paddingTop={8} overlayColor="rgba(255, 255, 255, 0.45)">
                  <Text style={[styles.crisisAction, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                    💬 Text
                  </Text>
                </MinkyPanel>
              </Pressable>
            ) : null}
            {!tel && !sms && url ? (
              <Pressable onPress={urlPress} hitSlop={6}>
                <MinkyPanel borderRadius={20} padding={8} paddingTop={8} overlayColor="rgba(255, 255, 255, 0.45)">
                  <Text style={[styles.crisisAction, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                    ↗ Find a hotline
                  </Text>
                </MinkyPanel>
              </Pressable>
            ) : null}
          </View>
        </View>
      </MinkyPanel>
    );
  }

  // Tips strip
  if (role === 'dismissable-tips-strip' && tipsList?.length) {
    return (
      <MinkyPanel borderRadius={10} padding={8} paddingTop={8} overlayColor="rgba(112, 68, 199, 0.2)">
        <View style={styles.tipsRow}>
          <Text style={[styles.tipText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
            💡 {tipsList[tipIdx]}
          </Text>
          <Pressable onPress={() => { setDismissed(true); onDismissed && onDismissed(); }}>
            <Text style={styles.dismissX}>×</Text>
          </Pressable>
        </View>
      </MinkyPanel>
    );
  }

  // Comparison column headers
  if (role === 'comparison-column-headers') {
    return (
      <View style={styles.compRow}>
        <View style={[styles.compCell, { backgroundColor: leftColumnColor }]}>
          <Text style={[styles.compLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>{leftColumnLabel}</Text>
        </View>
        <View style={[styles.compCell, { backgroundColor: rightColumnColor }]}>
          <Text style={[styles.compLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>{rightColumnLabel}</Text>
        </View>
      </View>
    );
  }

  // Pinned reference card
  if (role === 'pinned-reference-card') {
    return (
      <MinkyPanel borderRadius={10} padding={10} paddingTop={10} overlayColor="rgba(220, 165, 75, 0.3)">
        <Text style={[styles.pinnedLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
          📌 PINNED
        </Text>
        <Text style={[styles.pinnedText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {sourceArtifactText}
        </Text>
      </MinkyPanel>
    );
  }

  // Scope/date-range header
  if (role === 'scope-date-range-header') {
    return (
      <View style={styles.scopeRow}>
        {scopeNavigationControls?.canPrev ? (
          <Pressable onPress={() => onScopeChanged && onScopeChanged({ direction: 'prev' })}>
            <Text style={styles.scopeArrow}>‹</Text>
          </Pressable>
        ) : null}
        <Text style={[styles.scopeLabelText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {scopeLabel}
        </Text>
        {scopeNavigationControls?.canNext ? (
          <Pressable onPress={() => onScopeChanged && onScopeChanged({ direction: 'next' })}>
            <Text style={styles.scopeArrow}>›</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // Default: header-activity-framing or intro-framing-card
  return (
    <MinkyPanel
      borderRadius={14}
      padding={14}
      paddingTop={14}
      overlayColor="rgba(112, 68, 199, 0.2)"
    >
      <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(18) }]}>
        {titleOrLabel}
      </Text>
      {subtitleCopy ? (
        <Text style={[styles.subtitle, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          {subtitleCopy}
        </Text>
      ) : null}
      {framingCopy ? (
        <Text style={[styles.framing, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {framingCopy}
        </Text>
      ) : null}
      {role === 'intro-framing-card' && beginButtonLabel ? (
        <View style={{ marginTop: 10, alignSelf: 'center' }}>
          <WoolButton variant="purple" size="medium" onPress={() => onBeginTapped && onBeginTapped()}>
            <Text style={[styles.beginLabel, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
              {beginButtonLabel}
            </Text>
          </WoolButton>
        </View>
      ) : null}
    </MinkyPanel>
  );
});

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  framing: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  beginLabel: {
    fontFamily: 'NeedleworkGood',
    fontWeight: '700',
    color: '#403F3E',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  crisisRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  crisisAction: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  tipsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dismissX: {
    fontSize: 22,
    color: 'rgba(69, 67, 66, 0.6)',
    paddingHorizontal: 6,
  },
  compRow: { flexDirection: 'row', gap: 4 },
  compCell: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  compLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pinnedLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pinnedText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    fontStyle: 'italic',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', paddingVertical: 8 },
  scopeArrow: { fontSize: 24, color: '#7044C7', paddingHorizontal: 8 },
  scopeLabelText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default StickyTopBannerChrome;
