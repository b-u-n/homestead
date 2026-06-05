---
schema_version: 2
id: spec/avatar-customization-flow
type: spec
title: Customization Table Flow
status: stable
last_audited: 2026-05-22
tags: [customization, flow]
source_doc:
  - doc/customization
governs:
  - component/CustomizationTable
  - component/CustomizationStore
  - component/CustomizationAssetPicker
  - component/CustomizationItemPicker
  - component/CustomizationRevisionPicker
---

## Rules

### R1: There is at most ONE active customization per `platformAssetId` per user

`Account.assetCustomizations` is an array but functions as an upsert keyed by `platformAssetId`. Applying a new customization for an asset that already has one REPLACES the prior entry. Backend handler `bazaar:customization:set` enforces this on write.

**Why:** Multi-customization for a single asset is ill-defined ("which one wins on the map?"). Upsert removes the question.
**Evidence:** `md/CUSTOMIZATION.md` Customization Model ("One entry per platformAssetId (upsert)").
**Test:** Apply customization A then B to the same asset; backend returns one entry for that `platformAssetId`.

### R2: A user can only apply items whose `ShopItem.platformAssetId` matches the asset being replaced

The item-picker drop filters `bazaar:purchases:mine` results by the selected `platformAssetId`. The backend handler `bazaar:customization:set` re-validates the match server-side before writing.

**Why:** A "tree sprite" item should not be applicable to the "wishing well" asset. The `platformAssetId` field on `ShopItem` is the typed connection that prevents nonsense customization.
**Evidence:** `md/CUSTOMIZATION.md` User Items section; `bazaar:customization:set` validates ownership, revision approval, and platformAssetId match.
**Test:** Manually craft a `bazaar:customization:set` payload with mismatched IDs; backend rejects.

### R3: Applying a customization LOCKS the user into a specific `revisionIndex`

When the user picks a revision in `CustomizationRevisionPicker`, the chosen `revisionIndex` is stored on the `assetCustomizations` entry. If the item creator later submits a newer revision, the user's map keeps rendering the locked revision until they manually return to the picker to update.

**Why:** Creators can iterate without surprising buyers with overnight visual changes. The user is in control of "do I want the update or not?"
**Evidence:** `md/CUSTOMIZATION.md` Revision Locking section.
**Test:** Apply rev 2; creator approves rev 3; user's map still shows rev 2 until they re-pick.

### R4: The revision picker MUST badge `currentApprovedRevisionIndex` as "Latest" and the active revision as "Active"

These two badges are how the user sees that an update is available. If a revision is both latest and active (the common steady state), it shows both badges.

**Why:** Discoverability of available updates is the only reason revision-locking is acceptable UX. Without the "Latest" cue, the user never knows to look.
**Evidence:** `md/CUSTOMIZATION.md` Revision Locking section.
**Test:** Open the revision picker with rev 2 active and rev 3 approved; rev 2 shows "Active", rev 3 shows "Latest".

### R5: `CustomizationStore.version` MUST increment on every change and be a `useEffect` dependency in `MapCanvas`

The entity image-loading `useEffect` in `MapCanvas.js` reads `CustomizationStore.version` so React re-runs the effect when customizations change. The store increments `version` on every `updateFromServer`, `set`, and `clear`.

**Why:** MobX would refire on the underlying Map mutation, but the `useEffect` dependency contract makes the cache-invalidation explicit and testable.
**Evidence:** `md/CUSTOMIZATION.md` CustomizationStore section.
**Test:** Apply a customization with `MapCanvas` mounted; the relevant entity's image reloads without a manual refresh.

### R6: Custom image load failure falls back to the entity's default image

`MapCanvas` listens for `img.onerror` on the override URL. If the custom image fails (broken CDN URL, deleted file, etc.), it falls back to the entity's default image so the map never renders a broken-image icon.

**Why:** Customizations sit on user content that can be deleted or moderated. The graceful fallback keeps the map functional.
**Evidence:** `md/CUSTOMIZATION.md` Edge Cases.
**Test:** Apply a customization, then mutate the cached `contentUrl` to an invalid URL; the entity renders its default image.

## Notes

The flow has three drops using the modal-stack depth system: `customizationTable:assetPicker` (depth 0) → `customizationTable:itemPicker` (depth 1) → `customizationTable:revisionPicker` (depth 1). Asset picker also supports inline "Reset to Default" without entering deeper drops.

The wrapper component `component/CustomizationTable` is intentionally thin — it just wraps `FlowEngine` with the flow definition and `SessionStore.sessionId` in the initial context.
