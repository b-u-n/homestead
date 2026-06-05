---
schema_version: 2
id: component/ErrorNotification
type: component
title: ErrorNotification
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/ErrorNotification.js
source_doc:
  - doc/errors
---

## Purpose

The non-blocking error toast. Renders a single error as a red-tinted minky patch in the stacked overlay. Tap-anywhere-to-dismiss; auto-dismisses after 5.4s. Plays the error sound on mount through SoundManager.

## Notes

Governed by [[spec/error-handling]] (R1, R4, R6). Stacks with newest-on-top behavior driven by render order in [[component/ErrorContainer]].
