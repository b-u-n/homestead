---
schema_version: 2
id: pattern/modal-overlay-with-sound
type: pattern
title: Modal Overlay With Sound
status: stable
last_audited: 2026-05-22
references:
  - spec/modal-pattern
---

## Pattern

A full-screen modal shell that:
1. Renders a backdrop (raw `<div>` on web, `<Pressable>` on native) covering the viewport
2. Renders content centered/sized within the backdrop
3. Plays `SoundManager.play('openActivity')` on first visible, `closeActivity` on dismiss
4. Optionally layers an `additionalOpenSound` for surface-specific cues
5. Exposes `playSound={false}` opt-out for nested-modal cases
6. Owns its own scroll reset (`scrollResetKey` walks descendants and zeros `scrollTop`)

## When to use

Any full-screen overlay UI: settings modal, drop wrapper, error dialog, payment modal, accessibility modal. Always reach for `component/Modal` — do NOT reimplement the shell.

Do NOT use for: dropdown menus (which are anchored, not full-screen — see [[pattern/close-on-outside-click]]), inline expansion panels, or non-blocking notifications.

## Notes

The two-sound-on-open contract is unusual — most modal libraries assume one sound or none. The `additionalOpenSound` slot exists because some surfaces (e.g. Wishing Well drop) want a thematic chime layered over the standard activity-open sound.
