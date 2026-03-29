import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return [0, 0, 0];
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v =>
    Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')
  ).join('');
}

// Three palettes split from the cottagecore spectrum
const CREAMS = [
  '#FFFFFF', '#FFF8F0', '#F5E6D8', '#E8D4C8', '#F5C6AA',
  '#FFCBA4', '#F5DCC8', '#EED0B4',
];
// Vibrants tilted toward creams (lighter, softer versions)
const VIBRANTS_LIGHT = [
  '#D88A95', '#D08888', '#D8A080', '#C8A880',
  '#D0B060', '#B8A888', '#98C0A0', '#90B898', '#80B098',
  '#90B8C8', '#88A8C8', '#8898B8', '#A088D0', '#B098C8',
  '#C0A8C8', '#C898C0',
];
const VIBRANTS = [
  '#CC4455', '#B83A4A', '#CC6633', '#A07040',
  '#B8860B', '#8B7355', '#6B9E7A', '#5A8A68', '#467A58',
  '#5A8AAA', '#4A78A8', '#4A6898', '#7044C7', '#8B5CB0',
  '#A07AB0', '#B060A8',
];
// Vibrants tilted toward darks (deeper, moodier versions)
const VIBRANTS_DARK = [
  '#531822', '#49161D', '#532914', '#402B18',
  '#493505', '#362B1D', '#233E2B', '#223522', '#182C1D',
  '#22353E', '#1D2B3E', '#1D2235', '#2B1853', '#361F48',
  '#3E2B48', '#482143',
];
const DARKS = [
  '#362030', '#341E36', '#0A0508', '#000000', '#08050A',
  '#2E1E3A', '#1E1E3A', '#1E303A', '#1E3A30', '#303A1E',
  '#3A361E', '#3A301E',
];

/**
 * Single mini wheel: draws colors around the edge, white in center.
 */
// centerBrightness: how much to lighten toward white at center (0.0 = no change, 1.0 = white)
// centerTint: [r,g,b] override for center color instead of white (e.g. cream or grey)
const MiniWheel = ({ colors, size, currentColor, onChange, onCommit, centerBrightness = 1.0, centerTint = null, isDragging, onDragStart, alwaysTrack = false, showIndicator = false, mirrorPos = null, onPickPos = null, isActiveWheel = false }) => {
  const canvasRef = useRef(null);
  const diskRef = useRef(null);
  const lastPickRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const r = size / 2;
    const colorCount = colors.length;

    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx = px - r;
        const dy = py - r;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > r + 1) continue;
        // Smooth anti-alias at edge (2px feather)
        const alpha = dist > r - 2 ? Math.max(0, (r - dist + 1) / 2) : 1;

        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (angle < 0) angle += 360;

        const colorPos = (angle / 360) * colorCount;
        const idx1 = Math.floor(colorPos) % colorCount;
        const idx2 = (idx1 + 1) % colorCount;
        const t = colorPos - Math.floor(colorPos);

        const rgb1 = hexToRgb(colors[idx1]);
        const rgb2 = hexToRgb(colors[idx2]);

        let cr = rgb1[0] + (rgb2[0] - rgb1[0]) * t;
        let cg = rgb1[1] + (rgb2[1] - rgb1[1]) * t;
        let cb = rgb1[2] + (rgb2[2] - rgb1[2]) * t;

        // normDist: 0 = center, 1 = edge
        // Smoothstep blend: center fades toward background color (#E8D4C8), edges are full color
        // This looks like transparency but the pixel is still opaque (clickable)
        const d = dist / r;
        const ss = d * d * (3 - 2 * d);
        cr = 232 + (cr - 232) * ss; // 232 = 0xE8
        cg = 212 + (cg - 212) * ss; // 212 = 0xD4
        cb = 200 + (cb - 200) * ss; // 200 = 0xC8
        const centerOpacity = 1.0;

        const offset = (py * size + px) * 4;
        data[offset] = Math.round(cr);
        data[offset + 1] = Math.round(cg);
        data[offset + 2] = Math.round(cb);
        data[offset + 3] = Math.round(255 * alpha * centerOpacity);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [colors, size]);


  const handleInteraction = useCallback((clientX, clientY, force = false) => {
    if (!diskRef.current || !canvasRef.current) return;
    const rect = diskRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const r = size / 2;
    if (Math.sqrt((x - r) ** 2 + (y - r) ** 2) > r) return;

    // Throttle drag: only pick if moved at least 2px since last pick
    const dx = x - lastPickRef.current.x;
    const dy = y - lastPickRef.current.y;
    if (!force && Math.sqrt(dx * dx + dy * dy) < 2) return;
    lastPickRef.current = { x, y };

    const ctx = canvasRef.current.getContext('2d');
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || px >= size || py < 0 || py >= size) return;
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    if (pixel[3] === 0) return;

    // Report normalized position (0-1 range) to parent for mirroring
    onPickPos?.({ nx: px / size, ny: py / size });
    onChange?.(rgbToHex(pixel[0], pixel[1], pixel[2]));
  }, [size, onChange]);

  if (Platform.OS !== 'web') return null;

  return (
    <div
      ref={diskRef}
      style={{
        width: size,
        height: size,
        cursor: 'crosshair',
        borderRadius: '50%',
        overflow: 'hidden',
        border: 'none',
        flexShrink: 0,
        position: 'relative',
      }}
      onMouseDown={(e) => {
        onDragStart?.();
        lastPickRef.current = { x: -999, y: -999 };
        handleInteraction(e.clientX, e.clientY, true);
      }}
      onMouseMove={(e) => {
        if (isDragging || alwaysTrack) handleInteraction(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onDragStart?.();
        lastPickRef.current = { x: -999, y: -999 };
        const t = e.touches[0];
        handleInteraction(t.clientX, t.clientY, true);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        const t = e.touches[0];
        handleInteraction(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        onCommit?.();
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block' }}
      />
      {mirrorPos && (() => {
        const ix = mirrorPos.nx * size;
        const iy = mirrorPos.ny * size;
        const r = size / 2;
        const inCircle = Math.sqrt((ix - r) ** 2 + (iy - r) ** 2) <= r;
        if (!inCircle) return null;
        const dotSize = isActiveWheel ? 8 : 5;
        const opacity = isActiveWheel ? 1 : 0.6;
        return (
          <div style={{
            position: 'absolute',
            left: ix - dotSize / 2,
            top: iy - dotSize / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            border: `${isActiveWheel ? 2 : 1.5}px solid rgba(255,255,255,${opacity})`,
            boxShadow: `0 0 2px rgba(0,0,0,${opacity * 0.5})`,
            pointerEvents: 'none',
          }} />
        );
      })()}
    </div>
  );
};

/**
 * Five stacked cottagecore color wheels:
 *   1. Creams & warm lights
 *   2. Vibrants tilted light (soft pastels)
 *   3. Vibrants (core mid-tones)
 *   4. Vibrants tilted dark (deep moody)
 *   5. Darks & neutrals
 */
// Single-color wheels: each has shades of one cottagecore hue
// Built by taking a base color and creating lighter/darker variants around it
const CORAL_SHADES = ['#FFB0A0', '#FF8878', '#FF6B6B', '#E85D60', '#CC4455', '#A03040', '#702028'];
const RUST_SHADES = ['#E8B888', '#D49868', '#CC6633', '#A85028', '#8A3A1A', '#682810', '#481808'];
const GOLD_SHADES = ['#E8D088', '#D4B860', '#B8860B', '#9A7008', '#785808', '#584006', '#382804'];
const SAGE_SHADES = ['#C0E8C8', '#98D0A8', '#6B9E7A', '#5A8A68', '#467A58', '#305840', '#1E3828'];
const SKY_SHADES = ['#B0D8F0', '#88C0E0', '#5A8AAA', '#4A78A8', '#3A6090', '#284870', '#183050'];
const PURPLE_SHADES = ['#C8A8E8', '#B088D8', '#7044C7', '#5830A8', '#402088', '#301868', '#200E48'];
const PINK_SHADES = ['#F0C0E0', '#E0A0D0', '#DE86DF', '#B060A8', '#904090', '#682868', '#481848'];

const WHEEL_CONFIGS = [
  // Row 1: spectrum wheels
  { colors: CREAMS, centerBrightness: 1.0, centerTint: null },
  { colors: VIBRANTS_LIGHT, centerBrightness: 1.0, centerTint: null },
  { colors: VIBRANTS, centerBrightness: 0.35, centerTint: [230, 220, 210] },
  // Row 2: single-color wheels (warm)
  { colors: CORAL_SHADES, centerBrightness: 0.6, centerTint: [255, 230, 220] },
  { colors: RUST_SHADES, centerBrightness: 0.6, centerTint: [240, 220, 200] },
  { colors: GOLD_SHADES, centerBrightness: 0.6, centerTint: [240, 230, 200] },
  // Row 3: single-color wheels (cool)
  { colors: SAGE_SHADES, centerBrightness: 0.6, centerTint: [220, 240, 225] },
  { colors: SKY_SHADES, centerBrightness: 0.6, centerTint: [220, 235, 250] },
  { colors: PURPLE_SHADES, centerBrightness: 0.6, centerTint: [230, 220, 245] },
  // Row 4: pink + darks
  { colors: PINK_SHADES, centerBrightness: 0.6, centerTint: [245, 220, 240] },
  { colors: VIBRANTS_DARK, centerBrightness: 0.5, centerTint: null },
  { colors: DARKS, centerBrightness: 0.7, centerTint: [140, 120, 105] },
];

/**
 * Color wheel component.
 * If singleIndex is provided (0-11), renders only that one wheel at full size.
 * Otherwise renders all 5 stacked.
 */
const ColorWheel = ({ color = '#000000', onChange, onCommit, visible = true, size = 120, hideToggle = false, onToggleVisible, singleIndex = null, alwaysTrack = false, selectedIndex = null, onSelectIndex = null, columns = null }) => {
  const [dragging, setDragging] = useState(false);
  const [pickPos, setPickPos] = useState(null); // { nx, ny } normalized 0-1

  useEffect(() => {
    if (Platform.OS !== 'web' || !dragging) return;
    const handleUp = () => setDragging(false);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, [dragging]);

  if (Platform.OS !== 'web' || !visible) return null;

  const dragProps = { isDragging: dragging, onDragStart: () => setDragging(true) };

  // Single wheel mode (carousel / overlay)
  if (singleIndex !== null && singleIndex !== undefined) {
    const cfg = WHEEL_CONFIGS[singleIndex] || WHEEL_CONFIGS[2];
    return (
      <MiniWheel
        colors={cfg.colors}
        size={size}
        currentColor={color}
        onChange={onChange}
        onCommit={onCommit}
        centerBrightness={cfg.centerBrightness}
        centerTint={cfg.centerTint}
        alwaysTrack={alwaysTrack}
        showIndicator={true}
        isActiveWheel={true}
        mirrorPos={pickPos}
        onPickPos={setPickPos}
        {...dragProps}
      />
    );
  }

  // Grid mode: configurable columns (default 4)
  const cols = columns || 4;
  const gap = 4;
  const wheelSize = Math.floor((size - gap * (cols - 1)) / cols);

  return (
    <View style={styles.grid}>
      {WHEEL_CONFIGS.map((cfg, i) => (
        <Pressable key={i} onPress={() => onSelectIndex?.(i)}>
          <View style={selectedIndex === i ? styles.wheelSelected : undefined}>
            <MiniWheel
              colors={cfg.colors}
              size={wheelSize}
              currentColor={color}
              onChange={onChange}
              centerBrightness={cfg.centerBrightness}
              centerTint={cfg.centerTint}
              showIndicator={true}
              mirrorPos={pickPos}
              onPickPos={setPickPos}
              isActiveWheel={selectedIndex === i}
              {...dragProps}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
  },
  wheelSelected: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(192, 170, 220, 0.7)',
  },
});

export default ColorWheel;
