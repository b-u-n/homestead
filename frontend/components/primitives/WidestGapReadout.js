import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * WidestGapReadout — reads a set of (importance, alignment) bind pairs from a
 * prior step and surfaces the widest gaps in plain language. Built for the
 * life-compass / bulls-eye flow where each domain has two 0–10 sliders and
 * the meaningful insight is "where the two numbers sit furthest apart."
 *
 * Authoring shape:
 *   {
 *     "ref": "WidestGapReadout",
 *     "props": {
 *       "sourceStepId": "domains-grid",
 *       "pairs": [
 *         { "label": "Parenting", "importanceBind": "parenting_importance", "alignmentBind": "parenting_alignment" },
 *         { "label": "Health",    "importanceBind": "health_importance",    "alignmentBind": "health_alignment" }
 *       ],
 *       "topN": 3,
 *       "minGap": 2,
 *       "leadIn": "Reading down what you marked, a few places stand out:",
 *       "noGapMessage": "Your two numbers sit close together across the board — no single gap is yelling."
 *     }
 *   }
 *
 * The component picks the top-N pairs by `(importance − alignment)`, ignores
 * pairs where both numbers are zero (means "not in my life"), and ignores
 * pairs whose gap is below `minGap` (default 2). It does NOT bind a value; it
 * just renders read-only synthesis prose.
 *
 * Renderer-injected props consumed:
 *   - `sourceValue`: the source step's value object (`{ bindName: number }`),
 *     injected by ComponentStep's sourceStepId/sourceBind resolver. The
 *     activity authors `sourceStepId` (no sourceBind — we want the whole step).
 */
const WidestGapReadout = observer(({
  sourceValue,
  pairs = [],
  topN = 3,
  minGap = 2,
  leadIn = 'Looking at what you marked, a few places stand out:',
  noGapMessage = 'The two numbers sit close together across the board — no single gap is calling.',
  domainLabelTemplate = '**{label}** — it matters ({importance}/10), but it\'s been getting little of your life lately ({alignment}/10).',
}) => {
  const src = sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) ? sourceValue : null;

  if (!src) {
    return (
      <MinkyPanel borderRadius={10} padding={12} paddingTop={12} overlayColor="rgba(100, 130, 195, 0.15)">
        <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          Fill in the sliders on the previous step and the widest gaps will surface here.
        </Text>
      </MinkyPanel>
    );
  }

  // Compute gaps, skip "not in my life" pairs (both zero), filter by minGap, sort descending.
  const gaps = pairs
    .map((p) => {
      const importance = Number(src[p.importanceBind]) || 0;
      const alignment = Number(src[p.alignmentBind]) || 0;
      return { label: p.label, importance, alignment, gap: importance - alignment };
    })
    .filter((g) => !(g.importance === 0 && g.alignment === 0))
    .filter((g) => g.gap >= minGap)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, topN);

  return (
    <MinkyPanel
      borderRadius={10}
      padding={14}
      paddingTop={14}
      overlayColor="rgba(135, 180, 210, 0.35)"
    >
      {gaps.length === 0 ? (
        <Text style={[styles.bodyText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {noGapMessage}
        </Text>
      ) : (
        <>
          <Text style={[styles.bodyText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
            {leadIn}
          </Text>
          {gaps.map((g, i) => (
            <Text
              key={i}
              style={[styles.bulletText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}
            >
              {renderBulletLine(domainLabelTemplate, g)}
            </Text>
          ))}
        </>
      )}
    </MinkyPanel>
  );
});

// Cheap markdown-bold renderer: `**foo**` → `foo` in 700 weight.
// Avoids a full markdown dep for a single use case.
function renderBulletLine(template, g) {
  const filled = template
    .replace('{label}', g.label)
    .replace('{importance}', String(g.importance))
    .replace('{alignment}', String(g.alignment));
  // Split on **bold** pairs and render. RN <Text> nested supports inline weight.
  const parts = filled.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => (
    i % 2 === 1
      ? <Text key={i} style={{ fontWeight: '700' }}>{part}</Text>
      : part
  ));
}

const styles = StyleSheet.create({
  bodyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#403F3E',
    lineHeight: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bulletText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#403F3E',
    lineHeight: 20,
    marginTop: 6,
    paddingLeft: 14,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default WidestGapReadout;
