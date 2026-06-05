---
schema_version: 2
id: pattern/portrait-rotation-coordinate-transform
type: pattern
title: Portrait Rotation Coordinate Transform
status: stable
last_audited: 2026-05-22
references:
  - spec/mobile-wheel-touch
---

## Pattern

When the app forces landscape rendering on a physically portrait phone, `Modal` applies `transform: rotate(90deg) translateY(-Hpx)` with `transformOrigin: top left`. Physical viewport axes no longer match the container's local axes. To map physical touch coordinates `(physX, physY)` into local container coordinates, swap axes AND invert the short axis:

```js
if (uxStore.isPortrait) {
  localX = physY;                          // physical Y → local X
  localY = contRect.width - physX;         // physical X → local Y (INVERTED)
  containerW = contRect.height;            // physical height = local width (long axis)
  containerH = contRect.width;             // physical width = local height (short axis)
} else {
  localX = physX;
  localY = physY;
  containerW = contRect.width;
  containerH = contRect.height;
}
```

For scroll deltas the same swap applies:
```js
if (uxStore.isPortrait) {
  el.scrollLeft += dy;
  el.scrollTop += dx;
} else {
  el.scrollLeft += dx;
  el.scrollTop += dy;
}
```

## When to use

Any touch interaction inside a Modal that needs to read physical coordinates and act in local space: color wheel (`PixelEditor`), HSB sliders (`TouchSlider`), drift-scroll while painting, manual scroll after wheel dismiss. NOT needed for `document.elementFromPoint()` — the browser handles CSS transforms there automatically.

## Notes

The mandatory inversion (`contRect.width - physX`) corresponds to the direction-flip of a 90° clockwise rotation. Missing it produces the classic "the wheel tracks horizontally but vertical is reversed" bug. Per-axis testing is the only reliable way to verify both directions work.

Per CSS spec, `position: fixed` inside a transformed ancestor degrades to `position: absolute`. Use `position: absolute` explicitly and compute coordinates in the container's local space — see [[spec/mobile-wheel-touch]] notes.
