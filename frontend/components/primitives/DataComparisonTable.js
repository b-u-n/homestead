import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';

/**
 * data-comparison-table — multi-column tabular surface, one row per record.
 * Spec: ../_meta-canonical/data-comparison-table.json
 */
const DataComparisonTable = observer(({
  tableKind = 'comparison-multi-attr',
  columnDefinitions = [],
  rows = [],
  rowInteraction = 'read-only',
  headerTreatment = 'sticky-column-headers',
  sortState,
  value,
  currentValue,
  interactable = true,
  onRowTapped,
  onRowExpanded,
  onRowEdited,
  onRowAdded,
  onRowDeleted,
  onTableSorted,
  onValueChanged,
}) => {
  // v2 persisted shape: `{ sort: { columnKey, direction } | null, expandedIds: { [id]: true } }`.
  const persisted = (value && typeof value === 'object' && !Array.isArray(value))
    ? value
    : ((currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)) ? currentValue : null);
  const [expandedIds, setExpandedIds] = useState(() =>
    persisted?.expandedIds && typeof persisted.expandedIds === 'object' ? persisted.expandedIds : {}
  );
  const [internalSort, setInternalSort] = useState(() =>
    persisted?.sort ?? sortState ?? null
  );

  const sort = internalSort;

  const emit = (nextSort, nextExpanded) => {
    onValueChanged && onValueChanged({ sort: nextSort, expandedIds: nextExpanded });
  };

  const sortedRows = (() => {
    if (!sort?.columnKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a.cells?.[sort.columnKey];
      const bv = b.cells?.[sort.columnKey];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sort.direction === 'desc' ? -cmp : cmp;
    });
  })();

  const toggleSort = (col) => {
    if (!interactable) return;
    if (col.kind === 'static') return;
    let next;
    if (!sort || sort.columnKey !== col.key) next = { columnKey: col.key, direction: 'asc' };
    else if (sort.direction === 'asc') next = { columnKey: col.key, direction: 'desc' };
    else next = null;
    setInternalSort(next);
    onTableSorted && onTableSorted(next);
    emit(next, expandedIds);
  };

  const toggleExpand = (id) => {
    if (!interactable) return;
    const next = { ...expandedIds, [id]: !expandedIds[id] };
    setExpandedIds(next);
    if (next[id]) onRowExpanded && onRowExpanded(id);
    emit(sort, next);
  };

  return (
    <View style={styles.wrap}>
      {headerTreatment !== 'no-headers' ? (
        <View style={styles.headerRow}>
          {columnDefinitions.map((col, i) => {
            const isSorted = sort?.columnKey === col.key;
            return (
              <Pressable key={col.key ?? i} onPress={() => toggleSort(col)} style={[styles.headerCell, col.flex ? { flex: col.flex } : { flex: 1 }]}>
                <Text style={[styles.headerText, isSorted && styles.headerTextSorted, { fontSize: FontSettingsStore.getScaledFontSize(11) }]} numberOfLines={1}>
                  {col.label}
                  {isSorted ? (sort.direction === 'asc' ? ' ▴' : ' ▾') : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={styles.body}>
        {sortedRows.map((row, ri) => {
          const id = row.id ?? ri;
          const isExpanded = !!expandedIds[id];
          return (
            <View key={id} style={styles.rowGroup}>
              <Pressable
                onPress={() => {
                  if (!interactable) return;
                  if (rowInteraction === 'expandable') toggleExpand(id);
                  onRowTapped && onRowTapped(row);
                }}
                style={[styles.row, ri % 2 === 1 && styles.rowAlt]}
              >
                {columnDefinitions.map((col, ci) => (
                  <View key={col.key ?? ci} style={[styles.cell, col.flex ? { flex: col.flex } : { flex: 1 }]}>
                    <Text style={[styles.cellText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]} numberOfLines={2}>
                      {row.cells?.[col.key] ?? ''}
                    </Text>
                  </View>
                ))}
                {rowInteraction === 'expandable' ? (
                  <Text style={[styles.expandGlyph, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                    {isExpanded ? '▾' : '▸'}
                  </Text>
                ) : null}
              </Pressable>
              {isExpanded && row.expandedPayload ? (
                <View style={styles.expandedPanel}>
                  {row.expandedPayload}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { borderRadius: 8, overflow: 'hidden' },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(100, 130, 195, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.25)',
  },
  headerCell: { },
  headerText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerTextSorted: { color: '#7044C7' },
  body: { },
  rowGroup: { },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.15)',
  },
  rowAlt: { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  cell: { },
  cellText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  expandGlyph: { color: '#7044C7' },
  expandedPanel: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(112, 68, 199, 0.08)',
  },
});

export default DataComparisonTable;
