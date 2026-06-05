import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * static-text-content-block — read-only rendered text block.
 */
const StaticTextContentBlock = observer(({
  blockRole = 'rich-text-prose',
  text = '',
  items = null,
  tone = 'neutral-explanatory',
  iconGlyph = null,
}) => {
  if (blockRole === 'section-divider') {
    return <View style={styles.divider} />;
  }

  const isCallout = blockRole === 'highlighted-callout';
  const isFooter = blockRole === 'footer-credit';
  const isPlaceholder = blockRole === 'ghost-placeholder' || tone === 'ghost-example';
  const isTitle = blockRole === 'step-title' || blockRole === 'central-anchor-label';
  const isAnchor = blockRole === 'anchor-caption';
  const isList = blockRole === 'bulleted-list' || (items && items.length);
  const isNamedRow = blockRole === 'named-point-row';

  const baseFontSize = isTitle ? 22 : isAnchor ? 11 : isFooter ? 11 : 15;
  const fontWeight = isTitle ? '700' : isFooter ? '500' : '600';
  const baseColor = isPlaceholder
    ? 'rgba(69, 67, 66, 0.45)'
    : tone === 'evidence-citation' || isFooter
      ? '#454342'
      : '#2D2C2B';

  const textStyle = {
    fontFamily: 'Comfortaa',
    fontWeight,
    fontSize: FontSettingsStore.getScaledFontSize(baseFontSize),
    color: FontSettingsStore.getFontColor(baseColor),
    // Compute lineHeight from the RENDERED size so vertical density tracks
    // text size — the workbook bump (+30%) needs the line slot to grow with
    // the glyphs, or the page gets noticeably denser instead of looser.
    lineHeight: Math.round(FontSettingsStore.getScaledFontSize(baseFontSize) * 1.4),
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    fontStyle: isPlaceholder ? 'italic' : 'normal',
    textAlign: isTitle || isAnchor ? 'center' : 'left',
  };

  const renderInner = () => {
    if (isList && items) {
      return (
        <View style={styles.list}>
          {items.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={[textStyle, styles.bullet]}>•</Text>
              <Text style={[textStyle, styles.listText]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (isNamedRow && typeof text === 'object' && text?.name) {
      return (
        <View>
          <Text style={[textStyle, { fontWeight: '700' }]}>{text.name}</Text>
          {text.description && (
            <Text style={[textStyle, { fontWeight: '500', marginTop: 2 }]}>
              {text.description}
            </Text>
          )}
        </View>
      );
    }
    return (
      <Text style={textStyle}>
        {iconGlyph ? `${iconGlyph}  ` : ''}
        {typeof text === 'string' ? text : ''}
      </Text>
    );
  };

  if (isCallout) {
    return (
      <MinkyPanel
        borderRadius={12}
        padding={14}
        paddingTop={14}
        overlayColor="rgba(112, 68, 199, 0.2)"
      >
        {renderInner()}
      </MinkyPanel>
    );
  }

  return <View style={styles.block}>{renderInner()}</View>;
});

const styles = StyleSheet.create({
  block: {
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(92, 90, 88, 0.16)',
    marginVertical: 8,
  },
  list: {
    gap: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 12,
    textAlign: 'center',
  },
  listText: {
    flex: 1,
  },
});

export default StaticTextContentBlock;
