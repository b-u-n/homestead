---
schema_version: 2
id: concept/wire-protocol
type: concept
title: Wire Protocol
status: stable
last_audited: 2026-05-22
kind: surface
source_doc:
  - doc/websockets
---

## Overview

The bidirectional Socket.IO surface that anchors every named event flowing between frontend and backend. Event names are the contract — `auth:google`, `weepingWillow:posts:create`, `notifications:new`, etc. — and each name has a defined input shape, output shape, and broadcast policy. This concept exists so component nodes on either side can declare which wire events they emit or handle, making the contract surface explicit.

## Notes

Anchors [[spec/websocket-protocol]] (the rules of the wire) and is the surface where notification and error flows manifest. Most backend `flows/` and `routes/` modules contribute event names to this surface; frontend `WebSocketService` is the single mouth and ear. Long event-by-event reference lives in `md/WEBSOCKETS.md` per R6 — this node is the structural anchor.
