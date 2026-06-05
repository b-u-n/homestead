---
schema_version: 2
id: concept/activity-system
type: concept
title: Activity System
status: stable
last_audited: 2026-05-22
kind: surface
source_doc:
  - doc/activities
  - doc/workbooks
  - doc/flows
  - doc/drops
---

## Overview

The therapeutic-activity surface of Homestead. Users open a bookshelf (library room → workbook), pick an activity tile, and complete a multi-step interactive exercise (assessment, journal, breathing exercise, action plan, etc.). Activities run inside a flow (drops in a modal stack) and persist progress per user per activity instance via WebSocket.

## Notes

This surface anchors the spec/pattern/component cluster for activities, flows, drops, and workbooks. See [[spec/activity-v2]] for the current authoring contract, [[spec/workbook-system]] for the data hierarchy, and [[spec/flow-engine]] for the underlying modal/navigation engine that activities render inside.

The full descriptive prose — JSON schema, step-type reference, tag→bookshelf mapping, copy-paste skeletons — lives in `/md/ACTIVITIES.md`, `/md/WORKBOOKS.md`, `/md/FLOWS.md`, `/md/DROPS.md` per R6. This node is the structural anchor.
