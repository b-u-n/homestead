import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import StitchedBorder from '../StitchedBorder';

/**
 * layout-split-screen-two-pane — two-pane layout with named slots.
 */
const LayoutSplitScreenTwoPane = observer(({
  splitOrientation = 'vertical-50-50',
  paneASlot,
  paneBSlot,
  paneALabel,
  paneBLabel,
  paneRelationship,
  colorCoded = false,
  paneAColor,
  paneBColor,
  dividerTreatment = 'bare',
  centralPanel,
  onPaneLayoutRendered,
  onDragCompletedAcrossPanes,
}) => {
  const isHorizontal = splitOrientation.startsWith('horizontal');
  const isAsymmetric = splitOrientation === 'asymmetric-30-70';

  const colorByRelationship = (() => {
    if (!colorCoded) return [null, null];
    if (paneRelationship === 'healthy-vs-unhealthy') return ['rgba(160, 200, 140, 0.25)', 'rgba(220, 130, 130, 0.2)'];
    if (paneRelationship === 'before-vs-after' || paneRelationship === 'old-vs-new') return ['rgba(150, 150, 150, 0.2)', 'rgba(135, 180, 210, 0.3)'];
    if (paneRelationship === 'prediction-vs-outcome') return ['rgba(220, 165, 75, 0.25)', 'rgba(160, 200, 140, 0.25)'];
    return ['rgba(135, 180, 210, 0.25)', 'rgba(112, 68, 199, 0.2)'];
  })();

  const aFlex = isAsymmetric ? 0.3 : 0.5;
  const bFlex = isAsymmetric ? 0.7 : 0.5;
  const aBg = paneAColor ?? colorByRelationship[0];
  const bBg = paneBColor ?? colorByRelationship[1];

  React.useEffect(() => { onPaneLayoutRendered && onPaneLayoutRendered({ splitOrientation }); }, []);

  return (
    <View style={[styles.wrap, isHorizontal ? styles.horizontal : styles.vertical]}>
      <View style={[styles.paneOuter, { flex: aFlex }]}>
        <StitchedBorder borderRadius={10} style={[styles.paneInner, { backgroundColor: aBg || 'rgba(255,255,255,0.25)' }]}>
          {paneALabel ? (
            <Text style={[styles.paneLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              {paneALabel}
            </Text>
          ) : null}
          <View style={styles.paneBody}>{paneASlot}</View>
        </StitchedBorder>
      </View>

      {dividerTreatment === 'central-bridging-panel' && centralPanel ? (
        <View style={styles.centralPanel}>{centralPanel}</View>
      ) : null}

      <View style={[styles.paneOuter, { flex: bFlex }]}>
        <StitchedBorder borderRadius={10} style={[styles.paneInner, { backgroundColor: bBg || 'rgba(255,255,255,0.25)' }]}>
          {paneBLabel ? (
            <Text style={[styles.paneLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              {paneBLabel}
            </Text>
          ) : null}
          <View style={styles.paneBody}>{paneBSlot}</View>
        </StitchedBorder>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  vertical: { flexDirection: 'row' },
  horizontal: { flexDirection: 'column' },
  paneOuter: { },
  paneInner: { padding: 12, gap: 8 },
  paneLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  paneBody: { gap: 6 },
  dividerV: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(92, 90, 88, 0.25)' },
  dividerH: { height: 1, alignSelf: 'stretch', backgroundColor: 'rgba(92, 90, 88, 0.25)' },
  centralPanel: { padding: 6, alignItems: 'center', justifyContent: 'center' },
});

export default LayoutSplitScreenTwoPane;
