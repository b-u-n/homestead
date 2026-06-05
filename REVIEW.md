# Review — autonomous session

Everything that shipped while you were away, organized for one-pass review. Reseed runs clean throughout (109 activities, 0 failed). All five waves of `ACTIVITY_EXECUTION_PLAN.md` are marked done.

---

## 1. New primitives (9)

Each lives in `frontend/components/primitives/` and is registered in `_index.js`. All have a header comment with intended use + authoring shape.

| Primitive | Used by | Bind shape |
|---|---|---|
| `TapCounter` | pink elephant (`experiential-thought-demonstration`) | integer count |
| `WeekTracker` | symptom severity tracker | `{ previous: {mon:state}, this: {mon:state} }` (tri-state: normal/light/dark) |
| `PaintLegend` | emotion body mapping | string (selected swatch id) |
| `RippleMap` | an act of kindness | `[{id, name, ringId}]` |
| `ReceiptPopup` (top-level, not a primitive ref) | my management plan, supporter guide | imperative open/close |
| `PerChipPromptList` | north star, 5 P's, small actions stack, mood-boosting sensory, etc. | `{ [chipId]: "<user text>" }` |
| `ChipSortToGroups` | locus-of-control sort | `{ [groupId]: [chipId, …] }` |
| `PerPersonShareReceiptButtons` | supporter caregiver guide save step | (read-only; wraps ReceiptPopup) |
| `CardDeckWalker` | up-and-down activities sort | `{ [chipId]: bucketId }` |

**To review:** walk into each activity that uses one and confirm the interaction reads right. The chip-sort and card-walker interactions are tap-only (no drag) — that was deliberate; drag on RN Web is unreliable.

---

## 2. New renderer features (`ComponentStep.js`)

All authoring-side; no breaking changes.

- **`showIfSelected: {stepId, bind, matchValue}`** — conditional render gate. Skip this block unless the matchValue is in the named bind's saved value.
- **`sourceStepId` + `sourceBind` on any primitive's props** — auto-injects the resolved prior-step value as `selectedChipIds` (if array) and `sourceValue` (always).
- **`placeholderByBind: {stepId, bind, map}`** + **`placeholdersByDomain` / `placeholderExamplesByArea`** — dynamic placeholders keyed off a prior step's value. Map entries can be a string OR an array (picks random per render).
- **`_filterFrom: {stepIds: [...]}` on `ChipMultiSelectTagGroup`** — hides chips that were selected in earlier steps.
- **`durationFromBind: {stepId, bind, multiplier}` on `TimerCountdownOrSession`** — timer length from a prior pick (e.g. box-breathing "How long?").
- **`phaseDurationFromBind: {stepId, bind}` on `BreathPacerAnimation`** — pacer count from a prior pick.
- **`randomFromLibrary: "<libraryKey>"`** — for `StaticTextContentBlock`. Picks a random string from `activity[libraryKey]` (a top-level array). Stable per mount.
- **`ReflectionPanel.sourceScaleMax` + `reflectionScaleMax`** — map a finer-grained source slider (e.g. PHQ-9 at 0–5) into a coarser-grained reflection key band (0–3).
- **`carryFrom.bind` dot-notation** — `"sorted.control"` walks nested objects.
- **`carryFrom.filterByValue`** — filter an object map by value, returning the array of matching keys.
- **`TimerCountdownOrSession.loop`** — boolean prop, when true the timer resets and keeps going on completion (used by PMR).
- **`NumericRatingSlider.numericReadoutVisible` default flipped to `false`** — kills the redundant "purple number to the right" universally.
- **`CollapsibleSection.bodySlotContent` string-wrapping** — string bodies now wrap in a Comfortaa `<Text>` automatically (was previously silently failing or wrong-font).
- **R5 carry-over filter** — `formatValueAsText` now strips `false` values from object maps (un-ticked multi-select items disappear from carry).

**To review:** mostly invisible — verify by walking activities that use them and seeing the right behavior.

---

## 3. Doc changes

- **`TONE.md`** — 16 candidate amendments folded in (the ones you approved from `TONE_SUGGESTIONS.md`). New §Shared voice bullets, expanded §Closings, "walk-with don't describe-at" in §Intros, framework-prompts-are-questions rule, etc.
- **`SCORED_REFLECTIONS.md`** — scope broadened from "PHQ-9/GAD-7 only" to "anywhere the user rated, ranked, or selected" — with per-domain / per-chip / per-pattern examples.
- **`MEMORY.md` / project memory** — unchanged.
- **`IMPROVEMENTS.md`** (created earlier) — has the food-diary wrap-up note. Add to it as the queue grows.

**To review:** scan TONE.md end-to-end (~260 lines). The §Surfaces table now has 4 rows (Intro / Prompt / Closing / Mirror) instead of 3.

---

## 4. Activities reworked (by wave)

Counts: 109 activities in DB. The numbers below are the items I touched.

### Wave 1 — small bug fixes (12 shipped, 2 no-ops)
pink elephant, staying-on-track, food diary, parenting seasonal, common myths, sleep diary, mood tracking log, PHQ-9 (scale 0→5 with reflection band 0→3), activity scheduling, PMR (timer loop + checkbox inline), smart goal builder (new fuzzy-goal step), does-this-sound-like-me, how-am-i-really (drops first-step Q + adds "change-weighed" step).

### Wave 2 — tone-only passes (23 activities)
behavioral activation · sorting what's heavy (×2) · how I want to be treated · find your true north · motivation/barriers · opposite action · roles we play · relational self-reflection · conflict navigation · i-statement practice · self-care planning · substance use awareness · strengths card sort · attachment style · relationship quality (BPD-soft) · apathy/lethargy · prompted self-reflection · life compass · challenging questions · telling someone about depression · grief or something more (honor-before-redirect) · how am I really.

### Wave 3 — medium reworks (21 shipped)
coping strategy menu (collapses dropped) · core beliefs (softening-step added) · brooding episode log step 3 (relief-move rewrite) · prepping for stress (emoji slider + chip labels + WIP removed) · box breathing (loop + dynamic count/duration + dot prose fix) · practice log (clarity + carry fix) · scents & sounds (safety step) · symptom severity tracker (WeekTracker swap) · focusing on positive feelings (showIfSelected gate) · locus-of-control sort (ChipSortToGroups) · self-care planning (workarounds step + dynamic placeholders) · strengths card sort (custom entry + filterFrom + top-5 chips) · attachment style (auto-detect via ReflectionPanel) · i-statement (situation step + assembled top) · roles we play (reorder + dropdown items + auto-tell) · how I want to be treated (populated chips + good-news example) · relational self-reflection (PersonaPicker → relationship name + placeholders) · relationship quality (allowCustomEntry on step 3) · conflict navigation (split prompt) · wellbeing log (per-domain ReflectionPanel + dynamic placeholders) · my north star (per-chip PerChipPromptList).

### Wave 4 — major reworks (17 shipped)
guide for supporter (split needs / per-person walk / dos-donts / attribute / PerPersonShareReceipt) · emotion body mapping (PaintLegend + per-zone walk) · medication tracking (split into history + adherence) · 7 Cs (auto-paragraph + single focus) · 5 P's (Pick→Plan→Pace→Pleasure→Persistence) · tending your garden (simplified titles + sliders cleaned + per-section rollup) · causes & contributing factors (split-pane + diagram) · nutrition (meal-reflection + hydration-reflection steps) · today's affirmations (50→150) · virtue mirror (single-virtue/single-moment Marcus rebuild) · treatment options (per-option steps + response box) · small actions stack (per-value variation arrays for all 12 preset values) · up-and-down activities (52 examples + CardDeckWalker) · my management plan (ReceiptPopup wired) · act of kindness (RippleMap swap) · mood-boosting sensory (16 anchors with per-chip walkthroughs).

**To review:** open `/activities-review/z/`, `/activities-review/bonbon/`, `/activities-review/fendi/` and walk anything that stands out. Hot suggestions to walk first because they're new patterns:
1. `experiential-thought-demonstration` (pink elephant) — see the TapCounter
2. `locus-of-control-sorting` — see the ChipSortToGroups tap-to-place flow
3. `activity-categorization-sort` (up & down) — see the CardDeckWalker one-at-a-time deck
4. `supporter-caregiver-guide` — see the per-person share buttons + ReceiptPopup
5. `prosocial-acts-tracking` (act of kindness) — see the RippleMap
6. `emotion-body-mapping` — see the PaintLegend swatches
7. `symptom-severity-tracker` — see the WeekTracker tri-state grid
8. `rights-or-affirmations-daily-reading` (today's affirmation) — see the random-from-library reading
9. `paced-breathing-exercise` (box breathing) — confirm the count picker and duration picker actually drive the pacer + timer now
10. `north-star-values-compass` — see PerChipPromptList walk the user through each picked value

---

## 5. Still queued (needs you)

| Item | Why I didn't ship it |
|---|---|
| Affirmations 150 → 300 | More agent passes; you're the judge of when "enough." Spawn another agent on `rights-or-affirmations-daily-reading.json`'s `affirmationsLibrary`. |
| Sensory walkthroughs 16 → 25 | Same. Per-chip prompts need authoring; agents can do it. |
| Common myths "heart" decoration removal | Not in JSON; UI-level inspection needed in the browser. |
| Activity scheduling step 4 prompt rendering | JSON has `promptText`; likely a renderer quirk on `FreeTextShortInput`. Needs a browser look. |
| DiagramCanvas node-fill-from-binds | See section 6 below. |
| Real-world walk-throughs of the 9 new primitives | First user touch will surface anything wrong with the interactions / sizes / colors. |
| Stale `_needsHuman` / `_filterFrom` directives in JSON | Most cleaned; if any still reference primitives that now exist, they're harmless but cosmetic. A grep for `__primitivesNeeded\|_needsHuman` will surface them. |

---

## 6. node-fill-from-binds — what it is

`causes-and-contributing-factors.json` step 4 (identify) was rebuilt as a split-pane: a diagram on the left, per-factor text inputs on the right. The diagram is rendered by the existing `DiagramCanvasWithNodesAndEdges` primitive — five nodes for the factor categories (trigger, automatic thoughts, body cues, behavior, environment, history).

Your original notes asked: *"shouldn't we use the graph to click through and add text for each one and each time they add text it turns the node blue so like a 50/50 split with the graphic and the text boxes?"*

The text-side works today (each factor is a FreeText input with its own bind). What doesn't work:

- The **diagram doesn't change appearance** based on which binds have been filled in.
- The agent that rebuilt the activity added a `_nodeFillFromBinds` directive on the identify step describing the intent: a map of `{ nodeId → bind }` so the renderer can color a node when its bind is non-empty.
- The `DiagramCanvasWithNodesAndEdges` primitive doesn't currently read step responses or honor that directive.

**What it would take to ship**:
1. Pass `allStepResponses` (or just the current step's value) to `DiagramCanvasWithNodesAndEdges` (ComponentStep would inject it).
2. The primitive reads `_nodeFillFromBinds`, walks each node, checks whether the corresponding bind is non-empty in the step value, and applies a different fill color when it is.
3. Optional: clicking a node could also scroll-to / focus the matching text input on the right side (nicer UX but not required).

**Estimated work**: ~30 lines of code in the primitive + a small ComponentStep injection. Not done autonomously because the diagram component is one of the heavier primitives and I didn't want to touch its render math without you confirming the visual treatment (what "filled" looks like — blue overlay, ring, opacity shift?).

If you want me to ship this when you're back, point at the treatment you want and I'll wire it.

---

## 7. Pointers to other artifacts already on disk

- `ACTIVITY_EXECUTION_PLAN.md` — the original five-wave plan (now mostly historical reference; statuses live in the task list)
- `TONE_SUGGESTIONS.md` — the 16-cluster TONE.md amendment list you approved from
- `IMPROVEMENTS.md` — food diary wrap-up note (created during Wave 1; small)
- `SCORED_REFLECTIONS.md` — broadened scope
- `TONE.md` — amendments folded in
- `activity-notes.txt` — your original source-of-truth feedback (untouched as evidence)
