---
schema_version: 2
id: spec/architecture-overview
type: spec
title: Architecture Overview
status: stable
last_audited: 2026-05-22
tags: [architecture, system]
source_doc:
  - doc/architecture
  - doc/claude
references:
  - spec/design-tokens
  - pattern/mobx-store
  - pattern/socket-emit-await
  - pattern/user-object-shape
---

## Rules

### R1: Frontend and backend communicate via WebSocket; HTTP is for static assets only

Stateful operations (auth, profile, posts, activities, hearts, inventory, sessions) flow through Socket.IO events with ack-callback responses. HTTP `/api/*` and `/public/*` serve static assets (avatars, audio, images) and one-shot uploads. No REST CRUD endpoints for app state.

**Why:** Single transport surface = single auth surface, single broadcast surface, single error surface. The wire is the contract; see [[concept/wire-protocol]].
**Evidence:** `backend/src/server.js` mounts Socket.IO; `frontend/services/websocket.js` is the single emit point; HTTP routes under `backend/src/routes/` serve only static files and avatar generation callbacks.
**Test:** `grep -r "fetch(" /git/homestead/frontend/components/` — any matches that aren't asset URLs are violations.

### R2: Frontend state lives in MobX stores; React state is for local UI only

All cross-component or persisted state lives in a `frontend/stores/*Store.js` MobX store. Components consume via `observer` from `mobx-react-lite`. `useState` is reserved for local UI state (toggles, in-progress text fields).

**Why:** MobX is the single state model. Splitting state between MobX and Context/Redux/zustand would force every reader to know which store applies where.
**Evidence:** 20+ stores under `frontend/stores/`; every one uses `makeAutoObservable`. See [[pattern/mobx-store]].
**Test:** Manual — any store-shaped logic in a component is a candidate for extraction.

### R3: The user object has a fixed shape `{ id, name, avatar, color }` on every embedded reference

Any persisted reference to a user (post author, response author, post.parent.user) MUST be a snapshot object `{ id, name, avatar, color }` built from the Account document. Do NOT store only `accountId` and resolve at read time.

**Why:** Self-contained documents — a post or response renders without secondary lookups. Avatar/color drift after a user changes their profile is acceptable; the alternative is N+1 queries on every list render.
**Evidence:** `md/ARCHITECTURE.md` "User Object Pattern"; backend models embed `user: { id, name, avatar, color }` directly.
**Test:** `grep "buildUserObject" backend/src/flows/` — every flow that produces user-bearing documents calls the helper.

### R4: AI-generated content is fully proxied by the backend; no AI URLs or prompts reach the frontend

When an AI service produces an image/audio/text, the backend downloads it, persists it under `backend/public/`, and returns only the backend URL and sanitized data to the frontend. Prompts, model names, and AI provider data structures are never exposed to client code.

**Why:** Provider-swap risk, key-leak risk, link-rot from AI provider blob URLs (e.g. `oaidalleapiprodscus.blob.core.windows.net`) that expire. See `CLAUDE.md` "AI Service Abstraction (CRITICAL)".
**Evidence:** `CLAUDE.md` "AI Service Abstraction"; avatar generation downloads to `backend/public/avatars/`.
**Test:** `grep -r "openai\|anthropic\|dalle" /git/homestead/frontend/` — any match outside comments is a violation.

### R5: Backend flows export `{ name, handlers }` and register through `FlowEngine`

Every flow under `backend/src/flows/<flowName>.js` exports a flow definition. The engine binds each `handlers[eventName]` to the matching Socket.IO event on connection. Event names share the flow namespace (`wishingWell:posts:create`, not just `posts:create`).

**Why:** Discoverability — given an event name on the wire, the file is `flows/<prefix>.js`. No global handler registry.
**Evidence:** `backend/src/utils/FlowEngine.js`; every file under `backend/src/flows/`.
**Test:** Manual — wire event prefix matches the exporting file's basename.

### R6: Frontend errors flow through `ErrorStore.addError`; never `alert()` or inline error UI

All user-visible error messages go through `frontend/stores/ErrorStore.js`. `ErrorContainer` renders them globally. WebSocket emit rejections, validation failures, and rate-limit responses all path through `ErrorStore.addError(message, { blocking? })`.

**Why:** Single error UI surface = consistent style, dismissal behaviour, accessibility. Inline error text per-component drifts in tone and layout.
**Evidence:** `frontend/stores/ErrorStore.js`; `frontend/components/ErrorContainer.js`; 50+ call sites under `frontend/components/drops/`.
**Test:** `grep -r "alert(" /git/homestead/frontend/components/` — should return zero matches outside debug screens.

## Notes

This is the meta-spec for the whole app. Narrower contracts (flow-engine, design-tokens, activity-v2, etc.) live in their own spec nodes and `references:` this one when they depend on its assumptions. Long prose is intentionally in `md/ARCHITECTURE.md` and `CLAUDE.md` per R6 — this node is the rule index.
