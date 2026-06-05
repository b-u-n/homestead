---
schema_version: 2
id: concept/wishing-well
type: concept
title: Wishing Well
status: stable
last_audited: 2026-05-22
kind: feature
source_doc:
  - doc/wishingwell
---

## Overview

Single-screen positivity board. Free posts (max 500 chars), accordion expand for full content + responses, heart tipping via `HeartPaymentModal`, and inline replies (max 5000 chars). Real-time broadcast to all connected clients.

## Notes

Anchors [[spec/wishing-well-board]] and the central drop component [[component/PositivityBoard]]. A separate `ViewPost` drop handles notification deep links. Full data-model fields and event rows live in `md/WISHINGWELL.md` per R6.
