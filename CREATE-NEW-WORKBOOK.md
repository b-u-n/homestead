# CREATE-NEW-WORKBOOK

End-to-end process for designing and shipping a new workbook activity in this codebase. Captures the lessons learned from the 97-activity remediation cycle so a future agent (or human) can replicate the process from scratch.

Read alongside:
- `activities/v2/_SCHEMA.md` — the v2 activity JSON schema, primitives list, layout shapes, and R1–R6 rules.
- `WHOLE-ASS-PARAGRAPH.md` — voice, tone, and the hard rule on never copying source material.
- `OPEN-ENDED-QUESTIONS.md` — how to write prompts that ask for examples or recall (vary entry point, match length to weight, never "skip").
- `CLAUDE.md` — working-style guardrails (read full data flow, don't guess at props, etc.).
- The 13 canonical reference activities under `activities/v2/` (see list in §3).

---

## 1. The 0→1 question: do we even want a new activity?

Before writing anything, ask:

- **Is there already an activity that covers this?** Search `activities/v2/*.json`. Many concepts ("set a SMART goal," "rate the intensity," "list strengths") are already implemented and could be extended instead of duplicated.
- **Is there a canonical prototype for this in the prototypes corpus?** Look in `../workbooks/depression/treatment-plan/prototypes/<category>/`. If yes, the design decisions are mostly made — you're implementing, not designing.
- **Is this a real psychological need or a "more is more" impulse?** The corpus has 97 activities. Adding another should answer a question the existing set doesn't.

If yes, proceed. If no, route the work into an existing activity or write it up in `ACTIVITIES-TO-BUILD.md` as a deferred backlog item.

---

## 2. Research phase (the part that takes the longest, and matters most)

The single highest-leverage thing you can do is read the extraction corpus deeply on the topic. Skipping or skimming this is the #1 cause of weak activities.

### 2.1 Source mining

The mining process is documented in detail in `WHOLE-ASS-PARAGRAPH.md` §3-4. Summary:

1. **Wide search.** Find every extraction that mentions the concept:
   ```bash
   grep -lri "<concept-name>" workbooks/depression/treatment-plan/extractions
   ```
   Expect 5-50 hits.

2. **Read 4-8 of them fully.** Pick a mix: a clinical workbook, a self-help book, an online program, a peer-reviewed CBT protocol if present. Read for understanding, not for material.

3. **Read the combined / canonical prototype if it exists.** `../workbooks/depression/treatment-plan/combined-activities/` and `prototypes/` aggregate insight from multiple sources. They're more useful than raw extractions.

4. **Note the psychological vector(s)** the concept lives in (per `WHOLE-ASS-PARAGRAPH.md` §4): what feeling does it validate, what insight does it surface, what shift does it enable.

5. **Close the files.** From here on, never reference back word-for-word. Re-author in our voice.

### 2.2 The hard rule (restated, because it matters)

> **NEVER use exact examples, sentences, scenarios, dialog, or wording from any source material.** Extract the psychological intention, then craft a fresh natural example that lives in the same vector space. See `WHOLE-ASS-PARAGRAPH.md` §2 for the full rule and §4 for the technique.

### 2.3 Sanity-check against the canonical refs

Read at least 2 of the 13 canonical reference activities that are *adjacent* in category. Notice:
- How long is their intro framing?
- How many steps do they have?
- What kind of bind keys do they use?
- How is their save step structured?

Your new activity should feel like a sibling of these — not a step-child.

---

## 3. The 13 canonical reference activities (read these for voice + structure)

| Activity | Why it's canonical |
|---|---|
| `relapse-prevention-plan.json` | Multi-step planning skeleton, most authoritative. |
| `thought-record.json` | R5 cumulative-carry pattern; slider carry via `ref: "NumericRatingSlider"` + `numericReadoutVisible: false`. |
| `5-step-problem-solving.json` | Wizardy multi-step with clear branching. |
| `behavioral-experiment.json` | Pre/post comparison with hypothesis and outcome. |
| `body-scan.json` | Mindfulness pacing, observational tone. |
| `breath-meditation.json` | Timer + pacer integration. |
| `gad7-assessment.json` | Validated instrument + R1 journal-step shape. |
| `phq9-assessment.json` | Validated instrument with crisis branching. |
| `gratitude-log.json` | Short, low-friction positive-psychology pattern. |
| `safety-plan.json` | 988 banner, crisis-resource ordering. |
| `support-network-map.json` | Interpersonal scaffolding without prescription. |
| `thinking-traps.json` | Card-driven psychoeducation. |
| `values-inventory.json` | Long-list selection + winnowing. |

Read 2-3 minimum before authoring. More is better.

---

## 4. Schema phase: R1-R6 from `_SCHEMA.md`

These rules are non-negotiable. They make every activity feel like part of one corpus.

- **R1** — closing reflection is a `JournalStep` with `timerMinutes: 20`, `showWordCount: true`, `minWords: 0`.
- **R2** — terminal pair: `save` step (no `step.title`) + `saved` step (`terminal: true`, `carryAll: false`, single titled `SummaryOutputCard`). No mid-flow summary cards.
- **R3** — conventional bind keys verbatim: `pre_mood`, `post_mood`, `journal`.
- **R4** — no manual "Save" buttons; persistence is automatic on step transitions.
- **R5** — every step after the first opens with `named-point-row` label + `interactable: false` + `carryFrom: { stepId, bind }` pairs for every prior bound therapeutic field (excluding `pre_mood`/`post_mood`/`journal`). Cumulative — step N includes carries from steps 1 through N-1.
- **R6** — `pre_mood` in first step + `post_mood` in save step, both `QuickMoodMicroWidget` with `sourceActivityId` + `sourceSaveEvent`.

Skipping any of these means later remediation.

---

## 5. Authoring the JSON

### 5.1 Skeleton

Start from a clean copy of one of the canonical refs. Don't author from a blank file — too many small props are easy to miss.

The skeleton always looks like:

```json
{
  "activityId": "<kebab-case-slug>",
  "title": "<sentence-case title>",
  "emoji": "<one or two emoji>",
  "tags": {
    "conditions": [ "<from canonical list>" ],
    "themes": [ "<topic keywords>" ],
    "experience_level": "beginner | intermediate",
    "difficulty": "low | medium | high"
  },
  "steps": [
    { "stepId": "intro", ... },
    { "stepId": "<content-step>", ... },
    ...
    { "stepId": "save", ... },
    { "stepId": "saved", "terminal": true, ... }
  ]
}
```

### 5.2 Step-by-step

**Intro step:**
- `StickyTopBannerChrome` with `role: "header-activity-framing"` and `titleOrLabel`.
- 2-3 `StaticTextContentBlock` blocks framing the activity (see `WHOLE-ASS-PARAGRAPH.md` §7 landing template).
- `QuickMoodMicroWidget` bound to `pre_mood`.

**Content steps (between intro and save):**
- Open with R5 cumulative carries (named-point-row label + interactable carryFrom for every prior bound field).
- Then the new content for this step.
- Bound interactive primitives (`FreeTextMultilineArea`, `NumericRatingSlider`, `ChipMultiSelectTagGroup`, etc.) capture user input.
- Use `vertical` layout unless you have exactly 2 paired components (`split-2`) or exactly 4 (`grid-2x2`).

**Save step:**
- No `step.title`.
- Opens with cumulative R5 carries for every prior bound therapeutic field.
- Then `QuickMoodMicroWidget` bound to `post_mood`.
- Then `ReflectionFraming`.
- Then `JournalStep` (R1 — timed, word count, three-soft-question prompt).

**Saved step:**
- `terminal: true`, `carryAll: false`.
- Single `SummaryOutputCard` with `kind: "post-session-retrospective"`, `title`, `closingPromptText`.
- Nothing else.

### 5.3 Primitives — verify before using

Every primitive lives at `frontend/components/primitives/<Name>.js`. Read the source for real prop names before authoring. Common drift areas:

- `ChipMultiSelectTagGroup` — `guidingQuestionText` (not `labelCopy`), `presetChips` (not `options`), `rendering: "chip-strip"|"checkbox-list-vertical"`.
- `OptionSelectDropdown` — `allowMultiSelect` (not `selectionMode`), `label` (not `labelCopy`), `options: [{value, label}]`.
- `CollapsibleSection` — `headerTitle` (not `title`), `bodySlotContent` (not `body`), `initialState: "expanded"|"collapsed"`.
- `BinaryStateToggle` — `label` (not `labelCopy`), `presentation: "mark-done"|"heart-favorite-icon"|...`.
- `NumericRatingSlider` — `tickLabels: [...]` for anchors, `numericReadoutVisible: false` for carry-mode read-only.
- `DraggableOrSwipeableCard` — ONE card per instance. No `cards: [...]` array, no `deckMode`, no `perCardActionField`.

### 5.4 If you need a primitive that doesn't exist

You will. Common needs that lack primitives: radar charts, swipe decks of cards, force-field diagrams, calendar heatmaps, draggable tile grids.

The pattern is:

1. Add the needed primitive name to a top-level `__primitivesNeeded: ["..."]` array on the activity.
2. Compose a working fallback using existing primitives. The fallback should preserve the bind keys and the user-facing intent, even if visually simpler.
3. Never use `ref: "__needsPrimitive"` (the renderer cannot dispatch). Never use `__needsPrimitive` as a sibling key with no working `ref` underneath.

See `north-star-values-compass.json` for a clean example of this pattern.

### 5.5 Tone, copy, and the hard rule

This is where most activities go wrong. Follow `WHOLE-ASS-PARAGRAPH.md` rigorously:
- §2 — the hard rule (never copy source material).
- §5 — voice rules (do/don't/structural).
- §6 — the seven-question vector check.
- §7 — the landing-page expansion template.
- §8 — common rewrites cheat sheet.

---

## 6. Validation

Before declaring done:

### 6.1 Schema validation
```bash
# JSON parse
python -m json.tool < activities/v2/<slug>.json > /dev/null
# (or in PowerShell: Get-Content ... | ConvertFrom-Json)
```

### 6.2 R-rule checklist
- [ ] R1 — JournalStep has `timerMinutes: 20`, `showWordCount: true`, `minWords: 0`.
- [ ] R2 — `save` step has no `step.title`. `saved` step has `terminal: true`, `carryAll: false`, single `SummaryOutputCard`.
- [ ] R3 — `pre_mood`, `post_mood`, `journal` are exactly those keys.
- [ ] R4 — no manual save buttons (no `ButtonExportShareAction` with save-to-library label, no "Save" button anywhere).
- [ ] R5 — every step after the first opens with cumulative carries. Save step is no exception.
- [ ] R6 — `pre_mood` widget in first step, `post_mood` in save step, both with matching `sourceActivityId`.

### 6.3 Voice checklist
- See `WHOLE-ASS-PARAGRAPH.md` §10.

### 6.4 Visual / behavior verification
- Spawn dev server (`npm start` in `frontend/`).
- Open the activity in `activities-beta` (or `activities-demo` if you've seeded as non-beta).
- Walk every step, every input, every navigation path.
- Check Prev/Next buttons stay pinned outside the scroll. Check Back button steps backward (not jumping to picker).

---

## 7. Seeding and shipping

The seed file is `backend/src/seeds/seedActivitiesV2.js`. Beta activities seed automatically via the `isBeta` flag (everything not in `STABLE_ACTIVITY_IDS` is beta-only). After authoring, no manual seed step is needed — the seeder runs on backend boot.

To promote an activity from beta to stable:
1. Confirm the activity passes the audit rubric (see `activities/v2/audits/<slug>.md` template).
2. Add the `activityId` to the `STABLE_ACTIVITY_IDS` set in `seedActivitiesV2.js`.
3. Verify in `activities-demo` route that it now appears (not gated by beta).

---

## 8. Per-activity audit (for QA)

Every new activity should get an audit file at `activities/v2/audits/<slug>.md` covering:

1. R-rule compliance (R1–R6, one line each).
2. Drop / step structure findings.
3. Component-level discrepancies (per-step, per-component).
4. `sourceActivityId` consistency check.
5. Tone findings.
6. Severity tally (Critical / Major / Minor counts).
7. One-paragraph summary.

The 97 audit files in `activities/v2/audits/` are the templates. Copy the structure exactly.

---

## 9. Common authoring mistakes (from the remediation cycle)

These showed up dozens of times in the audit. Don't repeat them.

1. **R5 carrying only the immediately-prior step's bind instead of cumulative.** Each step's carry list should grow monotonically.
2. **Slider carries rendered as bare numbers.** Use `ref: "NumericRatingSlider"` + `numericReadoutVisible: false`, preceded by a `named-point-row` label.
3. **`__needsPrimitive` as the `ref` value** (renderer cannot dispatch). Use top-level `__primitivesNeeded` + composed fallback.
4. **Authored prop names that don't exist on the primitive** (e.g. `labelCopy` on `OptionSelectDropdown`). Read the JS source.
5. **`grid-2x2` layout with more or fewer than 4 components.** Use `vertical` for any non-paired step.
6. **`SummaryOutputCard` mid-flow** (R2 violation). It belongs only in the terminal `saved` step.
7. **Manual save buttons** (R4 violation). Persistence is automatic.
8. **Loaded language in tone** (`drift`, `default to`, `version of you that…`). See `WHOLE-ASS-PARAGRAPH.md` §5 don't list.
9. **Promises** (`you'll feel better`, `this will help you…`). Soften to *might*, *can*.
10. **Closing journal prompt as a content quiz** instead of a self-witness prompt. Three-soft-question template, always.

---

## 10. When in doubt

Read `WHOLE-ASS-PARAGRAPH.md` again. Most authoring mistakes are tone mistakes; most tone mistakes come from not having read enough source material on the topic; most source-material problems come from skimming for material instead of reading for understanding.

Slow down at the research phase. The rest follows.
