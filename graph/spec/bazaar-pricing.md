---
schema_version: 2
id: spec/bazaar-pricing
type: spec
title: Bazaar Pricing Curve
status: stable
last_audited: 2026-05-22
tags: [bazaar, economy]
source_doc:
  - doc/bazaar
governs:
  - component/MapSpritesStall
---

## Rules

### R1: Price is a pure function of `purchaseCount` — never stored on the ShopItem

Price is computed at read time by `getPrice(purchaseCount)`. The literal hearts value MUST NOT be persisted to `ShopItem` (which is why the model has no `price` field). Listings and the buy handler both recompute.

**Why:** Single source of truth. If the curve changes, every existing item re-prices automatically with no migration. Storing the price would split the source.
**Evidence:** `md/BAZAAR.md` "Pricing" section; `backend/src/utils/bazaarPricing.js`.
**Test:** Inspect `ShopItem` schema — no `price` field. Inspect `bazaar:shop:list` response — price is always present (computed).

### R2: Curve has five tiers — 9 hearts at zero, capped at 36

All items start at 9 hearts. Tier breakpoints (in `purchaseCount`): 45, 135, 455, 635, 4635. Within each tier price increments by +1 every N purchases (5 / 15 / 40 / 90 / —). Hard ceiling of 36 hearts above 4635 purchases.

**Why:** Cottagecore economy — expensive enough that valuable items feel valuable, cheap enough at start that the first 50 buyers always get a deal.
**Evidence:** `md/BAZAAR.md` "Pricing" table and code snippet.
**Test:** `getPrice(0) === 9`, `getPrice(45) === 18`, `getPrice(635) === 34`, `getPrice(10000) === 36`.

### R3: Participant discount applies for collaborative-board purchases

Pixel Pals completed boards produce `ShopItem`s with a `participantIds` array; contributors pay a flat 3 hearts regardless of `purchaseCount`. Non-participants pay the normal `getPrice(purchaseCount)`.

**Why:** Contributors earn a stake in the completed work; the discount turns into a near-free print of what they helped make.
**Evidence:** `md/pixelpals.md` "Purchasing Completed Boards" section.
**Test:** Complete a Pixel Pals board with two participants; have a participant attempt purchase — confirm hearts deducted is 3 regardless of `purchaseCount`.

## Notes

The curve is intentionally smooth-stepped, not continuous. Frontend should never recompute price — always read from `bazaar:shop:list` / `bazaar:submission:get` response.
