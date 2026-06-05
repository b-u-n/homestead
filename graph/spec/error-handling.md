---
schema_version: 2
id: spec/error-handling
type: spec
title: Error Handling
status: stable
last_audited: 2026-05-22
tags: [errors, ux]
source_doc:
  - doc/errors
governs:
  - component/ErrorStore
  - component/ErrorContainer
  - component/ErrorNotification
  - component/BlockingErrorModal
references:
  - spec/websocket-protocol
---

## Rules

### R1: Errors are exactly two kinds — non-blocking (toast) and blocking (modal)

Non-blocking errors render as a stacked toast (newest on top, auto-dismiss after 5.4s). Blocking errors render as a centered modal with a backdrop; the user MUST dismiss to continue. No third "warning" tier, no "info" tier — those are not errors.

**Why:** Two crisp tiers force the author to decide: can the user keep working, or must they acknowledge? A third tier collapses back to "non-blocking" in practice and adds UI complexity for no decision value.
**Evidence:** `md/ERRORS.md` § Overview, § Visual Design.
**Test:** Call `ErrorStore.addError(msg)` with no options → toast. Call with `{ blocking: true }` → modal. No other UI path.

### R2: Blocking flag is set by the producer (backend or frontend), never inferred

Backend handlers return `{ success: false, error, blocking: true }` for auth/critical errors. Frontend producers (e.g. `NETWORK_OFFLINE` from `/frontend/config/errors.js`) declare blocking themselves. `ErrorStore.addError` honors the flag, never derives it from message content.

**Why:** Heuristic guessing (e.g. "if message contains 'session' it's blocking") is unmaintainable. The producer knows; the producer says so.
**Evidence:** `md/ERRORS.md` § Backend Error Response, § Frontend Error Config.
**Test:** Pass a message that mentions "session" without `blocking: true`; expect toast, not modal.

### R3: Validation errors are ALWAYS non-blocking

Empty content, too-long content, invalid input, missing required field — all non-blocking. The user can fix and retry; there is no need to stop the world.

**Why:** Validation is a feedback signal, not an emergency. Modal-blocking on a too-long string is a user-hostile pattern.
**Evidence:** `md/ERRORS.md` § Error Categories table.
**Test:** Submit an empty form; expect toast, not modal.

### R4: Non-blocking errors auto-dismiss after 5.4 seconds; blocking errors NEVER auto-dismiss

The 5.4s constant is documented in `md/ERRORS.md`. Blocking errors set `duration: 0` (or simply skip the timeout) and persist until the user clicks dismiss.

**Why:** Toasts that linger feel broken; toasts that disappear too fast feel missed. 5.4s is the project-wide constant. Blocking errors are an explicit interaction that the user must complete.
**Evidence:** `md/ERRORS.md` § Visual Design.
**Test:** Add a non-blocking error; expect it gone in <6s. Add a blocking error; expect it present after 60s.

### R5: All WebSocket call sites MUST handle errors via `ErrorStore`

Pattern: `try { const result = await WebSocketService.emit(...); if (!result.success) ErrorStore.addError(result.error, { blocking: result.blocking }); } catch (e) { ErrorStore.addError('Connection failed', { blocking: false }); }`. No silent failures, no console-only error reporting in production paths.

**Why:** A failed emit with no UI surfaces as a button that does nothing — the worst UX failure mode. Routing through `ErrorStore` gives a consistent visible response.
**Evidence:** `md/ERRORS.md` § Component Usage; canonical handler in `md/WEBSOCKETS.md` § Form Submission.
**Test:** Disconnect the network; click a submit button; expect a toast.

### R6: Error sound plays on display and respects user sound settings

Both toast and modal play `/frontend/assets/sounds/error.mp3` on first render. The play call MUST route through `SoundManager` so user mute / volume settings are honored.

**Why:** A muted-sound app that still beeps is a bug. The sound system already gates this; the error code must use it.
**Evidence:** `md/ERRORS.md` § Sound.
**Test:** Mute sounds globally; trigger an error; expect no audio.

## Notes

`md/ERRORS.md` lists a "Future" section for error codes (i18n-friendly). When that lands, this spec gets a new rule and `errorCode` becomes part of the response envelope. Accessibility constraints (announce via `accessibilityLiveRegion`, focus trap in blocking modal) live in the same source doc and are part of the contract.
