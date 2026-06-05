import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';

/**
 * ListBalanceReadout — compares two chip-list binds (a "forward" list and a
 * "backward" list) and surfaces a tilt-aware comparative paragraph. Used by
 * motivation-barriers-analysis (motivators vs demotivators), can be reused
 * anywhere a "pull toward / pull away" balance read makes sense.
 *
 * Authoring shape:
 *   {
 *     "ref": "ListBalanceReadout",
 *     "props": {
 *       "sourceStepId": "demotivators",
 *       "forwardBind": "motivators",
 *       "backwardBind": "demotivators",
 *       "forwardLabel": "pulls toward",
 *       "backwardLabel": "pulls away",
 *       "tiltMessages": {
 *         "strongForward": ["…"],
 *         "mildForward":   ["…"],
 *         "balanced":      ["…"],
 *         "mildBackward":  ["…"],
 *         "strongBackward":["…"]
 *       }
 *     }
 *   }
 *
 * Tilt buckets are defined as: gap = forward.length − backward.length.
 *   strongForward:  gap ≥ 3
 *   mildForward:    1 ≤ gap ≤ 2
 *   balanced:       gap = 0
 *   mildBackward:  -2 ≤ gap ≤ -1
 *   strongBackward: gap ≤ -3
 *
 * Each tilt's message array is picked at random per mount (memoized). Each
 * message supports `{f}` (forward count), `{b}` (backward count),
 * `{forwardLabel}`, `{backwardLabel}` substitutions.
 *
 * If `tiltMessages` is omitted, sensible default copy fires. If only some
 * tilts have arrays authored, the others fall back to defaults.
 *
 * Renderer-injected props consumed: none. Reads source binds directly via
 * `sourceStepId`/`sourceBind`-resolver injection of `sourceValue` IF
 * `sourceStepId` is set without `sourceBind` (the whole step value object).
 */

const DEFAULTS = {
  strongForward: ['You named {f} {forwardLabel} and only {b} {backwardLabel}. The lean toward this is real — most of the weight is already on your side.'],
  mildForward:   ['{f} {forwardLabel}, {b} {backwardLabel} — a small tilt forward, enough to matter on a day that\'s asking for one.'],
  balanced:      ['Even, {f} on each side — which way it tips will probably come down to which one shows up loudest on a given day.'],
  mildBackward:  ['{b} {backwardLabel} against {f} {forwardLabel} — a small tug back, not a verdict; the smaller side still gets a say.'],
  strongBackward:['{b} {backwardLabel} against just {f} {forwardLabel}. The drag is real — naming it doesn\'t fix it, but it stops the drag from running the show unseen.'],
};

function tiltFor(gap) {
  if (gap >= 3) return 'strongForward';
  if (gap >= 1) return 'mildForward';
  if (gap === 0) return 'balanced';
  if (gap >= -2) return 'mildBackward';
  return 'strongBackward';
}

const ListBalanceReadout = observer(({
  // Either: a single sourceStep with both binds in it (sourceValue injected
  // by ComponentStep's sourceStepId/sourceBind resolver), or two cross-step
  // arrays already injected by the ListBalanceReadout resolver (when the
  // activity authored forwardSource / backwardSource).
  sourceValue,
  forwardBind,
  backwardBind,
  forwardListValue,
  backwardListValue,
  forwardLabel = 'pulls toward',
  backwardLabel = 'pulls away',
  tiltMessages = {},
  noContentMessage = 'Add a few on each side and the balance will land here.',
}) => {
  // Prefer cross-step-injected arrays; fall back to picking out of sourceValue.
  const fRaw = forwardListValue != null
    ? forwardListValue
    : (sourceValue && typeof sourceValue === 'object' ? sourceValue[forwardBind] : undefined);
  const bRaw = backwardListValue != null
    ? backwardListValue
    : (sourceValue && typeof sourceValue === 'object' ? sourceValue[backwardBind] : undefined);
  const f = Array.isArray(fRaw) ? fRaw.length : 0;
  const b = Array.isArray(bRaw) ? bRaw.length : 0;

  // Memoize the random pick per mount so the message doesn't churn while
  // the user is still on the same step.
  const pickRef = useRef(null);

  if (f === 0 && b === 0) {
    return (
      <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
        {noContentMessage}
      </Text>
    );
  }

  const gap = f - b;
  const tilt = tiltFor(gap);
  const variants = (tiltMessages[tilt] && tiltMessages[tilt].length > 0)
    ? tiltMessages[tilt]
    : DEFAULTS[tilt];
  // Pick once per mount.
  if (pickRef.current === null) {
    pickRef.current = variants[Math.floor(Math.random() * variants.length)];
  }
  const filled = pickRef.current
    .replace('{f}', String(f))
    .replace('{b}', String(b))
    .replace('{forwardLabel}', forwardLabel)
    .replace('{backwardLabel}', backwardLabel);

  const bodyFontSize = FontSettingsStore.getScaledFontSize(15);
  return (
    <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: Math.round(bodyFontSize * 1.4) }]}>
      {filled}
    </Text>
  );
});

// Body text style matches StaticTextContentBlock's `rich-text-prose` body
// (15px, weight 600, color #2D2C2B) so the balance prose reads as part of
// the same paragraph hierarchy as the surrounding step copy.
const styles = StyleSheet.create({
  bodyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    // lineHeight is computed inline from the scaled fontSize so the workbook
    // font bump grows the line slot in proportion with the glyphs.
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
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

export default ListBalanceReadout;
