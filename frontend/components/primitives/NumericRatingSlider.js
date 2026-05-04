import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, PanResponder } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import StitchedFillBar from '../StitchedFillBar';

/**
 * numeric-rating-slider — content rating slider (NOT mood).
 * Spec: ../_meta-canonical/numeric-rating-slider.json
 *
 * Renders as a row of value pills when (max - min)/step <= 10.
 * Renders as a continuous track + thumb otherwise.
 */
const NumericRatingSlider = observer(({
  scaleMin = 0,
  scaleMax = 10,
  stepSize = 1,
  currentValue = 0,
  labelCopy,
  tickLabels,
  emojiAnchors,
  numericReadoutVisible = true,
  disabled = false,
  interactable = true,
  domainId,
  dimensionLabel,
  colorTheme = 'blue',
  onValueChanged,
  onValueCommitted,
}) => {
  const tickCount = Math.round((scaleMax - scaleMin) / stepSize) + 1;
  const usePills = tickCount <= 11;
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  const themeColor = {
    blue: 'rgba(135, 180, 210, 0.55)',
    green: 'rgba(160, 200, 140, 0.55)',
    neutral: 'rgba(112, 68, 199, 0.2)',
    'gradient-track': 'rgba(135, 180, 210, 0.55)',
  }[colorTheme] || 'rgba(135, 180, 210, 0.55)';

  const interactableRef = useRef(interactable);
  interactableRef.current = interactable;

  const setValue = (v, commit = false) => {
    if (!interactableRef.current) return;
    const clamped = Math.max(scaleMin, Math.min(scaleMax, v));
    const stepped = Math.round((clamped - scaleMin) / stepSize) * stepSize + scaleMin;
    onValueChanged && onValueChanged(stepped);
    if (commit) onValueCommitted && onValueCommitted(stepped);
  };

  // Compact read-only render — used when this primitive is rendered as a
  // carry-over display. Single row: [label] [slim track] [value]. No thumb
  // (dot is misleading on a tiny read-only bar). Author passes `labelCopy`
  // inline so no separate named-point-row is needed above.
  if (!interactable) {
    const safeMax = scaleMax > scaleMin ? scaleMax : scaleMin + 1;
    const pctRO = Math.max(0, Math.min(1, (currentValue - scaleMin) / (safeMax - scaleMin)));
    const inlineLabel = labelCopy || dimensionLabel;
    const showSlash = scaleMax === 100 || scaleMax === 10;
    return (
      <View style={styles.readOnlyRow}>
        {inlineLabel ? (
          <Text
            style={[styles.readOnlyLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}
            numberOfLines={1}
          >
            {inlineLabel}
          </Text>
        ) : null}
        <View style={styles.readOnlyTrack}>
          <StitchedFillBar progress={pctRO} height={8} borderRadius={4} fillColor={themeColor} />
        </View>
        <Text style={[styles.readOnlyReadout, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          {currentValue}{showSlash ? `/${scaleMax}` : ''}
        </Text>
      </View>
    );
  }

  if (usePills) {
    const ticks = [];
    for (let i = 0; i < tickCount; i++) ticks.push(scaleMin + i * stepSize);

    return (
      <View style={styles.wrapper}>
        {(labelCopy || dimensionLabel) && (
          <View style={styles.labelRow}>
            <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
              {labelCopy || dimensionLabel}
            </Text>
            {numericReadoutVisible && (
              <Text style={[styles.readout, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
                {currentValue}
              </Text>
            )}
          </View>
        )}
        <View style={styles.pillRow}>
          {ticks.map((v, i) => {
            const selected = v === currentValue;
            const emoji = emojiAnchors && (i === 0 ? emojiAnchors.low : i === ticks.length - 1 ? emojiAnchors.high : null);
            return (
              <Pressable
                key={v}
                disabled={disabled}
                onPress={() => setValue(v, true)}
                style={styles.pillCell}
              >
                <MinkyPanel
                  borderRadius={10}
                  padding={10}
                  paddingTop={10}
                  overlayColor={selected ? themeColor : 'rgba(100, 130, 195, 0.25)'}
                  borderColor={selected ? 'rgba(92, 90, 88, 0.55)' : undefined}
                >
                  <Text style={[styles.pillValue, { fontSize: FontSettingsStore.getScaledFontSize(18) }]}>
                    {emoji || v}
                  </Text>
                  {tickLabels?.[i] ? (
                    <Text
                      style={[styles.pillLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}
                      numberOfLines={2}
                    >
                      {tickLabels[i]}
                    </Text>
                  ) : null}
                </MinkyPanel>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // Continuous slider for wide ranges (e.g. 0-100)
  const pct = (currentValue - scaleMin) / (scaleMax - scaleMin);
  const trackRef = useRef(null);
  const trackOriginRef = useRef(0);
  const trackWidthRef = useRef(0);

  const measureTrack = () => {
    if (!trackRef.current) return;
    trackRef.current.measure?.((x, y, width, height, pageX) => {
      trackOriginRef.current = pageX || 0;
      trackWidthRef.current = width || trackWidth || 200;
    });
  };

  const updateFromPageX = (pageX, commit = false) => {
    if (!interactableRef.current) return;
    if (disabled) return;
    measureTrack();
    const w = trackWidthRef.current || trackWidth || 200;
    const ratio = Math.max(0, Math.min(1, (pageX - trackOriginRef.current) / w));
    setValue(scaleMin + ratio * (scaleMax - scaleMin), commit);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (e) => updateFromPageX(e.nativeEvent.pageX),
      onPanResponderMove: (e) => updateFromPageX(e.nativeEvent.pageX),
      onPanResponderRelease: (e) => updateFromPageX(e.nativeEvent.pageX, true),
    })
  ).current;

  return (
    <View style={styles.wrapper}>
      {(labelCopy || dimensionLabel) && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
            {labelCopy || dimensionLabel}
          </Text>
          {numericReadoutVisible && (
            <Text style={[styles.readout, { fontSize: FontSettingsStore.getScaledFontSize(20) }]}>
              {currentValue}
            </Text>
          )}
        </View>
      )}
      <View
        ref={trackRef}
        onLayout={(e) => { setTrackWidth(e.nativeEvent.layout.width); measureTrack(); }}
        style={styles.trackHit}
        {...panResponder.panHandlers}
      >
        <StitchedFillBar
          progress={pct}
          height={20}
          borderRadius={10}
          fillColor={themeColor}
        />
        <View style={[styles.thumbWrap, { left: `${pct * 100}%` }]} pointerEvents="none">
          <MinkyPanel
            padding={6}
            overlayColor="rgba(135, 180, 210, 0.55)"
            borderColor="rgba(92, 90, 88, 0.55)"
            shape="circular"
            size={36}
          />
        </View>
      </View>
      {emojiAnchors && (
        <View style={styles.anchorRow}>
          <Text style={styles.anchor}>{emojiAnchors.low}</Text>
          <Text style={styles.anchor}>{emojiAnchors.high}</Text>
        </View>
      )}
      {!emojiAnchors && tickLabels && (tickLabels[0] || tickLabels[tickLabels.length - 1]) && (
        <View style={styles.anchorRow}>
          <Text style={styles.anchorText} numberOfLines={2}>{tickLabels[0] || ''}</Text>
          <Text style={[styles.anchorText, styles.anchorTextEnd]} numberOfLines={2}>{tickLabels[tickLabels.length - 1] || ''}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    flexWrap: 'nowrap',
    width: '100%',
  },
  readOnlyLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    flexShrink: 0,
    flexBasis: 'auto',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  readOnlyTrack: {
    flex: 1,
    minWidth: 60,
    maxWidth: 200,
  },
  readOnlyReadout: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    minWidth: 36,
    textAlign: 'right',
    flexShrink: 0,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  readout: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pillCell: { flexBasis: 0, flexGrow: 1, minWidth: 44, minHeight: 48 },
  pillValue: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    fontSize: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pillLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  trackHit: { paddingVertical: 18, position: 'relative' },
  thumbWrap: {
    position: 'absolute',
    top: 10,
    marginLeft: -18,
  },
  anchorRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  anchor: { fontSize: 16 },
  anchorText: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    fontSize: 11,
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  anchorTextEnd: { textAlign: 'right' },
});

export default NumericRatingSlider;
