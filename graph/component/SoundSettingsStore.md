---
schema_version: 2
id: component/SoundSettingsStore
type: component
title: SoundSettingsStore
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/stores/SoundSettingsStore.js
belongs_to:
  - concept/user-settings
source_doc:
  - doc/usersettings
---

## Purpose

MobX singleton store for per-user sound preferences. Holds a `Map<soundKey, { volume?, enabled? }>`. Exposes `getVolume(soundKey, defaultVolume)`, `isEnabled(soundKey)`, `updateSound`, `resetSound`, `resetAll`, plus `loadFromServer()` and `rehydrate()` for the local-first / server-precedence sync flow (per `spec/user-settings-modal` R1, R2).

## Notes

Local-storage key: `@homestead:soundSettings`. Mirrored on the backend by `Account.soundSettings` (Mongoose `Map`).
