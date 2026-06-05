# Architectural deferrals — current status

Originally surfaced by the forced-rewrite pass over `activity-notes.txt`. Verified by audit agents across the 12 review-list activities. **All code-level + content-authoring deferrals are now shipped.** Remaining items are either (a) intentional renderer chrome that the owner may want to redesign, or (b) live-UI verifications the agent traces can't reach.

**Summary:** 27 resolved · 0 still needed (code-level) · 4 design/renderer-chrome decisions · 3 live-UI checks.

---

## ✅ SHIPPED — engineering work (11 items, including this round)

### Original 10 from the architectural plan
- `ChipMultiSelectTagGroup`: auto-flush draft on unmount, honor `selectedChipIds` injection, normalize saved-value shape (object → flat string[]). Inline-checkbox-with-description verified already correct via `Checkbox` primitive layout.
- `PerChipPromptList`: reads `fallbackPlaceholderOptions` + `fallbackPromptOptions` arrays with memoized random pick.
- `CardDeckWalker`: opt-in `gestureMode: 'hold-and-swipe'` (PanResponder + Animated.View + side hints); wired to `activity-categorization-sort`.
- New `ChipMatrixGrid` primitive (chip pool over rows × columns drop grid).
- `ReflectionPanel`: presence-of-label mode, `scoreBands` range-based lookup, customizable `scoreReadoutTemplate`. **scoreBands path also updated so the low band (min 0) actually fires.**
- `OverlayStore` (MobX) + `ReceiptPopupOverlay` at app root; `PerPersonShareReceiptButtons` + `ButtonExportShareAction` migrated to global open.

### Added this round (audit follow-ups)
- **`WidestGapReadout`** primitive — computes top-N gaps from importance/alignment slider pairs; wired into `bulls-eye-and-compass-values` step 3.
- **`ListBalanceReadout`** primitive — compares two chip-list bind counts (forward vs backward); 5 tilt-bucket prose variations (strongForward → strongBackward); cross-step source resolver in ComponentStep. Wired into `motivation-barriers-analysis` step 5.
- **`showIfNonEmpty`** directive — gates a component on a bind having any content; used in `supporter-caregiver-guide` step 5 to hide empty-person sections (18 components gated).
- **`scoreBands` schema fix** — `id` → `key` in `readiness-to-change` step 4 (ReflectionPanel.js looks up `band.key`).
- **`sourceStepId` resolver relaxation** — accepts a `sourceStepId` without `sourceBind` (injects the whole step value object). Required by WidestGapReadout.

---

## ✅ SHIPPED — content authoring (3 items, this round)

- **`myth-busting-and-knowledge-quiz` step 1 intro** — full TONE.md rewrite. New three-beat narrative: vivid origin imagery → cost in a life → prep for the 5-myth flow. Word count 128 → 173.
- **`integrated-multi-component-treatment-plan` step 2 dashboard** — all 10 prompts rewritten. Framing lifted from placeholders into prompts (medications, social, relaxation, thought_tools). Honor-before-redirect added to heavy items (medications, triggers). Each prompt has a different entry point (honor+conditional / is-there / where / recall / observation+what / who / what / when+is-there / recall+honor / future-imagine). Each placeholder is one concrete lived-in `e.g.` example.
- **`binary-screener` step 3 ReflectionPanel** — authored presence-of-label content. 6 endorsed-items with 3–4 paragraph variations each (~85 lines). SCORED_REFLECTIONS.md gospel: two-clause shape on heavy items, woven quantifiers, visceral images, no diagnosis verdicts. Watch-for-depression follow-up callout retoned.

---

## ✅ SHIPPED — cosmetic dropouts from prior plan (4 items)

- `ReceiptPopup` → standard `Modal` component + `WoolButton` toolbar.
- `SuperStitch` on uppercase subheader labels (WeekTracker / RippleMap / ChipSortToGroups / PerChipPromptList).
- Web input `fontSize` now scales via `FontSettingsStore.getScaledFontSize()` in RippleMap + ChipSortToGroups.
- Dead checkbox style cleanup in `ChipMultiSelectTagGroup`.

---

## 🎨 DESIGN DECISION NEEDED — 4 items (intentional chrome, not bugs)

The "dots / Card N of M" complaints map to intentional renderer chrome — the `StitchedProgressBar` + "Step N of M" counter rendered at the top of every step by `WorkbookActivity.js`. The activity-JSON-side "Card N of M" prefixes (different thing — written by an earlier activity author) were already removed in a prior pass.

The chrome itself is intentional and serves orientation. If you want to soften or hide it on certain step types, that's a design decision. Options:

- **Suppress on intro/saved steps** — most useful on activities where the progress bar adds visual noise to an already-spare landing
- **Activity-level flag** — `progressBar: false` in the JSON to suppress per activity
- **Re-style as numeric only** — drop the segment-bar, keep just "Step N of M" text

Specific complaints:
- **`myth-busting-and-knowledge-quiz` intro** — "5 dots that don't do anything." Activity has 8 steps → 8 segments render. May have been counting just the myth steps.
- **`progressive-muscle-relaxation` step 2** — "8 empty dots above the timer." Activity has 5 steps → 5 segments. The "8 dots" may be the 8 muscle-group `Checkbox` rows in `ChipMultiSelectTagGroup checkbox-list-vertical` mode before any are ticked.
- **`goal-motivation-and-barriers`** — "Card 1 of 3." The `StitchedProgressBar` + "Step N of M" text reads as "card N of M" on the cards-themed motivator/barrier/countermeasure steps.
- **`food-diary` step 4 "coming soon"** — Not in JSON. May have been removed in an earlier pass; if it persists in the UI, source it via inspector.

---

## 👀 LIVE-UI CHECKS (3 items)

Code traces show correct wiring; only the live UI can confirm:

- **`bulls-eye-and-compass-values` step 2** — NumericRatingSlider rendering as buttons instead of a track? Tick count is 11 (0–10 step 1), should render as track per `usePills = tickCount <= 11` (line 39). If still pills, log the actual tick count.
- **`experiential-thought-demonstration` step 2** — TapCounter visible alongside the timer? Both render on the same step vertically; should not hide each other.
- **`placeholderExamplesByArea` activation on `self-care-action-planning-and-commitment` workarounds step** — confirm the placeholder swaps as the user enters a new `biggest_roadblock` value.

---

## Note on supporter-caregiver-guide / management-plan duplication

The supporter-caregiver-guide save step and the management-plan step-3/step-4 both author full recaps before the final step. This is schema-compliant per R5 but creates double-recap reading. If you want to consolidate, that's a separate refactor — not a deferral.
