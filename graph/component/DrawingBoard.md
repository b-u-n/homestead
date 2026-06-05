---
schema_version: 2
id: component/DrawingBoard
type: component
title: DrawingBoard
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/DrawingBoard.js
belongs_to:
  - concept/bazaar
uses:
  - component/FlowEngine.frontend
source_doc:
  - doc/bazaar
---

## Purpose

FlowEngine wrapper around `drawingBoardFlow`. Entry point for contributor-side bazaar work: intro, asset catalog browse, new-art submission, asset-replacement submission, my submissions, and style guide. Triggered by the drawing-board entity in the bazaar room.

## Notes

The flow's drops (`drawingBoard:intro`, `drawingBoard:submit`, `drawingBoard:mySubmissions`, etc.) are not node-ified individually — the wrapper is the central component. See `frontend/flows/drawingBoardFlow.js` and `md/BAZAAR.md` "Frontend Flow Structure" for the per-drop layout.
