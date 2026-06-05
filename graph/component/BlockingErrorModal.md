---
schema_version: 2
id: component/BlockingErrorModal
type: component
title: BlockingErrorModal
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/BlockingErrorModal.js
source_doc:
  - doc/errors
---

## Purpose

The blocking error modal. Centered overlay with dimmed backdrop; user must click Dismiss to continue. No auto-dismiss. Plays error sound on mount and traps focus for accessibility.

## Notes

Governed by [[spec/error-handling]] (R1, R4). Visually a red-tinted variant of the standard modal aesthetic; does NOT reuse `component/Modal` directly because it bypasses the close-on-backdrop behavior.
