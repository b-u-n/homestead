---
schema_version: 2
id: drift/bazaar-stalls-unimplemented
type: drift
title: Five of six bazaar stalls unimplemented (Phase 1 ships map-sprite only)
status: open
last_audited: 2026-05-22
cause: unimplemented
auto_accept_after: 90
drifts_from:
  - spec/bazaar-submission-flow
affects:
  - component/MapSpritesStall
source_doc:
  - doc/bazaar
---

## Symptom

The `storeType` enum on `ShopItem` accepts six values — `map-sprite`, `toy`, `emoji`, `decoration`, `avvie`, `spell` — but only `map-sprite` has an active stall (frontend wrapper + flow). The other five are documented as "Future" in `md/BAZAAR.md`'s "Stall Types" table.

The schema is intentionally future-proofed: `mediaType` already includes `image / text / video / prompt` to support every stall type from day one. The data layer is ready; the UX layer is not.

This is not a defect — the doc is explicit about Phase 1 scope. It's recorded as drift because (a) the spec node `[[spec/bazaar-submission-flow]]` describes the full stall ecosystem and code/data does not implement it, and (b) downstream features (notification surfaces, search filters) will need to gate on `storeType` once additional stalls land.

## Resolution

**Decision pending — wait-state.** Each future stall lands as its own implementation milestone:

- `toy` stall: requires plushie subtype rendering + collectible UI (unknown timeline)
- `emoji` stall: requires text-media support + emoji picker integration in chat / wishing-well
- `decoration` stall: requires UI-region picker (where on the screen the decoration applies)
- `avvie` stall: requires avatar overlay system (likely couples with `assetCustomizations`)
- `spell` stall: requires prompt-media support + AI service integration (note the AI-abstraction rule in `CLAUDE.md`)

Status flips to `accepted` if no additional stall ships within 90 days — at which point the spec gets a note clarifying that Phase 1 is the long-term state.

## Audit log

| Date       | Agent              | Note                                                                       |
|------------|--------------------|----------------------------------------------------------------------------|
| 2026-05-22 | major-features cluster | Recorded as drift during graph buildout. Phase 1 / map-sprite is current. |
