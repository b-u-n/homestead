---
schema_version: 2
id: component/ErrorContainer
type: component
title: ErrorContainer
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/ErrorContainer.js
source_doc:
  - doc/errors
uses:
  - component/ErrorNotification
  - component/BlockingErrorModal
  - component/ErrorStore
---

## Purpose

Top-level renderer for the error system. Observes [[component/ErrorStore]] and dispatches each error to either [[component/ErrorNotification]] (non-blocking toast) or [[component/BlockingErrorModal]] (blocking modal). Renders the "Dismiss All" affordance when the non-blocking stack has 2+ errors.

## Notes

Mounted once near the root of the app layout. The two-renderer split keeps the toast and modal codepaths visually and behaviorally independent per [[spec/error-handling]] R1.
