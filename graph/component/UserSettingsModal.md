---
schema_version: 2
id: component/UserSettingsModal
type: component
title: UserSettingsModal
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/UserSettingsModal.js
belongs_to:
  - concept/user-settings
uses:
  - component/SoundSettingsStore
  - component/ThemeStore
source_doc:
  - doc/usersettings
---

## Purpose

The user-facing settings surface. Renders the sound-settings and theme-settings UIs (sliders, toggles, color pickers) backed by `SoundSettingsStore` and `ThemeStore`. Edits are debounced into `soundSettings:update` / `themeSettings:update` WebSocket events; reset buttons call the corresponding reset events.

## Notes

The modal itself wraps the standard `Modal` component (per the modal pattern). Theme/sound logic delegates to the two MobX stores — the modal is a view layer over their reactive state.
