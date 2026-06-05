# Activity Review & Remediation Progress

Tracking remediation of the 97 beta activities against the 13 canonical reference activities. Each beta activity has a per-activity audit at `activities/v2/audits/<slug>.md`. The master index is `activities/v2/audits/CANONICAL_PROTOTYPE_DISCREPANCIES.md`.

Severity buckets from audit:
- **Critical** (1+ Critical issue) — 36 activities
- **Major-only** (0 Critical, 1+ Major) — ~48 activities
- **Minor-only or clean** — ~13 activities

## Phase 1: Critical bucket — COMPLETE (36/36 ✓)

All 36 critical-bucket activities have been remediated. Common fix patterns applied:
- `__needsPrimitive: "..."` (broken) → top-level `__primitivesNeeded: ["..."]` array + composed fallback using existing primitives with real `ref`
- R5 cumulative-carry chains restored (every step after the first opens with `named-point-row` + `interactable: false` + `carryFrom` pairs for every prior bound therapeutic field, excluding `pre_mood`/`post_mood`/`journal`)
- Slider carries use `ref: "NumericRatingSlider"` + `numericReadoutVisible: false` (canonical pattern from `thought-record.json`)
- R2 violations (mid-flow `SummaryOutputCard` / `ButtonExportShareAction`) moved to terminal `saved` step or deleted
- R4 violations (manual save buttons) removed

### Wave 1 + 2 (23 activities)
multi-domain-wheel-radar-self-assessment, medication-tracking, life-domain-exploration, coping-statements-affirmations, substance-use-awareness-and-reduction, mood-tracking-log, parable-or-teaching-narrative, categorized-positive-reflection-worksheet, introspective-values-reflection, sleep-diary, three-week-sleep-restriction, causes-and-contributing-factors, light-therapy-exposure-tracking, north-star-values-compass, parenting-seasonal-planning, food-diary, exercise-engagement-and-planning, crisis-contact-directory, comparison-distinction-explainer, activity-scheduling-calendar, apathy-lethargy-toolkit, practice-tracker-log, treatment-options-overview, wellbeing-log

### Wave 3 leftovers (4 activities — completed this session)
- bulls-eye-and-compass-values — `DualSliderRowGrid` placeholder replaced with 10 paired `NumericRatingSlider`s (importance + alignment per domain)
- experiential-thought-demonstration — `SuppressedThoughtCardList` placeholder replaced with `FreeTextMultilineArea`; `connection` carry added
- symptom-severity-tracker — redundant `__needsPrimitive` block removed; `ChartTrendLineOrBar` props normalized
- supporter-caregiver-guide — `TwoBucketSortDeck` orphan stub removed (fallback `ChipMultiSelectTagGroup` Do/Don't already in place); R5 carries restored
- healthy-vs-unhealthy-behavior-sort — `BehaviorSortBuckets` placeholder at step level acceptable; components below render
- relationship-quality-self-assessment — `__needsPrimitive` already converted to sibling annotation
- typology-reference-list — `DraggableOrSwipeableCard` deck mode replaced with 10 `CollapsibleSection`s
- rights-or-affirmations-daily-reading — unresolvable `ref: "__needsPrimitive"` replaced; duplicate affirmation surface removed
- thought-challenging-questions — `DraggableOrSwipeableCard` deck replaced with 8 question/answer pairs; R5 cumulative carries restored
- problem-identification — R5 fixed; `LayoutQuadrantOrGridCells` rewritten with static `cellPayloads`
- multi-dimensional-framework-self-assessment — `radar` chart replaced with slider-carry stack; save now carries all 7 ratings
- personal-treatment-expectations-statement — R5 chain restored; mid-flow `SummaryOutputCard` + share action removed from `save`

## Phase 2: Major-only bucket — COMPLETE (48/48 ✓)

User-imposed concurrency caps: started at 2, briefly raised to 6, lowered to 4, now back to 2 for the long tail.

### Completed this session (48)
mindfulness-psychoeducation, multi-step-ba-program, help-seeking-planning, decatastrophizing, values-to-action-translation, paced-breathing-exercise, self-compassion-reframe, relaxation-modality-psychoeducation, attachment-style-identification, depression-disclosure-communication, emotion-body-mapping, event-based-coping-preparation, grief-loss-processing, integrated-multi-component-treatment-plan, interpersonal-dynamics-psychoed, mindful-sensory-activity, multi-domain-lifestyle-psychoeducation-menu, progressive-muscle-relaxation, readiness-to-change, episode-log-with-categorical-sorting, behavioral-cycle-stage-intervention, cbt-formulation-cycle-map, coping-strategy-tip-menu, graded-hierarchy-ladder, guided-visualization-meditation, reflective-journaling-prompted-self-reflection, self-identification-checklist, sleep-hygiene-education-and-routine, social-reengagement-activity-planning, technique-rating-and-selection-planner, motivation-barriers-analysis, barrier-identification-and-override, activity-categorization-sort, activity-idea-inventory, activity-mood-monitoring, assertive-communication-skills, binary-screener, conflict-navigation-steps, dual-list-contrast-worksheet, emotion-override-opposite-action, experiential-avoidance-analysis, myth-busting-and-knowledge-quiz, nutrition-and-eating-guidance, prosocial-acts-tracking, relational-self-reflection, stoic-virtue-practice, thought-reframing-replacement, self-care-action-planning-and-commitment, strengths-positive-qualities-inventory

## Phase 3: Minor-only / clean bucket — COMPLETE (11/11 ✓)

Light copy/polish applied:
- boundary-setting-and-saying-no — softened heavy `highlighted-callout`s; carry labels aligned with source `labelCopy`
- core-belief-work — removed step-title duplications of banner titles
- coping-response-diary — `situation` migrated to `FreeTextMultilineArea`; mood/notes unbundled
- concept-explainer — no actionable Minors (template-by-design)
- goal-motivation-and-barriers — added `saveMode`/`writeThroughTarget` to forward-action multilines
- goal-setting-and-commitment — standardized SMART-letter carry labels to full prompt sentences
- grounding-rapid-response-skill-sequence — journal prompt softened to 3-soft-questions template
- guided-imagery-visualization — save-step ordering normalized (post_mood first inside save)
- i-statement-framework-practice — removed stale `__primitivesNeeded` marker
- locus-of-control-sorting — `writeThroughTarget: "hope-chest"` added to `influence_moves`
- trigger-identification-logging — already clean (no changes needed)

## Phase 4: Corpus-wide text re-polish (96 beta activities) — COMPLETE (96/96 ✓)

Second-pass polish across every beta activity (excluding the 13 stable refs + just-fixed assertive-communication-skills) against the updated documentation triad:
- `WHOLE-ASS-PARAGRAPH.md` (voice + tone rules; hard rule against verbatim source material)
- `OPEN-ENDED-QUESTIONS.md` (vary entry points, weave escape hatches, don't list candidate emotions, match length to weight, some questions end without a net)
- `CREATE-NEW-WORKBOOK.md` (process doc)

Per-activity changes vary, but the common pattern across the corpus:
- Landing pages expanded to §7 template (concept + experience + permission).
- Recall/example prompts had their identical openers ("Try to think of a recent time…") rewritten to use varied entry points — feeling, relationship, pattern, image, sensation.
- Formulaic tacked-on escape hatches ("if a specific moment doesn't land…") reweaved into the asking or trusted to the reader.
- Candidate-emotion lists removed (no more "hurt, fear, exhaustion, feeling unheard").
- Closing JournalStep prompts normalized to true three-soft-question template (attention → meaning → forward intention).
- User-facing "spectrum" replaced with "range / scale / dial / landing" everywhere.

## Final verification (2026-05-24)

A repo-wide sweep over the 84 beta activity JSONs (excluding the 13 stable references) confirms:
- All `__needsPrimitive` instances are now sibling annotations (not `ref` values), each with a working `ref` and a renderable fallback. No broken inline placeholders remain.
- All audited files parse as valid JSON.
- The top-level `__primitivesNeeded` array on each activity records the deferred custom primitives for the future primitive-build backlog.

## Process notes

- User requested concurrency limit: **2 agents at a time** for the remaining work.
- Each agent reads `_SCHEMA.md`, the per-activity audit, and the canonical reference activities before editing.
- After each agent completes, JSON parse validity is verified.
- Top-level `__primitivesNeeded: [...]` array tracks deferred custom primitives across the corpus (for a future primitive-build backlog).

## Tracking

See live task list (TaskList tool):
- #17 — Remediate 97 beta activities per audit findings (umbrella)
- #18 — Wave-3 leftovers (✓ complete)
- #19 — Remaining 6 critical-bucket (✓ complete)
- #20 — Major-only bucket (in progress, 2/48)

## Phase 2 dispatch plan (2026-05-22)

Phase 2's remaining 46 activities split cleanly into two tiers by whether their JSON still carries `__needsPrimitive` markers (cross-referenced against the activities already listed with a top-level `__primitivesNeeded` array). The defect mix in every Phase 2 activity is otherwise dominated by R5 carry-chain drops, occasional R2/R4 violations, and prop drift on existing primitives.

**Recipe — same as Phase 1.** No new primitive code. For each activity:
1. Read `_SCHEMA.md`, the per-activity audit at `activities/v2/audits/<slug>.md`, and canonical refs `thought-record.json` (R5 cumulative-carry pattern) + `gad7-assessment.json` (R1 journal-step shape).
2. Restore R5 chains — every step after the first must open with paired `named-point-row` label + `interactable: false` + `carryFrom` blocks for every prior bound therapeutic field (excl. `pre_mood`/`post_mood`/`journal`). Save step is no exception.
3. Slider carries use `ref: "NumericRatingSlider"` + `numericReadoutVisible: false` (thought-record pattern).
4. Move any remaining inline `__needsPrimitive: "X"` to a top-level `__primitivesNeeded: ["X", ...]` array; replace the inline placeholder with a composed fallback of existing primitives.
5. Delete R2 violations (mid-flow `SummaryOutputCard` / `ButtonExportShareAction`) — move to terminal `saved` step or drop.
6. Delete R4 violations (manual Save buttons) entirely.
7. Validate JSON parse before returning.

### Tier A — pure R5 / prop-drift / R2-R4 (32 activities, 16 batches of 2)

No outstanding `__needsPrimitive` markers in current JSON. Fastest turnaround; dispatch first.

1. help-seeking-planning + values-to-action-translation
2. relaxation-modality-psychoeducation + depression-disclosure-communication
3. emotion-body-mapping + integrated-multi-component-treatment-plan
4. mindful-sensory-activity + multi-domain-lifestyle-psychoeducation-menu
5. reflective-journaling-prompted-self-reflection + self-identification-checklist
6. sleep-hygiene-education-and-routine + social-reengagement-activity-planning
7. technique-rating-and-selection-planner + motivation-barriers-analysis
8. barrier-identification-and-override + activity-categorization-sort
9. activity-idea-inventory + activity-mood-monitoring
10. assertive-communication-skills + binary-screener
11. conflict-navigation-steps + dual-list-contrast-worksheet
12. emotion-override-opposite-action + experiential-avoidance-analysis
13. myth-busting-and-knowledge-quiz + nutrition-and-eating-guidance
14. prosocial-acts-tracking + relational-self-reflection
15. stoic-virtue-practice + thought-reframing-replacement
16. self-care-action-planning-and-commitment + strengths-positive-qualities-inventory
17. coping-strategy-tip-menu *(plus Tier-A overflow if one surfaces)*

### Tier B — R5 + fallback-compose missing primitives (14 activities, 7 batches of 2)

Inline `__needsPrimitive` markers still present; fallback composition required per recipe step 4.

18. decatastrophizing + paced-breathing-exercise
19. self-compassion-reframe + attachment-style-identification
20. event-based-coping-preparation + grief-loss-processing
21. interpersonal-dynamics-psychoed + progressive-muscle-relaxation
22. readiness-to-change + episode-log-with-categorical-sorting
23. behavioral-cycle-stage-intervention + cbt-formulation-cycle-map
24. graded-hierarchy-ladder + guided-visualization-meditation

### Tier C — Phase 3 light copy-edit (13 activities, one batched sweep)

Minor-only or clean per audit. Single pass.

boundary-setting-and-saying-no, core-belief-work, coping-response-diary, concept-explainer, goal-motivation-and-barriers, goal-setting-and-commitment, grounding-rapid-response-skill-sequence, guided-imagery-visualization, i-statement-framework-practice, locus-of-control-sorting, trigger-identification-logging

### Concurrency

Per process-note: **2 agents at a time** for Phase 2. Batches dispatched as parallel background agents; next batch fires after both complete and JSON-validate. Tier C may be dispatched as a single sweep (lower per-activity cost).
