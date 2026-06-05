---
schema_version: 2
id: drift/pixelpals-grove-unresolved-asset
type: drift
title: Weeping willow grove overrides have no platformAssetId for codegen round-trip
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/room-editor-overlay-model
affects:
  - component/RoomEditor
source_doc:
  - doc/room-editor
---

## Symptom

The procedurally-generated weeping willow grove (entities with `id: weeping-willow-{i}`) is selectable in Room Editor. A developer can hide individual willows or apply position overrides. But the underlying asset (`Tree.png`) is not in `frontend/constants/platformAssets.js` — so when `exportLayoutOverlay.js` dumps the overlay for paste-back into source, those entries print with an "unresolved platformAssetId" comment.

The doc says these should be pasted "as a per-index exception map next to the `Array.from(...)` block" — meaning the codegen round-trip is manual and fragile for grove edits. The export script can detect the problem but cannot emit a usable patch.

This violates the spirit of [[spec/room-editor-overlay-model]] R3 (export script is read-only — paste workflow), which presumes the pasted output is mechanically correct. For grove entries it's only diagnostically correct.

## Resolution

**Decision pending.** Options:

1. Add `Tree.png` to `platformAssets.js` so the grove renders through the same path as other entities. Cleanest.
2. Special-case `weeping-willow-{i}` ids in the export script to emit a per-index override block automatically.
3. Disallow editing grove entries in the editor (treat them like grass tiles per R6 of the canvas spec). Loses functionality.

Option 1 is the most consistent with the rest of the platform-asset system. The grove is the only known catalog gap; closing it removes the special-case.

## Audit log

| Date       | Agent              | Note                                                                                    |
|------------|--------------------|-----------------------------------------------------------------------------------------|
| 2026-05-22 | major-features cluster | Recorded as drift during graph buildout. Doc acknowledges the gap explicitly.            |
