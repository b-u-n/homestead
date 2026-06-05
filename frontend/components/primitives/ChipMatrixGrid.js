import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * ChipMatrixGrid — chip pool above a rows × columns grid. User taps a chip
 * in the pool, then taps a cell to place it there. Tap a placed chip to
 * remove it from that cell. The same chip can appear in multiple cells (a
 * medication taken Mon & Wed, etc.). Long-press a chip in the pool to
 * delete it entirely.
 *
 * Built for medication-adherence (meds across a 4-week × 7-day grid), but
 * generic for any "which item happened in which slot" tracking.
 *
 * Authoring shape:
 *   {
 *     "ref": "ChipMatrixGrid",
 *     "bind": "doses",
 *     "props": {
 *       "rows": [
 *         { "id": "week1", "label": "Week 1" },
 *         { "id": "week2", "label": "Week 2" }
 *       ],
 *       "columns": [
 *         { "id": "mon", "label": "Mon" },
 *         { "id": "tue", "label": "Tue" }
 *       ],
 *       "presetChips": [
 *         { "id": "sertraline", "label": "Sertraline 50mg" },
 *         { "id": "vit_d", "label": "Vit D" }
 *       ],
 *       "allowCustomEntry": true,
 *       "customEntryPlaceholder": "Add another…"
 *     }
 *   }
 *
 * Value shape: `{ [rowId]: { [colId]: [chipId, chipId, ...] } }`. Cells with
 * nothing in them are absent (not stored as empty arrays).
 *
 * Drag is intentionally NOT used (unreliable on RN Web) — tap/tap is the
 * primary interaction, consistent with ChipSortToGroups.
 */
const ChipMatrixGrid = observer(({
  currentValue,
  onValueChanged,
  onValueCommitted,
  interactable = true,
  disabled = false,
  rows = [],
  columns = [],
  presetChips = [],
  allowCustomEntry = false,
  customEntryPlaceholder = 'Add another chip…',
}) => {
  const placement = currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)
    ? currentValue
    : {};

  const [selectedChip, setSelectedChip] = useState(null);
  const [draft, setDraft] = useState('');
  const [customChips, setCustomChips] = useState([]);
  const allChips = [...presetChips, ...customChips];

  const commit = (next) => {
    if (!interactable || disabled) return;
    onValueChanged && onValueChanged(next);
    onValueCommitted && onValueCommitted(next);
  };

  const chipInCell = (rowId, colId, chipId) => {
    const cell = placement?.[rowId]?.[colId];
    return Array.isArray(cell) && cell.includes(chipId);
  };

  const placeInCell = (chipId, rowId, colId) => {
    const cell = placement?.[rowId]?.[colId] || [];
    if (cell.includes(chipId)) return; // already there
    const next = {
      ...placement,
      [rowId]: {
        ...(placement[rowId] || {}),
        [colId]: [...cell, chipId],
      },
    };
    commit(next);
  };

  const removeFromCell = (chipId, rowId, colId) => {
    const cell = placement?.[rowId]?.[colId] || [];
    if (!cell.includes(chipId)) return;
    const nextCell = cell.filter(c => c !== chipId);
    const nextRow = { ...(placement[rowId] || {}) };
    if (nextCell.length === 0) delete nextRow[colId];
    else nextRow[colId] = nextCell;
    const next = { ...placement };
    if (Object.keys(nextRow).length === 0) delete next[rowId];
    else next[rowId] = nextRow;
    commit(next);
  };

  const handleCellTap = (rowId, colId) => {
    if (!interactable || disabled) return;
    if (!selectedChip) return; // tapping an empty cell with nothing selected is a no-op
    placeInCell(selectedChip, rowId, colId);
    // Keep the chip selected — the user usually places the same chip in
    // multiple cells. They can tap the chip again to deselect.
  };

  const handlePlacedChipTap = (chipId, rowId, colId) => {
    if (!interactable || disabled) return;
    removeFromCell(chipId, rowId, colId);
  };

  const handlePoolChipTap = (chipId) => {
    if (!interactable || disabled) return;
    setSelectedChip(prev => prev === chipId ? null : chipId);
  };

  const addCustomChip = () => {
    const text = draft.trim();
    if (!text || !allowCustomEntry) return;
    const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setCustomChips(prev => [...prev, { id, label: text, custom: true }]);
    setDraft('');
  };

  const renderPoolChip = (chip) => {
    const id = chip.id || chip.label;
    const isSelected = selectedChip === id;
    return (
      <Pressable
        key={id}
        onPress={() => handlePoolChipTap(id)}
        disabled={disabled || !interactable}
      >
        <MinkyPanel
          borderRadius={10}
          padding={8}
          paddingTop={8}
          overlayColor={isSelected ? 'rgba(135, 180, 210, 0.7)' : 'rgba(100, 130, 195, 0.25)'}
          borderColor={isSelected ? 'rgba(45, 44, 43, 0.9)' : undefined}
        >
          <Text
            style={[styles.chipText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}
            numberOfLines={2}
          >
            {chip.label}
          </Text>
        </MinkyPanel>
      </Pressable>
    );
  };

  const renderCellChip = (chipId, rowId, colId) => {
    const chip = allChips.find(c => (c.id || c.label) === chipId) || { id: chipId, label: chipId };
    return (
      <Pressable
        key={`${rowId}-${colId}-${chipId}`}
        onPress={() => handlePlacedChipTap(chipId, rowId, colId)}
        disabled={disabled || !interactable}
      >
        <MinkyPanel
          borderRadius={6}
          padding={3}
          paddingTop={3}
          overlayColor="rgba(135, 180, 210, 0.7)"
        >
          <Text
            style={[styles.cellChipText, { fontSize: FontSettingsStore.getScaledFontSize(9) }]}
            numberOfLines={1}
          >
            {chip.label}
          </Text>
        </MinkyPanel>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Pool */}
      <MinkyPanel
        borderRadius={10}
        padding={12}
        paddingTop={12}
        overlayColor="rgba(100, 130, 195, 0.12)"
      >
        <Text style={[styles.sectionLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          {selectedChip ? 'Tap a cell to place it. Tap the chip again to put it down.' : 'Tap a chip, then tap a cell.'}
        </Text>
        <View style={styles.chipsRow}>
          {allChips.length === 0 ? (
            <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
              Nothing in the pool yet.
            </Text>
          ) : allChips.map(renderPoolChip)}
        </View>
        {allowCustomEntry && interactable && !disabled ? (
          <View style={styles.customEntryRow}>
            {Platform.OS === 'web' ? (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={addCustomChip}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomChip(); }}
                placeholder={customEntryPlaceholder}
                maxLength={60}
                style={{
                  fontFamily: 'Comfortaa',
                  fontSize: FontSettingsStore.getScaledFontSize(13),
                  color: '#403F3E',
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid rgba(92, 90, 88, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                }}
              />
            ) : (
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={addCustomChip}
                onBlur={addCustomChip}
                placeholder={customEntryPlaceholder}
                placeholderTextColor="rgba(92, 90, 88, 0.55)"
                style={[styles.customInput, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}
                maxLength={60}
              />
            )}
          </View>
        ) : null}
      </MinkyPanel>

      {/* Column headers + grid rows */}
      <View style={styles.grid}>
        <View style={styles.headerRow}>
          <View style={styles.rowHeaderSpacer} />
          {columns.map((col) => (
            <Text
              key={col.id}
              style={[styles.colHeader, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}
              numberOfLines={1}
            >
              {col.label}
            </Text>
          ))}
        </View>
        {rows.map((row) => (
          <View key={row.id} style={styles.gridRow}>
            <Text
              style={[styles.rowHeader, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}
              numberOfLines={1}
            >
              {row.label}
            </Text>
            {columns.map((col) => {
              const cellChips = placement?.[row.id]?.[col.id] || [];
              return (
                <Pressable
                  key={`${row.id}-${col.id}`}
                  onPress={() => handleCellTap(row.id, col.id)}
                  disabled={disabled || !interactable}
                  style={styles.cell}
                >
                  <MinkyPanel
                    borderRadius={6}
                    padding={4}
                    paddingTop={4}
                    overlayColor={selectedChip ? 'rgba(160, 200, 140, 0.35)' : 'rgba(135, 180, 210, 0.18)'}
                  >
                    <View style={styles.cellChips}>
                      {cellChips.map(chipId => renderCellChip(chipId, row.id, col.id))}
                    </View>
                  </MinkyPanel>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  sectionLabel: {
    fontFamily: 'SuperStitch',
    fontWeight: '700',
    color: '#5C5A58',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cellChipText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
  },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
  },
  customEntryRow: { marginTop: 8 },
  customInput: {
    fontFamily: 'Comfortaa',
    color: '#403F3E',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  grid: { gap: 4 },
  headerRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  rowHeaderSpacer: { width: 56 },
  colHeader: {
    flex: 1,
    fontFamily: 'SuperStitch',
    fontWeight: '700',
    color: '#5C5A58',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  gridRow: { flexDirection: 'row', gap: 4, alignItems: 'stretch' },
  rowHeader: {
    width: 56,
    fontFamily: 'SuperStitch',
    fontWeight: '700',
    color: '#5C5A58',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingTop: 6,
  },
  cell: {
    flex: 1,
    minHeight: 42,
  },
  cellChips: { flexDirection: 'column', gap: 2 },
});

export default ChipMatrixGrid;
