# Activity execution plan

Working plan for everything in `activity-notes.txt`. **63 items.** Organized into waves so dependencies land before the work that needs them, and so parallelizable batches run together.

> **Already done (drop from list):** *possibly remove the family business* — shipped as `disputing-irrational-beliefs.json` in an earlier session.

> **Out of scope of this plan:** any new activity content beyond what the notes specify; any platform-level work outside `frontend/components/`, `frontend/components/primitives/`, `frontend/components/drops/`, `backend/src/`, and `activities/v2/`.

---

## Approach — five waves

**Wave 0 — infrastructure.** Components, docs, and helpers that multiple activity fixes depend on. If we skip this, activity edits in Wave 3/4 will be blocked or done badly.

**Wave 1 — small bug fixes.** One-shot, isolated, low-risk. Mostly parallelizable. Knocks ~12 items off the list quickly and de-noises the rest of the plan.

**Wave 2 — tone-only passes.** ~25 activities want "apply tone.md" with no structural change. Run in batches of 5–8 via parallel agents, validate JSON + reseed once at the end.

**Wave 3 — medium reworks.** Tone + structure together, single-activity scope. Usually one step added/split, plus a real tone pass. ~15 activities.

**Wave 4 — major reworks.** XL items requiring research, multi-agent work, or full rebuilds. ~10 activities, one at a time, each with its own mini-plan.

Reseed cadence: after each wave, run `node backend/scripts/seed-activities.js` once and check the audit pages.

---

## Wave 0 — Infrastructure (do first; everything else depends on this)

These are the cross-cutting blockers. Each is small enough to land on its own.

### W0-A. NumericRatingSlider: remove redundant header/value/text
**Problem:** Many activities have a header label *above* the slider and a numeric value *to the right* of it, both restating what the slider already shows. Notes specifically call this out on **7 Cs of resilience**, **tending your garden**, **technique planner**, **thought reframe**, **self-care action planning**, **prepping for a stressful event**, **substance use awareness**. The fix is at the component level — once landed, those activities just need their JSON to drop the now-redundant text.
**Change:** Default `NumericRatingSlider` to render *just* the numbered scale; gate the header/value-readout behind opt-in props that default `false`. Audit which existing activities relied on them; if any look intentional, set the opt-in explicitly on those activities only.
**Files:** `frontend/components/primitives/NumericRatingSlider.js`. Possibly a grep across `activities/v2/*.json` to find slider blocks that need cleanup.

### W0-B. Collapse component font fix (cross-cutting)
**Problem:** The collapsing content area uses the wrong font on at least **mindfulness step 3** and **scents & sounds collapses**. Author notes say "spawn an agent to fix that across all activities."
**Change:** Component-level font fix in the collapse primitive so every activity inherits it; no per-activity edits needed.
**Files:** `frontend/components/primitives/<the collapsible>` (probably `CollapsibleContent` or similar — verify name).

### W0-C. Chip drag-into-group component (verify or build)
**Problem:** **Self control / influence / external (locus-of-control-sorting)** step 3 wants chips you drag into groups. **Medication adherence** wants chips dragged into week slots (multi-chip, removable, deletable). **5 P's** wants chip-to-named-box assignment. Notes ask: "is this not a pattern we identified and built for? if not, we should."
**Change:** Audit existing chip components — FEAR→DARE and a few others ship chip patterns. If a drag-into-group primitive exists, document it and reuse. If not, build one (chip source pool + drop targets, supports multi-chip-per-target, supports removal back to pool, supports delete).
**Files:** `frontend/components/primitives/Chip*` — start by reading what's there.

### W0-D. ReceiptPopup component (new, cross-cutting)
**Problem:** **My management plan** wants a "pretty-printed printable / savable popup of their answers on a white background like a true website popup ... rendered as an image. with the option to copy text or print." Author calls it `receiptPopup` and wants it accessible from anywhere.
**Change:** New cross-cutting component: takes text in, renders a formatted white-background popup sized to the text, with Copy and Print buttons. Lives at the app level so any activity can fire it.
**Files:** `frontend/components/ReceiptPopup.js` (new), plus a small store or hook so activities can trigger it without prop-drilling.

### W0-E. Ripple-map component (new, single-purpose)
**Problem:** **An act of kindness step 4** currently misuses the supporter/connections component to draw a "ripple map." Author wants a proper concentric-rings component where you select where a recipient lives on the rings. *Do not touch* the existing supporter/connections component — it lives elsewhere.
**Change:** Standalone new component (concentric circles, tap to place a labeled dot on a ring). Used only by `prosocial-acts-tracking.json`.
**Files:** `frontend/components/primitives/RippleMap.js` (new).

### W0-F. Cottagecore-color paint legend (new, single-purpose-ish)
**Problem:** **Emotion body mapping step 2** has no legend on the paint page; the legend on the previous page can stay as an example, but step 2 needs the same legend rendered as *selectable colors*. Author asks for it to be "a new documented component."
**Change:** Selectable color swatch row in the cottagecore palette, designed for body-mapping but built generic enough to reuse.
**Files:** `frontend/components/primitives/PaintLegend.js` (or similar) (new).

### W0-G. 4-week tracker component (new, single-purpose-ish)
**Problem:** **Symptom severity tracker step 4** has a 4-week tracker that does nothing when clicked. Author wants three states (dark/light/normal) cycling on tap, and the grid trimmed to *this week and previous week* only.
**Change:** Two-week tap-to-cycle tri-state tracker. Component-level so other activities can reuse.
**Files:** `frontend/components/primitives/WeekTracker.js` (new).

### W0-H. Hold-and-swipe component (verify or build)
**Problem:** **Up and down activities step 3** wants hold-and-swipe. Notes say "we built one" — find it. If it exists, verify it works; if it doesn't, build it.
**Files:** Grep `frontend/components/` for hold/swipe.

### W0-I. SCORED_REFLECTIONS.md scope broadening (doc)
**Problem:** Confirmed gap from the TONE review (cluster 10). At least **six activities** in the notes want the SCORED_REFLECTIONS read-back pattern outside instruments: grief, 7 Cs, attachment style, small actions stack, wellbeing log, self-care action planning. The doc currently scopes itself to "PHQ-9 / GAD-7 today."
**Change:** Rewrite SCORED_REFLECTIONS.md scoping paragraph and a few examples so it explicitly covers any step that collected ratings, rankings, or selections — not only instruments. No mechanism changes (`ReflectionPanel` already works on `sourceStepId` regardless of step type).
**Files:** `SCORED_REFLECTIONS.md`. Possibly small inline doc on `ReflectionPanel` to match.

### W0-J. Carry-over filter — show only what they picked
**Problem:** Multiple notes complain that carry-over shows raw selection sets including untouched options. **Focusing on positive feelings**, **my north star**, **does this sound like me**, **self-care action planning**, **i-statement practice** all want only-the-picked items rendered.
**Change:** Audit the `carryFrom` renderer in `WorkbookActivity.js` / `ComponentStep.js` and confirm it can filter to only-truthy / only-selected items, or add a `filter: "selected"` opt-in. Document the pattern.
**Files:** Likely `frontend/components/workbook/ComponentStep.js` (look for `carryFrom` handling).

### W0-K. "Two 5-4-3-2-1" dedupe decision
**Problem:** Two grounding activities cover the 5-4-3-2-1 sensory exercise: `grounding-rapid-response-skill-sequence` (keep) and `mindful-sensory-activity` (possibly drop). Notes ask: "did the other get mistranslated or can we drop it?"
**Change:** Diff the two activities; if the second is a mistranslation, delete it (same shape as the Family Business → DIBs swap). If they're meaningfully distinct, keep both and document the difference.
**Files:** `activities/v2/grounding-rapid-response-skill-sequence.json`, `activities/v2/mindful-sensory-activity.json`.

---

## Wave 1 — Small bug fixes (parallelizable)

One-shot fixes, no rework, each landable in minutes. Run as a parallel agent batch or knock them off in a single sitting.

| # | Activity | Fix |
|---|---|---|
| 1 | pink elephant (experiential-thought-demonstration) | Add the counter tap target that's missing. |
| 2 | staying on track (goal-motivation-and-barriers) step 3 | Remove "card 1 of 3" header (and check whether the same indicator persists through the activity). |
| 3 | sorting how i cope (healthy-vs-unhealthy-behavior-sort) step 5 | Add prompts to the text boxes that currently have none. |
| 4 | food diary | Carry the time-slot through to step 3 in proper format. Align the star inline with the text on the "mark this one as outside your usual rhythm" row. Remove the "coming soon" from step 4. Wrap step 4 into step 5 (retro). Add a note in `IMPROVEMENTS.md` (new file or existing — check) flagging the wrap-up. |
| 5 | parenting seasonal planning | Swap steps 2 and 3; verify carry-over still resolves correctly. |
| 6 | common myths about depression step 1 | Remove the 5 non-functional dots at the bottom of step 1. Remove the heart at the bottom. Drop the "Myth #" headers. |
| 7 | sleep diary step 2 | Add a "when you woke" header to the second input. Step 4 of 6 — the "Tonight" bar makes no sense; move that wrap-up into the retro step. |
| 8 | mood tracking log | Carry the date over. Combine steps 3 (recap) and 4 (retro) into one step. |
| 9 | PHQ-9 assessment step 2 | Change scale to 0–5; multiply by 3/5 (or equivalent) on the lookup side so the scored read-back still keys into the 0–3 variation arrays. |
| 10 | activity scheduling | First line of intro becomes "Motivation follows action." Label the unlabelled bottom box on step 4 (the prep box). Tone the new label. |
| 11 | progressive muscle relaxation step 2 | Make the timer loop. Inline the checkbox with the long line — remove the separate "Hands — Done" row; use the standard checkbox component. Remove the 8 empty dots above the timer. |
| 12 | smart goal builder | Add a pre-step 2 framing: "Define a fuzzy goal, and we'll refine it. It doesn't need to be perfect to start, and it's fine to practice." Tone it. |
| 13 | does this sound like me step 3 | Drop the MinkyPanel callout — render as plain prose. Explicitly carry over and display the things they selected. |
| 14 | how am i, really? (readiness-to-change) | Drop the first-step question (we don't ask questions on the first step). Add a step between 1 and 2 — "change you've been weighing." (Tone in Wave 3.) |

---

## Wave 2 — Tone-only passes (agent batches of 5–8)

Activities that only need an `apply tone.md` pass — no structural changes, no new components. Spawn parallel agents, one per activity, each returning the standard `<activityId> — <REVISED | ALREADY_MEETS_BAR>` terse report per TONE.md's "Running a tone pass with an agent" protocol.

**Batch 2a — descriptions/intros only (5):**
behavioral activation · sorting what's heavy (problem-identification) · how i want to be treated · find your true north (introspective-values-reflection) · motivation and barriers step 6 placeholder

**Batch 2b — full-activity tone (5):**
opposite action (emotion-override-opposite-action) steps 2 & 3 · roles we play in relationships (interpersonal-dynamics-psychoed) · relational self-reflection · conflict navigation steps · i-statement practice (defer the structural part to Wave 3)

**Batch 2c — full-activity tone (5):**
self-care action planning (defer the new step to Wave 3) · substance use awareness (description + step 3 wording) · strengths card sort (defer structural to Wave 3) · attachment style identification (defer auto-detect to Wave 3) · relationship quality self-assessment (defer step 3 add to Wave 3)

**Batch 2d — full-activity tone (5):**
apathy and lethargy (apathy-lethargy-toolkit) step 4 framing · prompted self-reflection (reflective-journaling-prompted-self-reflection) — also hide non-functional skip/next on the cards; add author-note that this could be done with real cards if we wanted them · life compass (bulls-eye-and-compass-values) step 2 (also swap buttons to sliders, rename "alignment") · challenging questions (thought-challenging-questions) — also split into two boxes · telling someone about your depression (depression-disclosure-communication) — also add the new "how the person might respond" middle step

**Batch 2e — tone polish on previously-touched (3):**
sorting what's heavy (all steps) · grief or something more (binary-screener) — tone honoring weight before redirect (per cluster 7 of TONE.md) · how am i, really? — tone the new "change you've been weighing" step + tone existing step 2 sliders + redo step 3 without MinkyPanel asides

Validate JSON and reseed *once* at the end of each batch.

---

## Wave 3 — Medium reworks (single-activity, tone + structure together)

One activity per item. Each is its own ~30-min job; some require Wave 0 dependencies (noted).

| # | Activity | Work |
|---|---|---|
| 1 | coping strategy menu (coping-strategy-tip-menu) step 2 | Auto-toggle sections based on item selections — no manual highlight/toggle on the section header. (Mostly UX, but step prose may need a small refresh.) |
| 2 | core beliefs (core-belief-work) | Add a remediation/wrap-up step at the end — author notes "it just kinda dumps you at the end." Use the closings rules from the updated TONE.md (cluster 13 — honor what they did, by name). |
| 3 | brooding episode log (episode-log-with-categorical-sorting) step 3 | Review the activity's source intent; rewrite step 3 with a clear "look back and …" frame. What's the relief? Make it explicit. |
| 4 | prepping for a stressful event (event-based-coping-preparation) | Slider text → emojis-only for 1 and 10 (depends on **W0-A**). Label the two multi-select chips groups. Remove the "monthly view on the way" aside. |
| 5 | box breathing (paced-breathing-exercise) step 3 | Remove the dot — just inhale on expand, hold on hold, exhale on contract, hold on hold. Wire the "counts" menu on step 2 to actually drive the box rhythm. Wire the duration to the timer. |
| 6 | practice log (practice-tracker-log) step 3 | Clarify "choose up to three from the day." Clarify "five minutes of practice counts." Fix the carry-over to the next page. |
| 7 | scents & sounds (relaxation-modality-psychoeducation) | New step after step 1 — safety warning: diffuse in moderation, never around pets, never consumed directly, avoid known allergens. (Collapse font fix lands via **W0-B**.) |
| 8 | symptom severity tracker | Rewrite the description through TONE.md (currently incoherent per notes). Step 4 — replace the 4-week tracker with **W0-G** (this week + last week, tri-state cycling). |
| 9 | focusing on positive feelings (categorized-positive-reflection-worksheet) step 3 | Only show the items they picked; same with carry-over. (Depends on **W0-J**.) |
| 10 | self-control / influence / external (locus-of-control-sorting) step 3 | Drag-and-drop chip-to-group (depends on **W0-C**). |
| 11 | self-care action planning | New step after current step 2 — "workarounds you'd actually use for some of these" — with dynamic SCORED_REFLECTIONS-style placeholders that update from selection (depends on **W0-I**). Carry through to step 4. Soften "pick the biggest one" → "which are most affecting you right now." |
| 12 | strengths card sort (strengths-positive-qualities-inventory) | Step 2: add-your-own. Steps 3 and 4: hide already-selected ones from later picks. Step 5: include the "very much me" top 5 as chips at the top. |
| 13 | attachment style identification | Identify the pattern from step 2 selections and present in step 3 (instead of asking them again). Still have them name their main pattern after the presentation. Add "what are its current limitations or restrictions" after "what was it doing for you back then?" (Uses **W0-I** for the read-back paragraph.) |
| 14 | i-statement practice (i-statement-framework-practice) | New step before current step 2 — a situation prompt (something said, misrepresented, or left unsaid that left them uncomfortable). Carry that example into step 2 at the top. Step 3 — compile the parts of step 2 into the assembled statement at the top (instead of a MinkyPanel inset); prompt to read it again. |
| 15 | roles we play in relationships | Reorder to: observer, rescuer, persecutor, victim. Step 2 — fill in the empty upper select/dropdown items. Step 3 — tell them which role they picked most (don't ask); soften the "this role has been doing something for you" frame. |
| 16 | how i want to be treated (personal-treatment-expectations-statement) | Step 2 — populate the answer chips. Add an example to "good news." |
| 17 | relational self-reflection | Rebuild the vision: drop the "pick a self" mechanic if it does nothing. Add placeholders to every step. Make the activity's purpose visible in the description and at each step. |
| 18 | relationship quality self-assessment | Soften for BPD readers (per TONE.md cluster 5). Step 3 — add an "add your own" option for what they ticked. Move step 3's "what they ticked vs didn't" view down to the bottom of step 2 so they can compare in context. |
| 19 | conflict navigation steps | Step 1 — tighten the middle of the description. Step 3 — drop MinkyPanel insets; split into two prompts; reword "What tipped it that way?" to something concrete. Step 4 tone. |
| 20 | wellbeing log | Consider renaming (the dropdown placement and reuse cadence suggests a better name than "Wellbeing log"). Step 3 — name the domain explicitly; use **W0-I** to generate ten messages keyed to domain choice + ten matching placeholders. Drop the "Your reflection" generic prompt. |
| 21 | my north star (north-star-values-compass) | Carry only the chips they selected from step 2 → step 3. Step 4 — for each selected chip, generate its own prompt + placeholder; for custom chips, "Chip Name — Generic Prompt" + "Generic placeholder." Step 5 — proper wrap-up. |

---

## Wave 4 — Major reworks (one at a time, each with its own mini-plan)

These need their own short plan before I touch the JSON. Listed in suggested order; reorder as you like.

### W4-1. Guide for someone who supports me (supporter-caregiver-guide) — XL
Per author notes, this is a full restructure:
1. Split step 2: first, "what you might need"; then, use those selections as chips assignable per-person.
2. Require naming the person (the input becomes their name).
3. Per person, give space for a personal note — a thank-you / acknowledgement / gratitude. *Do not* ask them for anything in the note; the chips are the asks.
4. Restructure: rules-of-engagement (dos / don'ts) come *before* the per-person assignment.
5. Current step 3 ("Two short lists") — tone pass + add more do/don't suggestions phrased softly *for the other person* who'll read it.
6. Have them assign the do/don't chips to people at the end.
7. Step 4 — full TONE pass.
8. The "share this with someone" button — make it work, one per named person, with saved state sufficient to generate each customized share artifact along the way (probably uses **W0-D ReceiptPopup**).

### W4-2. Emotion body mapping — XL
1. Step 2 — selectable cottagecore-color palette as the legend (uses **W0-F**).
2. Step 3 (and onward) — currently incoherent; rewrite the whole back half: for each painted body part, a dropdown + short response. Confirm the activity's spine reads as one continuous thing.
3. Full TONE pass after the structural rebuild.

### W4-3. Medication tracking — split into two activities
Currently one activity. Split into:
- **medication history** (new activity, rebuild) — currently only has an example table and no way to fill in anything. Source from `../workbooks/depression/treatment-plan/activities/` originals. Build out fillable inputs. TONE-pass the closing.
- **medication adherence** (new activity, rebuild) — daily-doses-over-4-weeks step doesn't work. Top section creates chips draggable into week slots (multi-chip per week, removable, deletable) — uses **W0-C**. TONE-pass the closing.

### W4-4. Mood-boosting sensory activity — Major
1. Add-buttons should create chips that can be deleted (follow patterns elsewhere). Unsubmitted chips auto-convert before next step.
2. Step 3 — for each sensory activity the user picked, walk them through it with instructions sourced from a web search. Each walkthrough gets a TONE pass, then a sanity review in context, then a second TONE pass. (Spawn an agent per sensory-activity type — set + bath + texture + scent + sound, etc.) Feedback prompt after each.

### W4-5. 7 Cs of resilience (multi-dimensional-framework-self-assessment) — XL
1. Rewrite the description (currently hard to follow): TONE pass, short intro of the *concept*, then list the 7 in a sentence/paragraph, then the bulleted breakdown.
2. Step 2 — remove text in number selectors (depends on **W0-A**); remove centered single-word headers and right-side counts (depends on **W0-A**); TONE pass on prompts.
3. Per author, drop "definition prompts" — for each C, *ask* (per TONE.md cluster 3) rather than define.
4. Step 3 — spawn an agent to author scored-response paragraphs (uses **W0-I** SCORED_REFLECTIONS broadened for non-instrument scoring). For the questions here, drop the "C's" framing and focus on one thing that needs attention + how to nudge it up.

### W4-6. 5 P's (multi-domain-lifestyle-psychoeducation-menu) — XL
1. TONE the existing description through the three-beats; build the emotional connection.
2. Redesign: step 1 = pick up to 3 things (chips). Step 2 = plan per chip (one named box per selected chip, prompt similar to current "plan"). Step 3 = pace. Step 4 = pleasure. Step 5 = persistence.
3. TONE pass everything; TONE the examples too.

### W4-7. Tending your garden (multi-domain-wheel-radar) — XL
1. Step 1 — fix the sprout graphic (per author "looks very bad," and remove the unintended animation).
2. Description — TONE pass with emotional connection + walkthrough.
3. Step 2 onward — rename "The physical plot" → "The physical." Remove the centered "Physical" header above the number selectors and the purple number to the right (depends on **W0-A**). Per step: TONE pass.
4. Step 7 ("The whole garden, in view") — keep the branch graphic (better than the sprout), stop the animation. Render their responses by section without the question headers — only their answers per section. TONE pass.

### W4-8. Causes and contributing factor (causes-and-contributing-factors) — Rebuild
Currently step 2 is "Situation" with an empty box; the intro doesn't tell the user what they're doing. Rebuild as a CBT-style pattern around the existing graphic: a split layout (50/50) with the graph clickable. Tapping a node opens a text input; submitting flips the node to blue. New intro + separate instructions page.

### W4-9. Nutrition and guidance — Major
1. TONE the description.
2. Step 2 — tone the prompt for honesty (don't say "what people aim for").
3. Step 3 — "dear lord tone.md step 3."
4. Add a new step between current 2 and 3: reflect on meal choices for the day and the week; easy wins / improvements; "how eating affects you" (the emotional + physical tie-in); last question = associations between food and feeling.
5. Add another new step after current 3: reflect on hydration — what prevents it, how they notice not hydrating, what they could do. Three self-reflective questions.
6. Remove step 4 ("your week at a glance" — not helpful).

### W4-10. Today's affirmation (rights-or-affirmations-daily-reading) — Research-heavy
1. Generate ~300 quality affirmations: spawn a dozen agents in parallel, search the internet, propose 10,000 candidates, refine to ~300 best, TONE-pass them. Output to a single curated list the activity reads from.
2. Step 2 of 4 — redesign: remove the two unexplained hearts. Frame as: generic "today's reading" → the specific reading → response section. The response placeholder leans empowering, validating, comforting.

### W4-11. Virtue mirror (stoic-virtue-practice) — Rebuild
1. Review the activity. Spawn an agent to research stoic-virtue practice patterns. Define the activity's *goal* explicitly: what should the user feel by the end? How does it form an emotional connection? What's the benefit?
2. Rebuild against that goal, apply TONE throughout.

### W4-12. Treatment options overview — Rebuild
1. Replace "thick of depression" → "thick of it."
2. Drop the comparison table. Search if needed for treatment-option content; present each option in its own step with a single response box per option ("your thoughts on it, how it applies to previous approaches, what might work, concerns").
3. TONE throughout.

### W4-13. Small actions stack (values-to-action-translation) — Multi-agent
For each value (the selected-values list from a prior step), spawn an agent to author SCORED_REFLECTIONS-style text for prompts and placeholders (depends on **W0-I**). Generate one extra agent's output for "user submitted value" — generic-noncommittal but still emotionally driven and purposeful.

### W4-14. Three-week sleep restriction — Rebuild
1. Step 2 — replace freeform notes with structured dropdown/select inputs: time-went-to-bed / time-woke-up / time-to-fall-asleep. Extend through all 3 weeks.
2. New step between weeks: "pause for a week, note things down, come back when you're ready."
3. TONE pass across the whole activity.

### W4-15. Up and down activities (activity-categorization-sort) — Major
1. Coherence and engagement pass — TONE.
2. Step 2 — generate 50 examples (not the current handful).
3. Step 3 — wire up the hold-and-swipe component (depends on **W0-H**).
4. Verify the activity actually works end-to-end after the changes.

### W4-16. My management plan (integrated-multi-component-treatment-plan) — XL
1. Step 2 — TONE the prompts (currently too thin per notes); pull the framing out of placeholders and into prompts. True examples back into placeholders.
2. Step 3 — TONE pass.
3. Step 3 — integrate the new **W0-D ReceiptPopup** so the user can save / copy / print their plan.

### W4-17. An act of kindness (prosocial-acts-tracking) — Medium-major
1. Description — add the three phases explicitly (planning, breakaway-for-delivery, reflection).
2. Step 2 — remove the empty, non-functional bottom button.
3. Step 4 — replace the misused supporter component with the new **W0-E RippleMap**.
4. TONE pass across the activity.

---

## Cross-cutting infrastructure summary (Wave 0 dependencies)

Quick lookup for what blocks what:

- **W0-A** (slider cleanup) → Wave 3 #4, #8; Wave 4 #5, #7
- **W0-B** (collapse font) → all activities with collapses (automatic once landed)
- **W0-C** (chip-to-group) → Wave 3 #10; Wave 4 #3 (adherence), #6 (5 P's, maybe)
- **W0-D** (ReceiptPopup) → Wave 4 #1, #16
- **W0-E** (RippleMap) → Wave 4 #17
- **W0-F** (PaintLegend) → Wave 4 #2
- **W0-G** (WeekTracker) → Wave 3 #8
- **W0-H** (HoldSwipe) → Wave 4 #15
- **W0-I** (SCORED_REFLECTIONS broadening) → Wave 3 #11, #13, #20; Wave 4 #5, #13
- **W0-J** (carry-over filter) → Wave 3 #9; multiple Wave 2/3 activities benefit
- **W0-K** (5-4-3-2-1 dedupe) → standalone

---

## Verification cadence

- **After Wave 0:** smoke-test each new/changed component in isolation (a demo route or a single activity). Reseed once.
- **After Wave 1:** reseed; click through the 14 fixed activities on `/activities-demo` or per-reviewer page.
- **After each Wave 2 batch:** validate JSON for the batch (`python3 -c "import json,glob;[json.load(open(f)) for f in glob.glob('activities/v2/*.json')]"`), reseed once.
- **After each Wave 3 item:** open the activity, walk it end-to-end.
- **After each Wave 4 item:** the activity's own mini-plan defines its own verification.

---

## What's intentionally not in this plan (yet)

- **PHQ-9 instrument-level decisions** beyond the simple 0–5 → 0–3 multiplier. If you want a deeper rework of the instrument, that's a separate plan.
- **The 5-4-3-2-1 dedupe outcome** beyond the diff. The decision (drop vs keep both) drives a small follow-up; flagged.
- **Anything about the family business** — already shipped as DIBs.
- **Cross-cutting MinkyPanel-as-aside removal** — notes mention several activities use MinkyPanel insets where they shouldn't (relational self-reflection, does this sound like me, i-statement practice, conflict navigation). I've called these out per-activity in Wave 3 but not factored a global "no MinkyPanel asides" sweep. If you want that as a standalone pass, flag it.
- **New tone-guide content beyond what we just landed** — if any Wave 4 work surfaces a new TONE.md gap, I'll flag it for a separate amendment plan, not roll it inline.
