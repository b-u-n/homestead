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
 */

// String coercion for any persisted value, used by the default-text fallback.
function formatValueAsText(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(formatValueAsText).filter(Boolean).map(s => `• ${s}`).join('\n');
  if (typeof v === 'object') {
    return Object.entries(v)
      .filter(([, vv]) => vv != null && vv !== '')
      .map(([k, vv]) => `${k}: ${formatValueAsText(vv)}`)
      .join('\n');
  }
  return String(v);
}

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

const ComponentStep = observer(({ step, value, onChange, allStepResponses, allSteps, nav }) => {
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

    // R5 carry-over resolution. When carryFrom is set, source the displayed
    // value from another step's saved data. If carryFrom.bind omitted, take
    // the whole step value (useful when collect='first').
    let carriedValue;
    if (entry.carryFrom && entry.carryFrom.stepId) {
      const sourceStep = allStepResponses?.[entry.carryFrom.stepId];
      if (entry.carryFrom.bind && sourceStep && typeof sourceStep === 'object') {
        carriedValue = sourceStep[entry.carryFrom.bind];
      } else {
        carriedValue = sourceStep;
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
    if (!interactable && refName === 'StaticTextContentBlock' && !props.text && !props.items) {
      const v = carriedValue ?? childValue ?? props.value;
      if (Array.isArray(v)) {
        const labelled = entry.carryFrom ? resolveCarryLabels(v, entry.carryFrom, allSteps) : v;
        mergedProps = { ...props, items: labelled.filter(x => x != null && x !== ''), blockRole: 'bulleted-list' };
      } else {
        mergedProps = { ...props, text: formatValueAsText(v), blockRole: props.blockRole || 'rich-text-prose' };
      }
    }

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

  if (layout === 'split-2' && components.length >= 2) {
    const matchHeights = step.matchHeights !== false; // default true for split-2
    return (
      <View style={styles.vertical}>
        {renderTitle()}
        <View style={styles.split}>
          <View style={styles.splitPane}>{renderOne(components[0], 0, { fillHeight: matchHeights })}</View>
          <View style={styles.splitPane}>{renderOne(components[1], 1, { fillHeight: matchHeights })}</View>
        </View>
        {components.slice(2).map((c, i) => renderOne(c, i + 2))}
      </View>
    );
  }
  if (layout === 'grid-2x2') {
    return (
      <View style={styles.vertical}>
        {renderTitle()}
        <View style={styles.grid}>{components.map(renderOne)}</View>
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
    <View style={styles.vertical}>
      {renderTitle()}
      {groups.map((group, gi) => {
        if (group.entries.length === 1) {
          const { entry, idx } = group.entries[0];
          return <View key={`g${gi}`}>{renderOne(entry, idx)}</View>;
        }
        return (
          <View key={`g${gi}`} style={styles.split}>
            {group.entries.map(({ entry, idx }) => (
              <View key={idx} style={styles.splitPane}>{renderOne(entry, idx, { fillHeight: true })}</View>
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
