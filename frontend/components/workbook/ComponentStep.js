import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import * as Primitives from '../primitives/_index';
import WoolButton from '../WoolButton';

/**
 * ComponentStep — v2 step renderer.
 *
 * Reads `step.components: [{ ref, props, bind?, interactable?, carryFrom? }]`
 * and renders each primitive via the primitives barrel, applying the step's
 * `layout`. Each component's value is wrapped through `onValueChanged` /
 * `onCommit` / `onChange` so it writes into the step's accumulated state
 * under its `bind` key.
 *
 * Aggregation rule:
 *  - collect='merge' (default): step.value is an object keyed by each
 *    component's `bind`. If `bind` is missing, the component is render-only.
 *  - collect='first': step.value is the raw value of the first bound component.
 *  - collect='array': step.value is an array in component order (bind ignored).
 *
 * Primitive value plumbing:
 *  - We pass `value` / `currentValue` based on which prop the primitive declares.
 *  - We pass `onValueChanged` / `onChange` / `onCommit` — same setter; primitives
 *    pick whichever they consume.
 *
 * R5 — Carry-over pattern:
 *  - Entry with `interactable: false` + `carryFrom: { stepId, bind? }` displays
 *    a value sourced from another step. No setter is wired (cannot accidentally
 *    persist). If `ref` omitted, defaults to `StaticTextContentBlock` rendering
 *    the value as text via `formatValueAsText`.
 *
 * Renderer directives & resolvers (canonical reference: activities/v2/_SCHEMA.md):
 *
 *  Conditional & filtering:
 *   - `showIfSelected`               — gate this entry on a prior selection
 *   - `_filterFrom` (on chip groups) — hide chips already picked elsewhere
 *   - `carryFrom.filterByValue`      — return only object-map keys whose value matches
 *
 *  Source-value resolution (renderer reads a prior step, injects into props):
 *   - `sourceStepId` + `sourceBind`  — injects `sourceValue` (always) +
 *                                       `selectedChipIds` (when array)
 *   - `carryFrom.bind` dot-notation  — `bind: "sorted.control"` walks nested objects
 *
 *  Dynamic-content injection:
 *   - `placeholderByBind`            — override input placeholder from a prior bind
 *   - `placeholdersByDomain` /
 *     `placeholderExamplesByArea`    — same shape, keyed off `sourceValue`
 *   - `randomFromLibrary`            — pick a random string from `activity[<key>]`
 *
 *  Primitive-specific resolvers (renderer assembles the prop the primitive needs):
 *   - `durationFromBind`             — Timer length from a prior numeric pick
 *   - `phaseDurationFromBind`        — BreathPacer phase length from a prior pick
 *   - `_receiptContent`              — assembles ButtonExportShareAction's receipt
 *   - `_nodeFillFromBinds` (step)    — fills DiagramCanvas nodes from step value
 *   - `persons`                      — PerPersonShareReceiptButtons.resolvedPersons
 *
 *  Placement convention: underscore-prefixed directives live at entry level
 *  (peer of `ref`, `bind`, `props`, `carryFrom`); camel-cased ones currently
 *  live in `props` for back-compat. See _SCHEMA.md § "Renderer directives".
 */

// String coercion for any persisted value, used by the default-text fallback.
function formatValueAsText(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(formatValueAsText).filter(Boolean).map(s => `• ${s}`).join('\n');
  if (typeof v === 'object') {
    return Object.entries(v)
      // Filter out the things the user didn't pick: nulls, empty strings, and
      // false. Multi-select binds often produce { option_a: true, option_b:
      // false } — without the `false` filter, carry-over reads as a wall of
      // un-ticked options. R5 says show what they picked, in their words.
      .filter(([, vv]) => vv != null && vv !== '' && vv !== false)
      // For boolean-true values, the value itself isn't interesting (it's just
      // "yes, this one") — render the key alone, not "key: true".
      .map(([k, vv]) => vv === true ? k : `${k}: ${formatValueAsText(vv)}`)
      .join('\n');
  }
  return String(v);
}

// Coerce a single list item to display text. Objects (e.g. support-map nodes
// {id, ring_id, label, avatar, detail_payload}) render via their human label,
// never as raw objects (which React refuses to render).
function itemToText(item) {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') return String(item);
  if (typeof item === 'object') return item.label || item.name || item.text || item.title || formatValueAsText(item);
  return String(item);
}

// Render any value into a single body string for receipt/share assembly.
// Arrays → bulleted lines; objects → "key: value" lines (filtered for truthy);
// scalars → String(v). Used by _receiptContent and PerPersonShareReceiptButtons.
function renderBodyFromValue(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map(itemToText).filter(Boolean).map(s => `• ${s}`).join('\n');
  if (typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([, v]) => v != null && v !== '' && v !== false)
      .map(([k, v]) => `• ${v === true ? k : `${k}: ${itemToText(v)}`}`)
      .join('\n');
  }
  return String(raw);
}

// Pick a placeholder from a map entry that may be a string or string[]. Arrays
// pick one at random per render so the example feels fresh between mounts.
function pickPlaceholder(entry) {
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry) && entry.length) return entry[Math.floor(Math.random() * entry.length)];
  return null;
}

/**
 * RESOLVERS — the renderer's directive table.
 *
 * Each resolver is `(entry, props, mergedProps, ctx) → mergedProps | null`. A
 * null/undefined return means "no change." `renderOne` runs them in order, so
 * a downstream resolver can read upstream-resolved values from `mergedProps`
 * (e.g. `placeholderByBind` reads `mergedProps.sourceValue` set by the source
 * resolver above it). Ordering is deliberate — don't reorder without thinking.
 *
 * Adding a new resolver: append here, add an entry to `_SCHEMA.md` §
 * "Renderer directives", and add a one-line note to the file-header overview.
 */
const RESOLVERS = [
  // 1. randomFromLibrary — substitute text from activity-level library.
  {
    name: 'randomFromLibrary',
    apply(entry, props, mergedProps, ctx) {
      if (!entry.randomFromLibrary || !ctx.activity || !Array.isArray(ctx.activity[entry.randomFromLibrary])) return null;
      const lib = ctx.activity[entry.randomFromLibrary];
      const key = `${ctx.step.stepId}:${ctx.idx}:${entry.randomFromLibrary}`;
      if (ctx.libraryPickRef.current[key] === undefined) {
        ctx.libraryPickRef.current[key] = lib.length > 0 ? lib[Math.floor(Math.random() * lib.length)] : '';
      }
      return { ...mergedProps, text: ctx.libraryPickRef.current[key] };
    },
  },

  // 2. optionsFromBinds — build presetChips from the user's own prior-step text.
  {
    name: 'optionsFromBinds',
    apply(entry, props, mergedProps, ctx) {
      if (!props.optionsFromBinds?.stepId || !Array.isArray(props.optionsFromBinds.binds)) return null;
      const src = ctx.allStepResponses?.[props.optionsFromBinds.stepId] || {};
      const chips = props.optionsFromBinds.binds
        .map((b) => src[b])
        .filter((v) => typeof v === 'string' && v.trim())
        .map((v) => ({ label: v.trim() }));
      return { ...mergedProps, presetChips: chips };
    },
  },

  // 3. _receiptContent — assemble ReceiptPopup sections for ButtonExportShareAction.
  {
    name: '_receiptContent',
    apply(entry, props, mergedProps, ctx) {
      if (entry.ref !== 'ButtonExportShareAction' || !props.opensReceipt || !props._receiptContent) return null;
      const rc = props._receiptContent;
      const sections = (rc.sections || [])
        .map((s) => {
          const sourceStep = ctx.allStepResponses?.[s.bindsFromStep] || {};
          const binds = Array.isArray(s.binds) ? s.binds : [];
          if (s.format === 'labeled-block') {
            const body = binds
              .map((b) => {
                const v = renderBodyFromValue(sourceStep[b]);
                return v ? `${b.replace(/_/g, ' ')}\n${v}` : '';
              })
              .filter(Boolean)
              .join('\n\n');
            return { heading: s.heading, body };
          }
          const body = binds.map((b) => renderBodyFromValue(sourceStep[b])).filter(Boolean).join('\n\n');
          return { heading: s.heading, body };
        })
        .filter((s) => s.body && s.body.trim());
      return { ...mergedProps, resolvedReceipt: { title: rc.title, sections } };
    },
  },

  // 4. _nodeFillFromBinds — fill diagram nodes whose paired step-bind has content.
  {
    name: '_nodeFillFromBinds',
    apply(entry, props, mergedProps, ctx) {
      if (entry.ref !== 'DiagramCanvasWithNodesAndEdges' || !ctx.step?._nodeFillFromBinds?.mapping) return null;
      const mapping = ctx.step._nodeFillFromBinds.mapping;
      const stepValue = ctx.value && typeof ctx.value === 'object' ? ctx.value : {};
      const filledNodeIds = Object.entries(mapping)
        .filter(([, bindName]) => {
          const v = stepValue[bindName];
          if (v == null) return false;
          if (typeof v === 'string') return v.trim().length > 0;
          if (Array.isArray(v)) return v.length > 0;
          if (typeof v === 'object') return Object.keys(v).length > 0;
          return Boolean(v);
        })
        .map(([nodeId]) => nodeId);
      return { ...mergedProps, filledNodeIds };
    },
  },

  // 5. persons (PerPersonShareReceiptButtons) — resolve per-person sections.
  {
    name: 'persons',
    apply(entry, props, mergedProps, ctx) {
      if (entry.ref !== 'PerPersonShareReceiptButtons' || !Array.isArray(props.persons)) return null;
      const lookupSteps = Array.isArray(props.lookupStepIds) && props.lookupStepIds.length
        ? props.lookupStepIds
        : Object.keys(ctx.allStepResponses || {});
      const lookupBind = (bind) => {
        for (const sid of lookupSteps) {
          const sv = ctx.allStepResponses?.[sid];
          if (sv && typeof sv === 'object' && bind in sv) return sv[bind];
        }
        return undefined;
      };
      const resolvedPersons = props.persons.map((p) => {
        const name = p.nameBind ? lookupBind(p.nameBind) : '';
        const sections = (p.sections || [])
          .map((s) => ({ heading: s.heading, body: renderBodyFromValue(lookupBind(s.bind)) }))
          .filter((s) => s.body && s.body.trim());
        return { name: typeof name === 'string' ? name : '', sections };
      });
      return { ...mergedProps, resolvedPersons };
    },
  },

  // 5b. ListBalanceReadout — resolve cross-step forward/backward arrays from
  //     `forwardSource: {stepId, bind}` + `backwardSource: {stepId, bind}` and
  //     inject as `forwardListValue` + `backwardListValue`. Used by force-field
  //     synthesis on motivation-barriers where the two lists live in different
  //     prior steps.
  {
    name: 'listBalanceSources',
    apply(entry, props, mergedProps, ctx) {
      if (entry.ref !== 'ListBalanceReadout') return null;
      if (!props.forwardSource && !props.backwardSource) return null;
      const readArr = (s) => {
        if (!s || !s.stepId) return undefined;
        const sv = ctx.allStepResponses?.[s.stepId];
        return sv && typeof sv === 'object' ? sv[s.bind] : undefined;
      };
      return {
        ...mergedProps,
        forwardListValue: readArr(props.forwardSource),
        backwardListValue: readArr(props.backwardSource),
      };
    },
  },

  // 6. durationFromBind — TimerCountdownOrSession length from prior pick.
  {
    name: 'durationFromBind',
    apply(entry, props, mergedProps, ctx) {
      if (entry.ref !== 'TimerCountdownOrSession' || !props.durationFromBind?.stepId) return null;
      const dSrc = ctx.allStepResponses?.[props.durationFromBind.stepId];
      const dRaw = dSrc && typeof dSrc === 'object' ? dSrc[props.durationFromBind.bind] : dSrc;
      const dNum = Number(dRaw);
      if (!Number.isFinite(dNum) || dNum <= 0) return null;
      const mult = Number(props.durationFromBind.multiplier) || 1;
      return { ...mergedProps, durationSeconds: dNum * mult };
    },
  },

  // 7. phaseDurationFromBind — BreathPacer phase length from prior pick.
  {
    name: 'phaseDurationFromBind',
    apply(entry, props, mergedProps, ctx) {
      if (entry.ref !== 'BreathPacerAnimation' || !props.phaseDurationFromBind?.stepId) return null;
      const pSrc = ctx.allStepResponses?.[props.phaseDurationFromBind.stepId];
      const pRaw = pSrc && typeof pSrc === 'object' ? pSrc[props.phaseDurationFromBind.bind] : pSrc;
      const pNum = Number(pRaw);
      if (!Number.isFinite(pNum) || pNum <= 0 || !Array.isArray(props.phaseDurationsSeconds)) return null;
      return {
        ...mergedProps,
        phaseDurationsSeconds: props.phaseDurationsSeconds.map(p => ({ ...p, duration: pNum })),
      };
    },
  },

  // 8. sourceStepId/sourceBind — inject sourceValue + (when array-ish) selectedChipIds.
  //    MUST run before placeholderByBind / placeholdersByDomain, which read sourceValue.
  //    When sourceBind is omitted, the whole step value object is injected
  //    (used by primitives like WidestGapReadout that read many binds at once).
  {
    name: 'sourceStepId',
    apply(entry, props, mergedProps, ctx) {
      if (!props.sourceStepId) return null;
      const ssSrc = ctx.allStepResponses?.[props.sourceStepId];
      const ssVal = props.sourceBind
        ? (ssSrc && typeof ssSrc === 'object' ? ssSrc[props.sourceBind] : ssSrc)
        : ssSrc;
      let coercedIds = null;
      if (Array.isArray(ssVal)) {
        coercedIds = ssVal
          .map((v) => (typeof v === 'string' ? v : v?.id ?? v?.label))
          .filter((v) => typeof v === 'string' && v.length > 0);
      } else if (ssVal && typeof ssVal === 'object') {
        coercedIds = Object.keys(ssVal).filter((k) => {
          const v = ssVal[k];
          if (v == null || v === false) return false;
          if (typeof v === 'string') return v.trim().length > 0;
          return true;
        });
      }
      return {
        ...mergedProps,
        sourceValue: ssVal,
        ...(coercedIds && coercedIds.length > 0 ? { selectedChipIds: coercedIds } : {}),
      };
    },
  },

  // 9. placeholderByBind — override input placeholder from a prior bind.
  {
    name: 'placeholderByBind',
    apply(entry, props, mergedProps, ctx) {
      if (!props.placeholderByBind?.stepId || !props.placeholderByBind?.map) return null;
      const pSrc = ctx.allStepResponses?.[props.placeholderByBind.stepId];
      const pKey = props.placeholderByBind.bind && pSrc && typeof pSrc === 'object'
        ? pSrc[props.placeholderByBind.bind]
        : pSrc;
      if (typeof pKey !== 'string') return null;
      const picked = pickPlaceholder(props.placeholderByBind.map[pKey]);
      return picked ? { ...mergedProps, placeholder: picked } : null;
    },
  },

  // 10. placeholdersByDomain / placeholderExamplesByArea — keyed off sourceValue.
  {
    name: 'placeholdersByDomain',
    apply(entry, props, mergedProps, ctx) {
      const directMap = props.placeholdersByDomain || props.placeholderExamplesByArea;
      if (!directMap || typeof mergedProps.sourceValue !== 'string') return null;
      const picked = pickPlaceholder(directMap[mergedProps.sourceValue]);
      return picked ? { ...mergedProps, placeholder: picked } : null;
    },
  },

  // 11. _filterFrom — drop chips already chosen in earlier steps.
  {
    name: '_filterFrom',
    apply(entry, props, mergedProps, ctx) {
      if (entry.ref !== 'ChipMultiSelectTagGroup' || !props._filterFrom?.stepIds) return null;
      const base = mergedProps.presetChips || props.presetChips;
      if (!Array.isArray(base)) return null;
      const already = new Set();
      props._filterFrom.stepIds.forEach((sid) => {
        const sv = ctx.allStepResponses?.[sid];
        if (Array.isArray(sv)) sv.forEach((id) => already.add(id));
        else if (sv && typeof sv === 'object') {
          Object.entries(sv).forEach(([, arr]) => {
            if (Array.isArray(arr)) arr.forEach((id) => already.add(id));
          });
        }
      });
      if (already.size === 0) return null;
      return { ...mergedProps, presetChips: base.filter((c) => !already.has(c.id || c.label)) };
    },
  },
];

// Resolve an array of selected IDs (from a ChipMultiSelectTagGroup carry-over)
// to their human-readable labels by looking up the source step's preset chips.
// IDs without a preset match (e.g. custom-entry chips) pass through unchanged.
function resolveCarryLabels(carriedValue, carryFrom, allSteps) {
  if (!Array.isArray(carriedValue) || !Array.isArray(allSteps) || !carryFrom?.stepId) {
    return carriedValue;
  }
  const src = allSteps.find(s => s.stepId === carryFrom.stepId);
  if (!src || !Array.isArray(src.components)) return carriedValue;
  const chipEntry = src.components.find(
    c => c.ref === 'ChipMultiSelectTagGroup' && (!carryFrom.bind || c.bind === carryFrom.bind)
  );
  const chips = chipEntry?.props?.presetChips;
  if (!Array.isArray(chips) || chips.length === 0) return carriedValue;
  const byId = new Map(chips.map(c => [c.id, c.label || c.id]));
  return carriedValue.map(id => byId.get(id) ?? id);
}

const ComponentStep = observer(({ step, value, onChange, allStepResponses, allSteps, activity, nav }) => {
  // Stable per-mount random picks for entries that draw from an activity-level
  // library (e.g. today's affirmation). Keyed by step + index so re-renders
  // don't shuffle the displayed line, but a new mount (a fresh "today") does.
  const libraryPickRef = React.useRef({});
  const layout = step.layout || 'vertical';
  const collect = step.collect || 'merge';
  const components = Array.isArray(step.components) ? step.components : [];
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 640;
  const showTitle = !!step.title && !isMobile;

  const renderTitle = () => showTitle ? (
    <Text style={[styles.stepTitle, { fontSize: FontSettingsStore.getScaledFontSize(18) }]}>
      {step.title}
    </Text>
  ) : null;

  const componentValueOf = (entry, idx) => {
    if (collect === 'first') return value;
    if (collect === 'array') return Array.isArray(value) ? value[idx] : undefined;
    if (!entry.bind) return undefined;
    return value && typeof value === 'object' ? value[entry.bind] : undefined;
  };

  const writeBack = (entry, idx, next) => {
    if (collect === 'first') {
      onChange(next);
      return;
    }
    if (collect === 'array') {
      // Functional updater — merges against the latest parent state, not a
      // stale render-time closure. Without this, two sibling components in the
      // same step (e.g. textbox + slider) writing rapidly race: the second one
      // closes over a pre-first-write `value` and overwrites the first's bind.
      onChange(prev => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        arr[idx] = next;
        return arr;
      });
      return;
    }
    if (!entry.bind) return;
    onChange(prev => ({
      ...(prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : {}),
      [entry.bind]: next,
    }));
  };

  const renderOne = (entry, idx, opts = {}) => {
    // Inline nav-buttons sentinel — when present, the activity wants Previous /
    // Complete to render at THIS position in the step content (e.g. above a
    // bottom-of-step summary recap). The fixed bottom nav is suppressed by
    // WorkbookActivity when any such sentinel exists.
    if (entry && entry.ref === 'InlineNavButtons') {
      const isFirstStep = !!nav?.isFirstStep;
      const isLastStep = !!nav?.isLastStep;
      const saving = !!nav?.saving;
      return (
        <View key={idx} style={styles.inlineNavRow}>
          <WoolButton
            onPress={() => nav?.onPrevious && nav.onPrevious()}
            variant="purple"
            size="small"
            overlayColor="rgba(100, 130, 195, 0.25)"
          >
            {isFirstStep ? 'Back' : 'Previous'}
          </WoolButton>
          <WoolButton
            onPress={() => nav?.onNext && nav.onNext()}
            variant="purple"
            size="small"
            disabled={saving}
          >
            {saving ? 'Saving...' : isLastStep ? 'Complete' : 'Next'}
          </WoolButton>
        </View>
      );
    }
    const interactable = entry.interactable !== false;
    const props = entry.props || {};

    // showIfNonEmpty — conditional rendering gate keyed on whether a bind has
    // *any* content. Authoring shape: `showIfNonEmpty: { stepId, bind }`.
    // Used by activities with N optional slots (e.g. supporter-caregiver's
    // 4 person blocks) that should disappear when their nameBind is empty.
    if (entry.showIfNonEmpty) {
      const { stepId: nsId, bind: nBind } = entry.showIfNonEmpty;
      const nSrc = allStepResponses?.[nsId];
      const nVal = nSrc && nBind && typeof nSrc === 'object' ? nSrc[nBind] : nSrc;
      const hasContent = (
        (typeof nVal === 'string' && nVal.trim().length > 0)
        || (Array.isArray(nVal) && nVal.length > 0)
        || (nVal && typeof nVal === 'object' && Object.keys(nVal).length > 0)
        || (typeof nVal === 'number' && nVal !== 0)
        || nVal === true
      );
      if (!hasContent) return null;
    }

    // showIfSelected — conditional rendering gate. When an entry has
    // `showIfSelected: { stepId, bind, matchValue }`, only render it if
    // matchValue is present in the named bind's saved value (array contains,
    // object truthy-key, or scalar equality). Used by activities that
    // generate per-pick sub-blocks and want only the picked ones visible.
    if (entry.showIfSelected) {
      const { stepId: gsId, bind: gBind, matchValue } = entry.showIfSelected;
      const gSrc = allStepResponses?.[gsId];
      const gVal = gSrc && gBind && typeof gSrc === 'object' ? gSrc[gBind] : gSrc;
      let matched = false;
      if (Array.isArray(gVal)) {
        matched = gVal.includes(matchValue);
      } else if (gVal && typeof gVal === 'object') {
        // Match if the key's value is true (boolean multi-select), or equals
        // the matchValue (alias map), or is any non-empty string (paint-mode
        // where the value at key is e.g. a color ID).
        const v = gVal[matchValue];
        matched = v === true || v === matchValue || (typeof v === 'string' && v.length > 0);
      } else {
        matched = gVal === matchValue;
      }
      if (!matched) return null;
    }

    // R5 carry-over resolution. When carryFrom is set, source the displayed
    // value from another step's saved data. If carryFrom.bind omitted, take
    // the whole step value (useful when collect='first'). Dot-notation in
    // `bind` walks into nested objects: `bind: "sorted.control"` resolves to
    // `sourceStep.sorted.control` — used by primitives like ChipSortToGroups
    // that emit one nested object containing multiple group buckets.
    // Optional `filterByValue`: when the resolved value is an object whose
    // entries map key→category (e.g. CardDeckWalker's { chipId: "up" | "down" }),
    // filterByValue: "up" returns the array of keys whose value equals "up".
    let carriedValue;
    if (entry.carryFrom && entry.carryFrom.stepId) {
      const sourceStep = allStepResponses?.[entry.carryFrom.stepId];
      if (entry.carryFrom.bind && sourceStep && typeof sourceStep === 'object') {
        const parts = String(entry.carryFrom.bind).split('.');
        let cursor = sourceStep;
        for (const part of parts) {
          if (cursor && typeof cursor === 'object') cursor = cursor[part];
          else { cursor = undefined; break; }
        }
        carriedValue = cursor;
      } else {
        carriedValue = sourceStep;
      }
      if (entry.carryFrom.filterByValue !== undefined && carriedValue && typeof carriedValue === 'object' && !Array.isArray(carriedValue)) {
        carriedValue = Object.entries(carriedValue)
          .filter(([, v]) => v === entry.carryFrom.filterByValue)
          .map(([k]) => k);
      }
    }

    // Default ref for read-only display when none specified: text block.
    const refName = entry.ref || (!interactable ? 'StaticTextContentBlock' : null);
    const Component = refName ? Primitives[refName] : null;
    if (!Component) {
      return (
        <View key={idx} style={styles.error}>
          <Text style={styles.errorText}>Unknown primitive: {entry.ref || '(no ref)'}</Text>
        </View>
      );
    }

    const childValue = componentValueOf(entry, idx);
    const setter = (next) => writeBack(entry, idx, next);

    // Build a step shape for legacy components (LikertReflectionStep etc.) that
    // expect `step.<field>` rather than direct props. Inline `props` becomes the step body.
    const legacyStep = { stepId: step.stepId, ...props };
    const wrapperStyle = layout === 'grid-2x2'
      ? styles.gridCell
      : opts.fillHeight
        ? styles.rowFill
        : styles.row;
    // When in a height-matched split, push flex:1 down to the primitive's root
    // (most primitives forward `style` to their root MinkyPanel). Existing prop
    // `style` from JSON wins.
    const childStyle = opts.fillHeight
      ? { flex: 1, alignSelf: 'stretch', ...(props.style || {}) }
      : props.style;

    // Default-text fallback: when the component is non-interactable and the
    // resolved ref is StaticTextContentBlock without explicit text, format the
    // carried/explicit value into the right StaticTextContentBlock props.
    //   - array → real bulleted-list (uses `items`)
    //   - scalar/object → rich-text-prose (uses `text` via formatValueAsText)
    let mergedProps = props;

    // Run the renderer-directive table. Each resolver either returns a new
    // mergedProps (with its patch applied) or null (no change). Ordering is
    // declared in the RESOLVERS array; downstream resolvers can read
    // upstream-resolved values via `mergedProps`.
    const resolverCtx = { allStepResponses, allSteps, step, value, activity, libraryPickRef, idx };
    for (const resolver of RESOLVERS) {
      const patched = resolver.apply(entry, props, mergedProps, resolverCtx);
      if (patched) mergedProps = patched;
    }

    if (!interactable && refName === 'StaticTextContentBlock' && !props.text && !props.items) {
      const v = carriedValue ?? childValue ?? props.value;
      if (Array.isArray(v)) {
        const labelled = entry.carryFrom ? resolveCarryLabels(v, entry.carryFrom, allSteps) : v;
        const items = labelled.map(itemToText).filter(x => x != null && x !== '');
        mergedProps = { ...props, items, blockRole: 'bulleted-list' };
      } else {
        mergedProps = { ...props, text: itemToText(v), blockRole: props.blockRole || 'rich-text-prose' };
      }
    }

    // (Resolver loop above handles all renderer directives: randomFromLibrary,
    //  optionsFromBinds, _receiptContent, _nodeFillFromBinds, persons,
    //  durationFromBind, phaseDurationFromBind, sourceStepId/sourceBind,
    //  placeholderByBind, placeholdersByDomain, _filterFrom.
    //  See RESOLVERS at module top + activities/v2/_SCHEMA.md.)

    // Interactivity branch — wire setters only when interactable.
    const interactiveProps = interactable
      ? {
          onChange: setter,
          onValueChanged: setter,
          onCommit: setter,
          onValueCommitted: setter,
        }
      : {};

    // Effective value: carryFrom > current bind value > explicit value.
    const effectiveValue = carriedValue ?? childValue ?? props.value;

    return (
      <View key={idx} style={wrapperStyle}>
        <Component
          {...mergedProps}
          interactable={interactable}
          style={childStyle}
          step={legacyStep}
          allResponses={allStepResponses}
          value={effectiveValue}
          currentValue={effectiveValue ?? props.currentValue}
          {...interactiveProps}
        />
      </View>
    );
  };

  // Scale layout gaps with the workbook font bump so wider/taller text gets
  // proportionally more breathing room (StyleSheet defaults are frozen at
  // module load — overrides are inlined here so MobX re-renders catch them).
  const gapV = FontSettingsStore.getScaledSpacing(16);
  const gapH = FontSettingsStore.getScaledSpacing(12);
  const verticalStyle = { gap: gapV };
  const splitStyle = { flexDirection: 'row', gap: gapH, alignItems: 'stretch' };
  const splitPaneStyle = { flex: 1, gap: gapV, alignSelf: 'stretch' };
  const gridStyle = { flexDirection: 'row', flexWrap: 'wrap', gap: gapH };

  if (layout === 'split-2' && components.length >= 2) {
    const matchHeights = step.matchHeights !== false; // default true for split-2
    return (
      <View style={verticalStyle}>
        {renderTitle()}
        <View style={splitStyle}>
          <View style={splitPaneStyle}>{renderOne(components[0], 0, { fillHeight: matchHeights })}</View>
          <View style={splitPaneStyle}>{renderOne(components[1], 1, { fillHeight: matchHeights })}</View>
        </View>
        {components.slice(2).map((c, i) => renderOne(c, i + 2))}
      </View>
    );
  }
  if (layout === 'grid-2x2') {
    return (
      <View style={verticalStyle}>
        {renderTitle()}
        <View style={gridStyle}>{components.map(renderOne)}</View>
      </View>
    );
  }
  // Default vertical — supports per-component `row` grouping. Components sharing the
  // same `row` value (a string or number) render side-by-side with matched heights.
  // Components without `row` render full-width on their own line.
  const groups = [];
  let currentGroup = null;
  components.forEach((c, idx) => {
    if (c && c.row != null) {
      if (currentGroup && currentGroup.row === c.row) {
        currentGroup.entries.push({ entry: c, idx });
      } else {
        currentGroup = { row: c.row, entries: [{ entry: c, idx }] };
        groups.push(currentGroup);
      }
    } else {
      groups.push({ row: null, entries: [{ entry: c, idx }] });
      currentGroup = null;
    }
  });
  return (
    <View style={verticalStyle}>
      {renderTitle()}
      {groups.map((group, gi) => {
        if (group.entries.length === 1) {
          const { entry, idx } = group.entries[0];
          return <View key={`g${gi}`}>{renderOne(entry, idx)}</View>;
        }
        return (
          <View key={`g${gi}`} style={splitStyle}>
            {group.entries.map(({ entry, idx }) => (
              <View key={idx} style={splitPaneStyle}>{renderOne(entry, idx, { fillHeight: true })}</View>
            ))}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  vertical: { gap: 16 },
  row: { },
  rowFill: { flex: 1, alignSelf: 'stretch' },
  split: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  splitPane: { flex: 1, gap: 16, alignSelf: 'stretch' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCell: { width: '48%' },
  stepTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inlineNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  error: { padding: 8 },
  errorText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#C04A6F',
    fontSize: 12,
  },
});

export default ComponentStep;
