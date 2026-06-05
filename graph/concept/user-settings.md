---
schema_version: 2
id: concept/user-settings
type: concept
title: User Settings (Sound + Theme)
status: stable
last_audited: 2026-05-22
kind: feature
source_doc:
  - doc/usersettings
---

## Overview

The user-facing preference surface: per-user sound volume/enable and per-flow theme color overrides. Settings persist locally (localStorage / AsyncStorage) for immediate access and sync to MongoDB via the `Account` model. Server values take precedence on load. The two stores (`SoundSettingsStore`, `ThemeStore`) are MobX observables that components subscribe to for reactive updates.

## Notes

Anchor for `component/UserSettingsModal`, `component/SoundSettingsStore`, `component/ThemeStore`, `spec/user-settings-modal`, and `spec/theme-color-resolution`. The full schema, color-resolution-order tables, and default colors live in `md/USERSETTINGS.md` per R6.
