import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';

/**
 * chart-trend-line-or-bar — data-bound chart (bar / line / sparkline / heatmap / gantt).
 *
 * View-positioned shapes for bars, dots, gantt, heatmap. Line / sparkline use SVG on web
 * (browser-native, no extra deps) and fall back to a chain of dots on native.
 */
const PAD_X = 14;
const PAD_Y = 16;

const ChartTrendLineOrBar = observer(({
  dataset = [],
  chartKind = 'bar',
  xAxisConfig = {},
  yAxisConfig = {},
  overlayLayers,
  referenceBand,
  colorLegend,
  rowHeaderLabels,
  columnHeaderLabels,
  scrollable = false,
  height = 180,
  onDataPointTapped,
  onRangeChanged,
  onDrillDownRequested,
}) => {
  const [chartWidth, setChartWidth] = useState(280);

  const yMin = yAxisConfig.min ?? Math.min(0, ...dataset.map(d => d.y));
  const yMax = yAxisConfig.max ?? Math.max(...dataset.map(d => d.y), 1);
  const yRange = yMax - yMin || 1;
  const ratioOf = (v) => (v - yMin) / yRange;

  const plotHeight = height - PAD_Y * 2;

  // Heatmap
  if (chartKind === 'heatmap-cell-grid') {
    const grid = dataset;
    const rows = rowHeaderLabels?.length || Math.max(...grid.map(g => g.row), 0) + 1;
    const cols = columnHeaderLabels?.length || Math.max(...grid.map(g => g.col), 0) + 1;
    const intensity = (r, c) => {
      const v = grid.find(g => g.row === r && g.col === c)?.y ?? 0;
      return ratioOf(v);
    };
    return (
      <View style={styles.wrap}>
        {columnHeaderLabels?.length ? (
          <View style={styles.heatHeaderRow}>
            <View style={{ width: 60 }} />
            {columnHeaderLabels.map((lbl, i) => (
              <Text key={i} style={[styles.heatHeader, { fontSize: FontSettingsStore.getScaledFontSize(9) }]}>{lbl}</Text>
            ))}
          </View>
        ) : null}
        {Array.from({ length: rows }).map((_, r) => (
          <View key={r} style={styles.heatRow}>
            {rowHeaderLabels?.[r] ? (
              <Text style={[styles.heatRowLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]} numberOfLines={1}>
                {rowHeaderLabels[r]}
              </Text>
            ) : <View style={{ width: 60 }} />}
            {Array.from({ length: cols }).map((__, c) => {
              const t = intensity(r, c);
              return (
                <Pressable
                  key={c}
                  onPress={() => onDataPointTapped && onDataPointTapped(grid.find(g => g.row === r && g.col === c))}
                  style={[styles.heatCell, { backgroundColor: `rgba(112, 68, 199, ${0.08 + t * 0.55})` }]}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  // Gantt
  if (chartKind === 'gantt-bar') {
    return (
      <View style={styles.wrap}>
        {dataset.map((d, i) => {
          const startPct = ((d.x ?? 0) / (xAxisConfig.max ?? 24)) * 100;
          const widthPct = ((d.duration ?? d.y ?? 1) / (xAxisConfig.max ?? 24)) * 100;
          return (
            <View key={i} style={styles.ganttRow}>
              {d.label ? (
                <Text style={[styles.ganttLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]} numberOfLines={1}>
                  {d.label}
                </Text>
              ) : null}
              <View style={styles.ganttTrack}>
                <Pressable
                  onPress={() => onDataPointTapped && onDataPointTapped(d)}
                  style={[
                    styles.ganttBar,
                    { left: `${startPct}%`, width: `${widthPct}%`, backgroundColor: d.color || 'rgba(135, 180, 210, 0.7)' },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // Bar / line / sparkline / dual-axis — share a plot area
  const isLine = chartKind === 'line' || chartKind === 'sparkline-trend';

  // Reference band — y in plot coordinates (account for PAD_Y)
  const refBandTop = referenceBand ? PAD_Y + (1 - ratioOf(referenceBand.yMax)) * plotHeight : null;
  const refBandHeight = referenceBand ? Math.abs(ratioOf(referenceBand.yMax) - ratioOf(referenceBand.yMin)) * plotHeight : null;

  // Line / sparkline points for SVG polyline
  const pointAt = (i) => {
    const x = PAD_X + (dataset.length === 1 ? 0 : (i / (dataset.length - 1)) * (chartWidth - PAD_X * 2));
    const y = PAD_Y + (1 - ratioOf(dataset[i].y)) * plotHeight;
    return { x, y };
  };
  const linePoints = isLine && dataset.length > 1
    ? dataset.map((_, i) => { const p = pointAt(i); return `${p.x},${p.y}`; }).join(' ')
    : null;
  const areaPoints = linePoints
    ? `${PAD_X},${PAD_Y + plotHeight} ${linePoints} ${PAD_X + (chartWidth - PAD_X * 2)},${PAD_Y + plotHeight}`
    : null;

  return (
    <View style={styles.wrap} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.chartArea, { height }]}>
        {referenceBand ? (
          <View style={[styles.referenceBand, { top: refBandTop, height: refBandHeight }]}>
            {referenceBand.label ? (
              <Text style={[styles.refBandLabel, { fontSize: FontSettingsStore.getScaledFontSize(9) }]}>
                {referenceBand.label}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Line / sparkline — SVG polyline on web */}
        {isLine && linePoints && Platform.OS === 'web' ? (
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox={`0 0 ${chartWidth} ${height}`}
            preserveAspectRatio="none"
          >
            <polygon points={areaPoints} fill="rgba(112, 68, 199, 0.18)" />
            <polyline
              points={linePoints}
              fill="none"
              stroke="#7044C7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}

        {dataset.map((d, i) => {
          if (chartKind === 'bar') {
            const totalBars = dataset.length;
            const slot = (chartWidth - PAD_X * 2) / totalBars;
            const barWidth = Math.max(8, slot * 0.7);
            const left = PAD_X + i * slot + (slot - barWidth) / 2;
            const barHeight = Math.max(2, ratioOf(d.y) * plotHeight);
            return (
              <Pressable
                key={i}
                onPress={() => onDataPointTapped && onDataPointTapped(d)}
                style={{
                  position: 'absolute',
                  left,
                  width: barWidth,
                  bottom: PAD_Y,
                  height: barHeight,
                  backgroundColor: 'rgba(112, 68, 199, 0.7)',
                  borderTopLeftRadius: 5,
                  borderTopRightRadius: 5,
                }}
              />
            );
          }

          // Dot for line / sparkline
          const p = pointAt(i);
          return (
            <Pressable
              key={i}
              onPress={() => onDataPointTapped && onDataPointTapped(d)}
              style={[styles.dot, { left: p.x - 7, top: p.y - 7 }]}
            />
          );
        })}
      </View>

      {xAxisConfig.tickLabels ? (
        <View style={[styles.xAxisRow, { paddingHorizontal: PAD_X }]}>
          {xAxisConfig.tickLabels.map((lbl, i) => (
            <Text key={i} style={[styles.xLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]} numberOfLines={1}>
              {lbl}
            </Text>
          ))}
        </View>
      ) : null}

      {colorLegend?.length ? (
        <View style={styles.legendRow}>
          {colorLegend.map((l, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: l.color || 'rgba(112, 68, 199, 0.7)' }]} />
              <Text style={[styles.legendLabel, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>{l.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  chartArea: {
    position: 'relative',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 90, 88, 0.55)',
  },
  referenceBand: {
    position: 'absolute',
    left: 0, right: 0,
    backgroundColor: 'rgba(160, 200, 140, 0.25)',
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(160, 200, 140, 0.65)',
    borderStyle: 'dashed',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  refBandLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#3F6B26',
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dot: {
    position: 'absolute',
    width: 14, height: 14,
    borderRadius: 7,
    backgroundColor: '#7044C7',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  xAxisRow: { flexDirection: 'row', justifyContent: 'space-around' },
  xLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  legendRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heatHeaderRow: { flexDirection: 'row', gap: 2 },
  heatHeader: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heatRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  heatRowLabel: {
    width: 60,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heatCell: { flex: 1, height: 22, borderRadius: 3 },
  ganttRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  ganttLabel: {
    width: 80,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ganttTrack: {
    flex: 1,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(100, 130, 195, 0.15)',
    position: 'relative',
    overflow: 'hidden',
  },
  ganttBar: {
    position: 'absolute',
    top: 0, bottom: 0,
    borderRadius: 3,
  },
});

export default ChartTrendLineOrBar;
