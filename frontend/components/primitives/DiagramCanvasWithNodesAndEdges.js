import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';

/**
 * diagram-canvas-with-nodes-and-edges — conceptual diagram.
 * Spec: ../_meta-canonical/diagram-canvas-with-nodes-and-edges.json
 *
 * Edges: SVG quadratic Béziers on web (smooth curved arrows), straight thin Views on native.
 * Nodes: stitched MinkyPanel pills with active state. Tap to focus a node; connected edges
 * light up; the focus indicator panel below the canvas confirms the active selection.
 */
const NODE_W = 116;
const NODE_H = 60;

const DiagramCanvasWithNodesAndEdges = observer(({
  canvasTopology = 'flowchart-dag',
  nodes = [],
  edges = [],
  interaction = 'tap-node-to-detail',
  activePath,
  value,
  currentValue,
  width: widthProp,
  height: heightProp,
  aspectRatio = 1.5,
  minHeight = 220,
  interactable = true,
  onNodeTapped,
  onEdgeTraversed,
  onActivePathChanged,
  onZoomLayerRevealed,
  onValueChanged,
}) => {
  // Source of truth for active path: explicit `activePath` wins, then v2 `value`/`currentValue`,
  // then internal state. Persisted shape is a string[] of node IDs.
  const externalActive = activePath !== undefined
    ? activePath
    : (Array.isArray(value) ? value : (Array.isArray(currentValue) ? currentValue : undefined));
  const [internalActive, setInternalActive] = useState(() =>
    Array.isArray(externalActive) ? externalActive : []
  );
  const effectiveActive = externalActive !== undefined ? externalActive : internalActive;

  // Responsive sizing: when no explicit width is given, measure the parent and scale.
  const [measuredWidth, setMeasuredWidth] = useState(widthProp || 480);
  const width = widthProp || measuredWidth;
  const height = heightProp || Math.max(minHeight, Math.round(width / aspectRatio));

  const handleNodeTap = (node) => {
    if (!interactable) return;
    if (interaction === 'read-only') return;
    onNodeTapped && onNodeTapped(node);
    const nextActive = [node.id];
    if (activePath === undefined) {
      setInternalActive(nextActive);
    }
    onActivePathChanged && onActivePathChanged(nextActive);
    onValueChanged && onValueChanged(nextActive);
  };

  const focusedNode = effectiveActive?.length ? nodes.find(n => n.id === effectiveActive[0]) : null;

  const posOf = (node) => ({
    x: (node.position?.x ?? 50) / 100 * width,
    y: (node.position?.y ?? 50) / 100 * height,
  });

  // Find the perimeter point of a NODE_W x NODE_H box centered at `from`, on the line toward `to`.
  const attachPoint = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const adx = Math.abs(dx) / (NODE_W / 2);
    const ady = Math.abs(dy) / (NODE_H / 2);
    const t = 1 / Math.max(adx, ady, 0.0001);
    return { x: from.x + dx * t, y: from.y + dy * t };
  };

  return (
    <View
      style={styles.outer}
      onLayout={(e) => {
        if (!widthProp) setMeasuredWidth(Math.max(220, e.nativeEvent.layout.width));
      }}
    >
      <View style={[styles.canvas, { width, height }]}>
        {Platform.OS === 'web' ? (
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox={`0 0 ${width} ${height}`}
          >
            <defs>
              <marker id="diagram-arrow-default" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(92, 90, 88, 0.7)" />
              </marker>
              <marker id="diagram-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#7044C7" />
              </marker>
            </defs>
            {edges.map((edge, i) => {
              const fromNode = nodes.find(n => n.id === (edge.from || edge.from_id));
              const toNode = nodes.find(n => n.id === (edge.to || edge.to_id));
              if (!fromNode || !toNode) return null;
              const fromCtr = posOf(fromNode);
              const toCtr = posOf(toNode);
              const fromAttach = attachPoint(fromCtr, toCtr);
              const toAttach = attachPoint(toCtr, fromCtr);
              const isActive = effectiveActive?.includes(fromNode.id) || effectiveActive?.includes(toNode.id);

              const mx = (fromAttach.x + toAttach.x) / 2;
              const my = (fromAttach.y + toAttach.y) / 2;
              const dx = toAttach.x - fromAttach.x;
              const dy = toAttach.y - fromAttach.y;
              const norm = Math.sqrt(dx * dx + dy * dy) || 1;
              const bow = 24;
              const cx = mx + (-dy / norm) * bow;
              const cy = my + (dx / norm) * bow;
              const path = `M ${fromAttach.x} ${fromAttach.y} Q ${cx} ${cy}, ${toAttach.x} ${toAttach.y}`;

              return (
                <path
                  key={i}
                  d={path}
                  fill="none"
                  stroke={isActive ? '#7044C7' : 'rgba(92, 90, 88, 0.6)'}
                  strokeWidth={isActive ? 3 : 2}
                  strokeDasharray={isActive ? '0' : '6 4'}
                  markerEnd={`url(#${isActive ? 'diagram-arrow-active' : 'diagram-arrow-default'})`}
                />
              );
            })}
          </svg>
        ) : (
          edges.map((edge, i) => {
            const fromNode = nodes.find(n => n.id === (edge.from || edge.from_id));
            const toNode = nodes.find(n => n.id === (edge.to || edge.to_id));
            if (!fromNode || !toNode) return null;
            const fromCtr = posOf(fromNode);
            const toCtr = posOf(toNode);
            const fromAttach = attachPoint(fromCtr, toCtr);
            const toAttach = attachPoint(toCtr, fromCtr);
            const dx = toAttach.x - fromAttach.x;
            const dy = toAttach.y - fromAttach.y;
            const length = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const isActive = effectiveActive?.includes(fromNode.id) || effectiveActive?.includes(toNode.id);
            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: fromAttach.x,
                  top: fromAttach.y,
                  width: length,
                  height: isActive ? 3 : 2,
                  backgroundColor: isActive ? '#7044C7' : 'rgba(92, 90, 88, 0.6)',
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: '0 50%',
                }}
                pointerEvents="none"
              />
            );
          })
        )}

        {nodes.map(node => {
          const { x, y } = posOf(node);
          const isActive = effectiveActive?.includes(node.id);
          const isHub = node.kind === 'hub-anchor' || node.kind === 'focal-element';
          return (
            <Pressable
              key={node.id}
              onPress={() => handleNodeTap(node)}
              style={[
                styles.nodeWrap,
                {
                  left: x - NODE_W / 2,
                  top: y - NODE_H / 2,
                  width: NODE_W,
                  height: NODE_H,
                },
              ]}
              hitSlop={6}
            >
              <MinkyPanel
                borderRadius={isHub ? 32 : 14}
                padding={10}
                paddingTop={10}
                overlayColor={isActive ? 'rgba(135, 180, 210, 0.7)' : 'rgba(112, 68, 199, 0.25)'}
                borderColor={isActive ? '#7044C7' : 'rgba(92, 90, 88, 0.55)'}
                shape={isHub ? 'circular' : 'rect'}
              >
                <Text
                  style={[styles.nodeLabel, isActive && styles.nodeLabelActive, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}
                  numberOfLines={2}
                >
                  {node.label}
                </Text>
              </MinkyPanel>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.focusReadout}>
        <Text style={[styles.focusText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          {focusedNode
            ? `Focused: ${focusedNode.label}`
            : 'Tap any node to focus it.'}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: { gap: 12, alignItems: 'center', alignSelf: 'stretch' },
  canvas: {
    position: 'relative',
    backgroundColor: 'rgba(100, 130, 195, 0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  nodeWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textAlign: 'center',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  nodeLabelActive: { color: '#2D2C2B' },
  focusReadout: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  focusText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default DiagramCanvasWithNodesAndEdges;
