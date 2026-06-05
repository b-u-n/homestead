import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import FreeTextMultilineArea from './FreeTextMultilineArea';

/**
 * PerChipPromptList — for each chip the user picked in a prior step, render
 * a labelled FreeText input with a tailored prompt + placeholder.
 *
 * Built for north-star-values-compass step 4 (per-value "small step" prompts)
 * and generic enough for any flow that picks N chips and then walks each one.
 *
 * Authoring shape:
 *   {
 *     "ref": "PerChipPromptList",
 *     "bind": "small_steps",                         // object keyed by chipId
 *     "props": {
 *       "sourceStepId": "pick-values",
 *       "sourceBind": "north_star",                  // array of chip IDs picked
 *       "chipPrompts": {
 *         "growth":  { "label": "Growth",   "prompt": "What's one small move toward growth this week?", "placeholder": "e.g. read 20 minutes before bed." },
 *         "honesty": { "label": "Honesty",  "prompt": "Where could honesty land softer than usual?",   "placeholder": "e.g. tell Sam the truth about Tuesday." }
 *       },
 *       "fallbackPrompt": "How do you want to live this one?",
 *       "fallbackPlaceholder": "e.g. small actions you'd actually do…",
 *       "presetChips": [
 *         { "id": "growth", "label": "Growth" },
 *         { "id": "honesty", "label": "Honesty" }
 *       ]
 *     }
 *   }
 *
 * `presetChips` (optional) supplies labels for custom-entry chips that aren't
 * in `chipPrompts`. If a user-typed chip ID doesn't match either map, the
 * fallback prompt/placeholder is used.
 *
 * Value shape: `{ [chipId]: "<user's text>" }`.
 *
 * Renderer-injected props consumed (see activities/v2/_SCHEMA.md):
 *   - `selectedChipIds`: array of chip IDs to walk; injected by ComponentStep
 *     when the entry's `props.sourceStepId` / `props.sourceBind` resolve to
 *     an array of strings. You may also pass `selectedChips` directly as an
 *     array of strings or `{id,label}` objects.
 */
const PerChipPromptList = observer(({
  // Carried indirectly from sourceStep — we resolve via ComponentStep's
  // existing carryFrom plumbing by reading allStepResponses on render. But
  // primitives don't receive allStepResponses directly, so the activity
  // author either uses `presetChipIds` (a precomputed list) or sets up a
  // carryFrom that resolves the list and passes it in as `selectedChipIds`.
  // For now we accept BOTH `selectedChipIds` and `selectedChips` (array of
  // either strings or {id, label}).
  selectedChipIds,
  selectedChips,
  chipPrompts = {},
  fallbackPrompt = 'How do you want to live this one?',
  fallbackPlaceholder = '',
  // Optional: when authored as an array, the fallback placeholder for a
  // custom (non-presetChip) chip picks one at random per chip, memoized via
  // the same pickRef pattern so it doesn't churn on every render. Falls back
  // to `fallbackPlaceholder` when this is not provided.
  fallbackPlaceholderOptions,
  fallbackPromptOptions,
  presetChips = [],
  currentValue,
  onValueChanged,
  onValueCommitted,
  interactable = true,
  disabled = false,
}) => {
  // Resolve which chip IDs to render inputs for.
  let chipIds = [];
  if (Array.isArray(selectedChipIds)) chipIds = selectedChipIds;
  else if (Array.isArray(selectedChips)) chipIds = selectedChips.map(c => (typeof c === 'string' ? c : c?.id ?? c?.label));
  chipIds = chipIds.filter(id => typeof id === 'string' && id.length > 0);

  const value = currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue) ? currentValue : {};

  const labelFor = (id) => {
    if (chipPrompts[id]?.label) return chipPrompts[id].label;
    const preset = presetChips.find(c => (c.id || c.label) === id);
    if (preset?.label) return preset.label;
    return id;
  };

  // Per-chip prompts/placeholders may be authored as a single string OR as an
  // array of variations (the SCORED_REFLECTIONS pattern) — pick one at random.
  // Fallbacks accept the same shape. Picks are memoized per (chipId) so the
  // prompt/placeholder don't churn on every render/keystroke.
  const pickRef = React.useRef({});
  const pickOnce = (key, source) => {
    if (pickRef.current[key] !== undefined) return pickRef.current[key];
    let picked;
    if (Array.isArray(source)) {
      picked = source.length > 0 ? source[Math.floor(Math.random() * source.length)] : '';
    } else {
      picked = source || '';
    }
    pickRef.current[key] = picked;
    return picked;
  };
  const promptFor = (id) => {
    const entry = chipPrompts[id]?.prompt;
    if (entry !== undefined) return pickOnce(`p:${id}`, entry) || fallbackPrompt || '';
    // Custom chip — use fallbackPromptOptions array if provided, else single fallback.
    const fb = Array.isArray(fallbackPromptOptions) && fallbackPromptOptions.length
      ? fallbackPromptOptions
      : fallbackPrompt;
    return pickOnce(`pF:${id}`, fb) || fallbackPrompt || '';
  };
  const placeholderFor = (id) => {
    const entry = chipPrompts[id]?.placeholder;
    if (entry !== undefined) return pickOnce(`ph:${id}`, entry) || (typeof fallbackPlaceholder === 'string' ? fallbackPlaceholder : '');
    // Custom chip — use fallbackPlaceholderOptions array if provided.
    const fb = Array.isArray(fallbackPlaceholderOptions) && fallbackPlaceholderOptions.length
      ? fallbackPlaceholderOptions
      : fallbackPlaceholder;
    return pickOnce(`phF:${id}`, fb) || (typeof fallbackPlaceholder === 'string' ? fallbackPlaceholder : '');
  };

  const setForChip = (id) => (next) => {
    if (!interactable || disabled) return;
    const updated = { ...value, [id]: next };
    onValueChanged && onValueChanged(updated);
    onValueCommitted && onValueCommitted(updated);
  };

  if (chipIds.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          Pick a few in the previous step and they'll show up here, one prompt each.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {chipIds.map((id) => (
        <View key={id} style={styles.chipBlock}>
          <Text style={[styles.chipLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
            {labelFor(id)}
          </Text>
          <FreeTextMultilineArea
            promptText={promptFor(id)}
            placeholder={placeholderFor(id)}
            currentValue={value[id] || ''}
            onValueChanged={setForChip(id)}
            onValueCommitted={setForChip(id)}
            interactable={interactable}
            disabled={disabled}
            size="small"
            saveMode="save-on-blur"
          />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  chipBlock: { gap: 4 },
  chipLabel: {
    fontFamily: 'SuperStitch',
    fontWeight: '700',
    color: '#5C5A58',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  empty: { padding: 12 },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default PerChipPromptList;
