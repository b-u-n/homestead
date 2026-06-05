import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * layout-quadrant-or-grid-cells — fixed N×M cell grid.
 */
const parseDimensions = (dim) => {
  if (typeof dim === 'string' && dim.includes('x')) {
    const [r, c] = dim.split('x').map(s => parseInt(s, 10));
    if (!isNaN(r) && !isNaN(c)) return { rows: r, cols: c };
  }
  if (dim === '3-column-kanban') return { rows: 1, cols: 3 };
  if (dim === '5-column-kanban') return { rows: 1, cols: 5 };
  return { rows: 2, cols: 2 };
};

const LayoutQuadrantOrGridCells = observer(({
  gridDimensions = '2x2',
  cellRole = 'static-named-slot',
  rowAxisLabels,
  columnAxisLabels,
  cellPayloads = [],
  namedQuadrantLabels,
  onCellTapped,
  onCellDropReceived,
  onCellValueChanged,
}) => {
  const { rows, cols } = parseDimensions(gridDimensions);

  const findPayload = (r, c) => cellPayloads.find(p => p.row === r && p.col === c);
  const namedLabel = (r, c) => {
    if (!namedQuadrantLabels) return null;
    const idx = r * cols + c;
    return namedQuadrantLabels[idx] || null;
  };

  return (
    <View style={styles.wrap}>
      {columnAxisLabels?.length ? (
        <View style={styles.colHeaderRow}>
          {rowAxisLabels?.length ? <View style={styles.rowHeaderSpacer} /> : null}
          {columnAxisLabels.map((lbl, i) => (
            <Text key={i} style={[styles.colHeader, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
              {lbl}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.gridBody}>
        {Array.from({ length: rows }).map((_, r) => (
          <View key={r} style={styles.gridRow}>
            {rowAxisLabels?.[r] ? (
              <Text
                style={[styles.rowHeader, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}
                numberOfLines={2}
              >
                {rowAxisLabels[r]}
              </Text>
            ) : null}
            {Array.from({ length: cols }).map((__, c) => {
              const payload = findPayload(r, c);
              const label = namedLabel(r, c) || payload?.label;
              const content = payload?.content;
              return (
                <Pressable
                  key={c}
                  style={styles.cell}
                  onPress={() => onCellTapped && onCellTapped({ row: r, col: c, payload })}
                >
                  <MinkyPanel
                    borderRadius={8}
                    padding={8}
                    paddingTop={8}
                    overlayColor={cellRole === 'drop-target' ? 'rgba(100, 130, 195, 0.25)' : 'rgba(112, 68, 199, 0.15)'}
                  >
                    {label ? (
                      <Text style={[styles.cellLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]} numberOfLines={2}>
                        {label}
                      </Text>
                    ) : null}
                    {content ? (
                      <View style={styles.cellContent}>{content}</View>
                    ) : (
                      cellRole === 'drop-target' && !content ? (
                        <Text style={[styles.dropPlaceholder, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
                          (drop here)
                        </Text>
                      ) : null
                    )}
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
  wrap: { gap: 4 },
  colHeaderRow: { flexDirection: 'row', gap: 6 },
  colHeader: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  rowHeaderSpacer: { width: 60 },
  gridBody: { gap: 6 },
  gridRow: { flexDirection: 'row', gap: 6 },
  rowHeader: {
    width: 60,
    alignSelf: 'center',
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cell: { flex: 1, minHeight: 64 },
  cellLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cellContent: { marginTop: 4 },
  dropPlaceholder: {
    fontFamily: 'Comfortaa',
    fontStyle: 'italic',
    color: 'rgba(69, 67, 66, 0.5)',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default LayoutQuadrantOrGridCells;
