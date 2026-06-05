---
schema_version: 2
id: component/ThemeStore
type: component
title: ThemeStore
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/stores/ThemeStore.js
belongs_to:
  - concept/user-settings
source_doc:
  - doc/usersettings
---

## Purpose

MobX singleton store for theme color overrides. Holds `globalSettings` (app-wide MinkyPanel + WoolButton colors) and `flowSettings` (per-flow overrides keyed by flow name, each with an `enabled` gate). Exposes resolution helpers `getMinkyColor(flowName, variant)` and `getWoolColor(variant, state, flowName)` implementing the priority chains from `spec/user-settings-modal` R4 and R5. Persisted both locally (`@homestead:themeSettings`) and to `Account.themeSettings`.

## Notes

This is the store that `component/MinkyPanel` and `component/ButtonBase` read at render time (via `FlowContext`) to apply the user's theme — see `spec/user-settings-modal` R6.
