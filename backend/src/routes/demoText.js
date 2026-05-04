// activities-demo-temp — REST endpoint that serves text blobs out of the
// `text` collection for the activities-demo page. The `intro` and `bottom`
// keys are edited directly in the DB (no seed in code). The pipeline-doc
// keys (instructions, combine, prototypes) still auto-seed from the
// canonical strings below so the demo works on a fresh database. Remove
// this route when the demo is retired.
const express = require('express');
const router = express.Router();
const DemoText = require('../models/DemoText');

// Bumping a key's version forces a reseed on the next GET (so editing the
// canonical strings here actually shows up to clients without manual DB work).
const SEED_BY_KEY = {
  instructions: { version: 2, build: () => INSTRUCTIONS_CONTENT },
  combine: { version: 1, build: () => COMBINE_CONTENT },
  prototypes: { version: 1, build: () => PROTOTYPES_CONTENT },
  'activity-output': { version: 1, build: () => ACTIVITY_OUTPUT_CONTENT },
  activity: { version: 1, build: () => ACTIVITY_CONTENT },
  component: { version: 2, build: () => COMPONENT_CONTENT },
};

const INSTRUCTIONS_CONTENT = `# How to Analyze Workbook PDFs and Create Activity Schema Files

This document describes the process for extracting therapeutic activities from mental health workbooks and converting them into structured JSON activity definitions.

---

## Processing Model: One Subagent Per PDF, 4 Running at All Times

Each PDF is processed by its own subagent. **Keep 4 subagents running at all times.** When one finishes, immediately spawn a replacement — do not wait for all 4 to complete before starting the next batch.

### Orchestration Loop

1. Run \`node treatment-plan/check-extractions.js\` to regenerate \`todo.json\`
2. Read \`treatment-plan/todo.json\` for the pending queue
3. Spawn 4 subagents in parallel (background), each with a different PDF from the queue
4. Track which filenames are **in-flight** (assigned to a running subagent)
5. When a subagent completes, immediately pick the next item from \`todo.json\` that is NOT in-flight and spawn a replacement
6. When picking the next item, skip any filenames still in-flight — do not re-read todo.json each time (it may not yet reflect the just-completed subagent's work)
7. Periodically run \`node treatment-plan/check-extractions.js\` to get an accurate status (e.g., every 10 completions)

### Tracking In-Flight Assignments

In-flight assignments are tracked in \`treatment-plan/in-progress.json\` — a JSON array of filenames currently being processed. This file is the source of truth for what is in-flight.

**When picking PDFs to process:**
1. Read \`treatment-plan/in-progress.json\` to see what's already in-flight
2. Pick PDFs from \`todo.json\` that are NOT in \`in-progress.json\`
3. Write the updated list (old in-flight + new picks) back to \`in-progress.json\` using the Write tool
4. Skip exact duplicates (e.g., \`challenging-negative-thoughts (1).pdf\` if \`challenging-negative-thoughts.pdf\` was already processed or is in-flight)

**When a PDF is finished (extraction written + renamed with DONE_ prefix):**
1. Read \`in-progress.json\`, remove the completed filename, and write it back

**Why a separate file?** The Write tool can be permanently allowed without per-call approval, unlike Bash commands with varying arguments. This avoids permission prompts on every assignment.

\`check-extractions.js\` reads \`in-progress.json\` and preserves \`inProgress: true\` flags on matching entries in the generated \`todo.json\`.

### Directories of Split Pages

When a large PDF has been split into a \`_pages/\` directory (e.g., via \`split-big-pdfs.js\`), pass the **entire directory** to a single subagent — not individual pages. This preserves context across the full source document. The subagent handles batching internally (12 pages per batch).

### Handling Failed / Partial Extractions

Large PDFs may fail partway through when a subagent exhausts its context. \`check-extractions.js\` treats extraction files with \`processing_status.status: "in_progress"\` as **incomplete** and keeps them in the todo queue.

When spawning a subagent for a PDF that has a partial extraction, tell it:
- The extraction file already exists at \`treatment-plan/extractions/<slug>.json\`
- It should read the existing file, check \`pages_extracted\`, and **resume from where the previous agent left off**
- It must NOT re-extract pages already covered

The subagent instructions in \`SUBAGENT.md\` include a "Resuming a Failed or Partial Extraction" section with the full procedure.

### Page Counts in todo.json

Each entry in \`todo.json\` includes a \`pages\` field showing the PDF's page count:

\`\`\`json
{ "filename": "some-worksheet.pdf", "path": "/home/bun/git/workbooks/depression/some-worksheet.pdf", "size": 34707, "pages": 3 }
\`\`\`

To regenerate page counts (e.g., after adding new PDFs):

\`\`\`bash
node treatment-plan/list-pdfs.js          # scans all PDFs, writes pdfs.json with page counts
node treatment-plan/check-extractions.js  # regenerates todo.json from pdfs.json
\`\`\`

### Subagent Instructions

All instructions for what a subagent does with its assigned PDF are in \`treatment-plan/SUBAGENT.md\`. That file is self-contained — it includes the extraction methodology, schema field mappings, allowed enum values, quality checks, age adaptation guidelines, cross-condition applicability, common extraction patterns, a complete worked example, and the final checklist.

### Subagent Transcript Limit (32MB) and Image-Heavy PDFs

Each subagent has a **32MB transcript limit** — the total size of all tool calls, results, and responses. Image-heavy PDF pages (scanned docs, colorful worksheets) can be 5-10MB each when rendered, so even a few pages can exhaust this budget.

**When spawning subagents:**
- For split-page directories with large page files (>3MB each), instruct the subagent to use smaller batch sizes (3-4 pages instead of 12)
- If the original unsplit PDF still exists (with \`DONE_\` prefix), tell the subagent to read it directly using the \`pages\` parameter instead of the split-page files — this is more token-efficient
- Check page file sizes before spawning: \`ls -lhS <directory> | head -5\`

**When a subagent fails with "Request too large (max 32MB)":**
1. Check individual page file sizes in the directory
2. Respawn with smaller batch sizes, or point the subagent at the original PDF with \`pages\` parameter
3. As a last resort, assign fewer pages per subagent (split the work across multiple agents)

### Permissions

Subagents need Write and Bash permissions to save extraction JSONs, update the activity index, and rename files. \`SUBAGENT.md\` instructs them to request these permissions upfront before doing any expensive PDF reads. If you notice agents failing due to denied permissions, alert the user.

---

## Overview

The goal is to transform unstructured PDF workbook content into well-defined, machine-readable activity definitions that can be used to build personalized treatment plans. Each activity should be self-contained with enough information to:

1. Determine if it's appropriate for a specific user
2. Deliver the activity in multiple formats
3. Track progress and outcomes
4. Connect activities into coherent treatment sequences

---

## Phase 1: Initial Exploration

### 1.1 Inventory the Collection

Before reading individual files, get a high-level view of what exists:

\`\`\`
- Count total files and formats (PDF, markdown, etc.)
- Identify organizational structure (folders, naming conventions)
- Note file sizes (large files may be comprehensive workbooks)
- Look for existing metadata or indices
\`\`\`

### 1.2 Categorize by File Type

Group files into categories based on naming patterns:

| Category | Typical Naming Patterns | Examples |
|----------|------------------------|----------|
| Information Sheets | "Info Sheet", "What is...", numbered series | \`Anxiety Information Sheet - 01 - What is Anxiety.pdf\` |
| Worksheets | "Worksheet", "Form", "Diary", "Log" | \`Thought Diary 1.pdf\`, \`Exposure Hierarchy.pdf\` |
| Assessments | Assessment names, scales, inventories | \`GAD-7.pdf\`, \`SCARED.pdf\`, \`Burns-Anxiety-Inventory.pdf\` |
| Comprehensive Workbooks | "Workbook", large file sizes | \`The-Anxiety-Skills-Workbook.pdf\` |
| Specialized Guides | Condition-specific names | \`adult_hmpanic.pdf\`, \`social-anxiety-workbook.pdf\` |
| Age-Specific | "Teen", "Child", "Kids", "Student" | \`Anxiety-help-book-for-Teens.pdf\` |

### 1.3 Save the Inventory

Save the full categorized inventory to \`treatment-plan/inventory.md\`. For each PDF, record:
- Filename
- File size
- Category (from 1.2)
- Priority tier (from 1.4)
- Notes (duplicates, out-of-scope flags)

This file serves as the master tracking document for which PDFs have been categorized and their processing priority.

### 1.4 Prioritize Reading Order

Start with structured, numbered series (they're designed to build on each other):

1. **Information sheets** (numbered 01-20) - Foundation psychoeducation
2. **Worksheets** (numbered 01-10) - Practical exercises
3. **Assessment tools** - Understand measurement approaches
4. **Specialized content** - Condition-specific materials
5. **Comprehensive workbooks** - Cross-reference and fill gaps

---

## Phase 2: Multi-PDF Extraction Pipeline

**Extraction Workflow (high-level):**

\`\`\`
Step 1: Extract ALL activities from EACH PDF
        └─► Workbook A → [Activity 1, Activity 2, Activity 3, ...]
        └─► Workbook B → [Activity 4, Activity 5, ...]
        └─► Info Sheet C → [Activity 6]

Step 2: Aggregate activities across all PDFs
        └─► Master list of all activities with source references

Step 3: Deduplicate and merge
        └─► Same activity from multiple sources → single definition with multiple references
        └─► Identify variations (e.g., "Thought Diary Basic" vs "Thought Diary Extended")

Step 4: Create final JSON files
        └─► One JSON per unique activity
\`\`\`

Step 1 is handled by subagents (see \`SUBAGENT.md\`). Steps 2-4 are the combine phase — see \`COMBINE.md\`.

---

## Therapeutic Pattern Reference

### 3.1 Common Activity Types

Through analysis, you'll identify recurring patterns:

#### Psychoeducation Activities
- **Purpose**: Build understanding of anxiety mechanisms
- **Format**: Information sheets, diagrams, explanations
- **Key concepts**: Fight/flight response, vicious cycle, safety behaviors
- **Example**: "What is Anxiety?" explaining the fight/flight response

#### Cognitive Restructuring Activities
- **Purpose**: Identify and challenge unhelpful thoughts
- **Format**: Thought diaries, worksheets with ABC structure
- **Key components**:
  - A = Activating Event (trigger)
  - B = Beliefs (thoughts)
  - C = Consequences (emotions, behaviors)
- **Example**: Thought Diary with columns for situation, thought, emotion, evidence for/against

#### Exposure Activities
- **Purpose**: Gradually face feared situations
- **Format**: Hierarchies, tracking logs, SUDS ratings
- **Key components**:
  - Fear hierarchy (ranked list of situations)
  - SUDS scale (0-100 distress rating)
  - Exposure diary (tracking attempts)
- **Example**: Situational Exposure Diary with expected vs. actual SUDS

#### Relaxation Activities
- **Purpose**: Reduce physiological arousal
- **Format**: Scripts, guided exercises, tracking sheets
- **Key techniques**:
  - Breathing retraining (4-2-6 or 4-4-6 pattern)
  - Progressive Muscle Relaxation (18 muscle groups)
  - Grounding (5-4-3-2-1 senses)
- **Example**: PMR script with tense-hold-release for each muscle group

#### Mindfulness Activities
- **Purpose**: Present-moment awareness without judgment
- **Format**: Meditation scripts, daily practices
- **Key techniques**:
  - Breath awareness
  - Body scan
  - Leaves on a stream (for thoughts)
- **Example**: 5-minute breathing meditation with attention return instructions

#### Worry Management Activities
- **Purpose**: Contain and process worry productively
- **Format**: Worksheets, structured exercises
- **Key techniques**:
  - Productive vs. unproductive worry sorting
  - Worry time scheduling
  - Circle of control
- **Example**: Productive Worrying worksheet (worry → next step → set aside)

#### Tracking Activities
- **Purpose**: Monitor symptoms, progress, patterns
- **Format**: Logs, diaries, charts
- **Key elements**:
  - Date/time
  - Situation
  - Symptoms (physical, cognitive, emotional, behavioral)
  - Intensity ratings
- **Example**: Anxiety Symptoms Worksheet with 4 columns

### 3.2 Assessment Instruments

Assessments require special attention:

\`\`\`
For each assessment, capture:
- Full name and acronym
- Number of items
- Response scale (e.g., 0-3, 0-4)
- Scoring method
- Score ranges and interpretations
- Subscales (if any)
- Age range
- Validated cutoffs
- Frequency of administration
\`\`\`

---

## File Organization

### Directory Structure

\`\`\`
treatment-plan/
├── INSTRUCTIONS.md          # This file (main agent reference)
├── SUBAGENT.md              # Self-contained subagent instructions
├── COMBINE.md               # Post-extraction: visual reps, merge, validation, sequences
├── SPLIT.md                 # How to split large PDFs and add them to todo
├── schema.json              # Workbook-level schema
├── activity-schema.json     # Activity-level schema
├── inventory.md             # Categorized PDF inventory (Phase 1 output)
├── activity-index.md        # Master index linking activities to sources
├── variations-log.md        # Document all noted variations
├── pdfs.json                # All PDFs with sizes and page counts
├── todo.json                # Remaining PDFs to process (auto-generated)
├── extraction-status.json   # Progress summary (auto-generated)
├── extractions/             # Raw extractions from each PDF
├── assessments/
├── activities/              # Final JSON (created AFTER merge phase)
├── sequences/
└── crosswalk/
\`\`\`

### Naming Conventions

- Use lowercase with hyphens: \`thought-diary-basic.json\`
- Match ID to filename: \`id: "cognitive-thought-diary-basic"\` → \`thought-diary-basic.json\`
- Group by category in directories
- Use descriptive, searchable names

---

## Helper Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| \`list-pdfs.js\` | Scan directory, generate \`pdfs.json\` with all PDFs + sizes + page counts | \`node treatment-plan/list-pdfs.js\` |
| \`check-extractions.js\` | Compare extractions vs PDFs, generate status + todo. Reads \`in-progress.json\` for in-flight flags. | \`node treatment-plan/check-extractions.js\` |
| \`rename-done.js\` | Batch rename split-page PDFs with DONE_ prefix | \`node treatment-plan/rename-done.js <folder> <start> <end>\` |
| \`in-progress.json\` | JSON array of filenames currently being processed. Written by agents via Write tool. | (file, not script) |

---

## Starting a New Session

At the start of each new processing session:
1. Run \`node treatment-plan/check-extractions.js\` to see current progress
2. Read \`treatment-plan/todo.json\` for the pending queue
3. Spawn 4 subagents in parallel (background) for the first 4 items
4. As each subagent completes, immediately spawn a replacement for the next item in the queue
5. Keep 4 agents running at all times until the queue is empty
`;

const COMBINE_CONTENT = `# Combine Phase: Post-Extraction Processing

This phase begins after all PDFs have been extracted into \`treatment-plan/extractions/\`. Each extraction JSON contains a workbook-level wrapper with an \`activities\` array of structured activity objects.

---

## Step 1: Visual Representations

Before merging or deduplicating activities, generate visual representation ideas for each activity. This is idea generation — brainstorm format/layout options that inform how activities get rendered later.

### What to Consider

For each activity, consider:
- What format best communicates the activity to the user? (e.g., table, flowchart, wheel, scale, timeline, card, checklist, diagram)
- What interactive elements could enhance engagement? (e.g., sliders, drag-and-drop, fill-in fields, tap-to-reveal)
- What visual metaphors from the source material could be preserved? (e.g., ladders, thermometers, traffic lights, cycles)
- How does the \`content.steps\` structure map to visual layout? (e.g., step-by-step wizard, accordion sections, scrolling cards)
- How do \`items\` within steps render? (e.g., form fields, reference cards, rating scales, checklists)

### Process

Spawn one agent per extraction file. Each agent:

1. Reads all activities from its extraction JSON
2. Generates 4-5 visual representation ideas per activity
3. Writes the ideas back into the activity object in the extraction JSON as a \`visual_representations\` array
4. After all files are processed, build \`treatment-plan/format.json\` by scanning all extraction files

### Visual Representation Schema

Each idea in the \`visual_representations\` array:

\`\`\`json
{
  "visual_representations": [
    {
      "format": "accordion-wizard",
      "description": "Step-by-step wizard with expandable sections, one per step. User progresses linearly, completing each section before moving on.",
      "visual_elements": ["progress-bar", "expandable-sections", "step-indicators", "completion-checkmarks"],
      "state_elements": ["current_step", "completion_percentage", "completed_steps_array"],
      "data_requirements": ["content.steps", "content.steps[].items", "content.steps[].tips", "content.steps[].example"],
      "inputs": ["text-entry", "rating-scale-0-100"],
      "outputs": ["completed-thought-record", "belief-strength-ratings"]
    },
    {
      "format": "table-form",
      "description": "Multi-column table where each row is one instance. User adds rows as they practice.",
      "visual_elements": ["column-headers", "add-row-button", "example-row"],
      "state_elements": ["row_count", "entries_array"],
      "data_requirements": ["content.steps[].items (as columns)", "content.steps[].example (as example row)", "format.frequency"],
      "inputs": ["text-entry", "select-dropdown", "number-entry"],
      "outputs": ["filled-table", "pattern-summary"]
    }
  ]
}
\`\`\`

### Central Format Index

After all extraction files are updated, build \`treatment-plan/format.json\` — keyed by format name, each containing an array of activity IDs that format is viable for:

\`\`\`json
{
  "accordion-wizard": ["cognitive-thought-diary-basic", "cognitive-abc-analysis"],
  "table-form": ["tracking-mood-log", "tracking-depression-symptoms"],
  "rating-scale": ["assessment-phq9", "assessment-gad7"]
}
\`\`\`

---

## Step 2: Aggregate Activities Across All PDFs

Build a master list of all activities with source references:

\`\`\`
All extractions/
  └─► Collect every activity from every extraction JSON
  └─► Master list of all activities with source references
\`\`\`

Use \`treatment-plan/activity-index.md\` as the starting point — it already tracks every activity with its source PDF, page/section, and extraction file.

---

## Step 3: Deduplicate and Merge

Same activity from multiple sources → single definition with multiple references. Identify variations (e.g., "Thought Diary Basic" vs "Thought Diary Extended").

**Rules:**
- Do NOT merge until visual representations have been determined (Step 1)
- When merging, preserve all examples from all sources
- When merging, preserve all variations in instructions — note them, don't pick a winner
- Keep the richest version as the base, fold in unique content from other versions
- Update \`source_references\` to include all sources
- Use \`treatment-plan/variations-log.md\` to inform merge decisions — it documents differences found during extraction

---

## Step 4: Cross-Activity Validation

After merging, validate across the full set:

- [ ] No circular dependencies in prerequisites
- [ ] All referenced activity IDs exist
- [ ] Age ranges are consistent across related activities
- [ ] Assessment criteria reference valid assessments
- [ ] No orphan activities (activities with no connections)

---

## Step 5: Create Final Activity Files

One JSON per unique activity, organized by category:

\`\`\`
treatment-plan/activities/
├── psychoeducation/
├── cognitive/
├── behavioral/
├── relaxation/
├── mindfulness/
├── rumination-management/
├── tracking/
└── ...
\`\`\`

Naming: \`id: "cognitive-thought-diary-basic"\` → \`activities/cognitive/thought-diary-basic.json\`

---

## Step 6: Assessment-to-Activity Matching

Build a crosswalk mapping assessment results to recommended activities:

\`\`\`json
{
  "assessment": "gad7",
  "score_range": "5-9",
  "severity": "mild",
  "recommended_activities": [
    "psychoed-what-is-anxiety",
    "relaxation-breathing-retraining",
    "cognitive-thought-diary-basic",
    "mindfulness-introduction"
  ]
},
{
  "assessment": "gad7",
  "score_range": "10-14",
  "severity": "moderate",
  "recommended_activities": [
    "psychoed-vicious-cycle",
    "cognitive-challenging-thoughts",
    "exposure-hierarchy-creation",
    "relaxation-pmr",
    "tracking-anxiety-symptoms"
  ]
}
\`\`\`

For SCARED subscales, match to condition-specific activities:

\`\`\`json
{
  "assessment": "scared",
  "subscale": "social_anxiety",
  "score_above_cutoff": true,
  "recommended_activities": [
    "psychoed-social-anxiety",
    "behavioral-safety-behaviors",
    "exposure-social-hierarchy",
    "cognitive-thought-challenging-social"
  ]
}
\`\`\`

Save to \`treatment-plan/crosswalk/condition-activity-map.json\`.

---

## Step 7: Build Treatment Sequences

Create ordered sequences of activities for common treatment paths:

\`\`\`
treatment-plan/sequences/
├── beginner-depression-program.json
├── behavioral-activation-track.json
└── ...
\`\`\`

Each sequence defines an ordered list of activity IDs with rationale for the ordering.
`;

const PROTOTYPES_CONTENT = `# Prototype Extraction

Group the 1,105 activities by their **shape** — the core activity pattern — not their data or target. Output a small set of **activity prototypes**; each prototype gathers references to every source activity that instantiates it, plus the union of their visual representations.

## Key insight

The activities extracted from workbooks vary in data (target condition, example content, wording), but many share a single underlying activity shape:

- **PHQ-9** is an instance of "self-report symptom checklist with scoring". That prototype could hold many instruments.
- **SMART goals for behavior change**, **SMART goals for depression**, **value-aligned goal setting** — all instantiate one "goal setting" prototype. The goals themselves are data.
- **Self-care wheel** and **self-care checklist** — same prototype (self-care inventory), different representations.
- **Reflection after an event** — one activity that could apply to any event or any data set.

We are extracting the **core activity shape** and collecting all the specific instantiations as references. No content merging of per-instance data.

## Output

- New folder: \`treatment-plan/prototypes/<category>/\`
- One JSON file per prototype. Naming: \`<prototype-slug>.json\`.
- Each prototype references all source activities that instantiate it.
- Each prototype collects the union of visual representations across its instances.

Cross-category consolidation (e.g., a "reflection" prototype appearing in cognitive AND mindfulness) is a follow-up pass; stay within a single category for now.

## Prototype schema

\`\`\`json
{
  "id": "goal-setting",
  "name": "Goal Setting",
  "category": "behavioral",
  "description": "User articulates one or more goals using a structured framework (specificity, measurability, value-alignment). Data varies per instance; shape is stable.",
  "core_structure": {
    "typical_steps": [
      "Select a domain or target area",
      "Write the goal in concrete, observable terms",
      "Apply specificity criteria",
      "Identify obstacles and supports",
      "Define a first action and timeframe"
    ],
    "inputs": ["domain", "goal statement", "criteria"],
    "outputs": ["structured goal statement"]
  },
  "variants_observed": [
    "SMART goals (generic)",
    "SMART goals for behavior change (alcohol/smoking/diet)",
    "Value-aligned goals (ACT)",
    "Behavioral-activation mood-linked goals"
  ],
  "source_activities": [
    {
      "id": "behavioral-smart-goals",
      "title": "SMART Goals",
      "file": "activities/behavioral/smart-goals.json",
      "source_pdf": "...",
      "source_organization": "...",
      "variant": "SMART goals (generic)"
    }
  ],
  "visual_representations": [ /* unioned from all source activities, dedup by format */ ]
}
\`\`\`

## Procedure (per category agent)

1. List every *.json in \`treatment-plan/activities/<category>/\` (exclude merge-candidates.md and other non-json).
2. Scan all files quickly via Grep: \`id\`, \`title\`, \`description.short\`, \`subcategory\`, step titles.
3. Cluster activities by **shape** (not topic): group any activities whose core structure could be described by the same sequence of steps applied to different data.
4. For each cluster, write a prototype JSON to \`prototypes/<category>/<prototype-slug>.json\`:
   - Name the shape in the most general valid way.
   - Describe the core structure — steps that are invariant across instances.
   - List every source activity as a reference (full \`source_activities\` entries).
   - Note variants observed (what varies across instances: target condition, domain, scope).
   - Union the \`visual_representations\` across all source activities, dedup by \`format\` field.
5. Write \`prototypes/<category>/_log.md\` mapping each original activity → prototype it was assigned to.

## Clustering heuristics

**Same prototype:**
- Same activity shape, different target data (e.g., goal-setting for any domain).
- Same instrument, different citation (e.g., PHQ-9 across workbooks).
- Same interaction pattern, different visual form (e.g., self-care wheel vs. self-care list).
- Same reflective structure, different event (e.g., post-event reflection for any event type).

**Different prototypes:**
- Fundamentally different interaction (checklist vs. free-form journal vs. role-play).
- Different cognitive operation (identifying thoughts ≠ challenging thoughts ≠ scheduling behavior).
- Different instrument type (PHQ-9 and GAD-7 are different prototypes if we care about the instrument, OR one "symptom self-report" prototype if we only care about shape — prefer the shape-level grouping).

**Prefer broader prototypes.** If two clusters could reasonably be one shape, combine them. Granularity target: **dozens of prototypes per category**, not hundreds.

## What "shape" means operationally

A prototype is defined by:
- The **sequence of user interactions** (read → rate → write → choose → reflect)
- The **invariant structure** (e.g., "for each of N items, do X")
- NOT by: topic, target condition, example content, wording, citation, or the specific data the user provides.

## Calibration set (the user's examples)

- **All PHQ-9 activities** → one \`phq9.json\` (or more general \`self-report-symptom-checklist.json\`) prototype. All source refs preserved.
- **All readiness-to-change** variants → one \`readiness-to-change.json\` prototype, regardless of target behavior.
- **All protective-factors** lists → one \`protective-factors-inventory.json\` prototype.
- **Self-care wheel + self-care checklist** → one \`self-care-inventory.json\` prototype (both formats captured in \`visual_representations\`).
- **Goal setting** → one \`goal-setting.json\` prototype covering SMART variants, value-aligned variants, behavior-change variants, etc.

## Post-pass: cross-category consolidation

After all per-category prototypes are written, do a pass to merge prototypes with the same shape across categories (e.g., "reflection" in cognitive + mindfulness). Output: \`prototypes/_cross-category-merges.md\` proposing consolidations for review before actually merging.
`;

const ACTIVITY_OUTPUT_CONTENT = JSON.stringify({
  activityId: 'cognitive-distortions-identification',
  title: 'Thinking Traps',
  emoji: '🪤',
  tags: {
    conditions: [
      'generalized-anxiety-disorder',
      'anxiety-disorders',
      'depression',
      'social-anxiety',
    ],
    themes: [
      'cognitive-awareness',
      'thinking-patterns',
      'self-knowledge',
    ],
    experience_level: 'beginner',
    difficulty: 'low',
  },
  steps: [
    {
      stepId: 'intro',
      title: 'What are thinking traps?',
      layout: 'vertical',
      collect: 'merge',
      components: [
        {
          ref: 'StickyTopBannerChrome',
          props: {
            role: 'header-activity-framing',
            titleOrLabel: 'Common cognitive distortions',
            framingCopy:
              'Our brains take mental shortcuts that can lead to distorted thinking. These "thinking traps" feel true in the moment but aren\'t based on facts. Naming them is the first step to loosening their grip.',
          },
        },
        {
          ref: 'StaticTextContentBlock',
          props: {
            blockRole: 'bulleted-list',
            items: [
              'Catastrophizing — jumping to the worst possible outcome',
              'Black-and-white thinking — seeing things as all good or all bad',
              'Mind reading — assuming you know what others think',
              'Fortune telling — predicting negative outcomes',
              'Emotional reasoning — "I feel it, so it must be true"',
              'Should statements — rigid rules about how things ought to be',
              'Discounting positives — dismissing good things that happen',
              'Overgeneralizing — one bad event means everything is bad',
            ],
          },
        },
        {
          ref: 'QuickMoodMicroWidget',
          bind: 'pre_mood',
          props: {
            uiSubform: 'emoji-anchored-slider',
            promptText: 'How are you feeling right now?',
            scaleMin: 1,
            scaleMax: 10,
            lowAnchorEmoji: '😔',
            highAnchorEmoji: '😊',
            sourceActivityId: 'cognitive-distortions-identification',
            sourceSaveEvent: 'pre-session',
          },
        },
      ],
    },
    {
      stepId: 'identify',
      title: 'Which thinking traps do you tend to fall into?',
      layout: 'vertical',
      collect: 'merge',
      components: [
        {
          ref: 'StaticTextContentBlock',
          props: {
            blockRole: 'rich-text-prose',
            tone: 'warm-supportive',
            text: "Tick any that ring true. Everyone uses some — this isn't about getting a low score, it's about seeing your patterns.",
          },
        },
        {
          ref: 'ChipMultiSelectTagGroup',
          bind: 'traps',
          props: {
            rendering: 'checkbox-list-vertical',
            rowFormat: 'name-plus-short-description',
            allowCustomEntry: true,
            presetChips: [
              {
                id: 'catastrophizing',
                label: 'Catastrophizing',
                short_description: 'Jumping straight to the worst possible outcome.',
                examples: [
                  '"If I fail this test, my whole future is ruined."',
                  '"This headache must be something serious."',
                  '"They didn\'t text back — something terrible happened."',
                ],
              },
              {
                id: 'black-white',
                label: 'Black-and-white thinking',
                short_description: 'Seeing things as all good or all bad, with no middle ground.',
                examples: [
                  '"I made one mistake, so I\'m a total failure."',
                  '"If it\'s not perfect, it\'s worthless."',
                  '"They were short with me — they must hate me."',
                ],
              },
              {
                id: 'mind-reading',
                label: 'Mind reading',
                short_description: 'Assuming you know what others are thinking — usually badly.',
                examples: [
                  '"They think I\'m boring."',
                  '"My boss is annoyed with me."',
                  '"Everyone noticed I was nervous."',
                ],
              },
              {
                id: 'fortune-telling',
                label: 'Fortune telling',
                short_description: 'Predicting negative outcomes as if they were certain.',
                examples: [
                  '"I\'ll embarrass myself if I speak up."',
                  '"This is going to go badly."',
                  '"I won\'t be able to handle it."',
                ],
              },
              {
                id: 'emotional-reasoning',
                label: 'Emotional reasoning',
                short_description: 'Treating feelings as evidence: "I feel it, so it must be true."',
                examples: [
                  '"I feel anxious, so something must be wrong."',
                  '"I feel guilty, so I must have done something bad."',
                  '"I feel like a fraud, so I am one."',
                ],
              },
              {
                id: 'should',
                label: 'Should statements',
                short_description: 'Rigid rules about how you or others ought to be.',
                examples: [
                  '"I should never feel anxious."',
                  '"They should have known how I felt."',
                  '"I shouldn\'t need help with this."',
                ],
              },
              {
                id: 'discounting',
                label: 'Discounting positives',
                short_description: 'Dismissing the good stuff as luck, flukes, or "it doesn\'t count".',
                examples: [
                  '"They\'re just being nice."',
                  '"Anyone could have done that."',
                  '"I got lucky — it doesn\'t mean anything."',
                ],
              },
              {
                id: 'overgeneralizing',
                label: 'Overgeneralizing',
                short_description: 'One bad event becomes proof that everything is bad, always.',
                examples: [
                  '"I always mess this up."',
                  '"Nothing ever works out for me."',
                  '"I\'ll never get this right."',
                ],
              },
            ],
          },
        },
      ],
    },
    {
      stepId: 'example',
      title: 'Pin it to a recent thought',
      layout: 'vertical',
      collect: 'merge',
      components: [
        {
          ref: 'StaticTextContentBlock',
          props: { blockRole: 'named-point-row', text: 'Traps' },
        },
        {
          interactable: false,
          carryFrom: { stepId: 'identify', bind: 'traps' },
        },
        {
          ref: 'StaticTextContentBlock',
          props: { blockRole: 'section-divider' },
        },
        {
          ref: 'StaticTextContentBlock',
          props: {
            blockRole: 'rich-text-prose',
            tone: 'warm-supportive',
            text: 'Think of an anxious thought you had recently. Which trap(s) does it fit into? Writing it out makes the pattern visible — and patterns you can see, you can question.',
          },
        },
        {
          ref: 'FreeTextMultilineArea',
          bind: 'recent_example',
          props: {
            promptText: 'The thought, and the trap(s) you think it fits',
            placeholder:
              'e.g., "I thought \'they\'re going to fire me\' after a single critical email — fortune telling and catastrophizing."',
          },
        },
      ],
    },
    {
      stepId: 'save',
      layout: 'vertical',
      collect: 'merge',
      components: [
        { ref: 'StaticTextContentBlock', props: { blockRole: 'named-point-row', text: 'Traps' } },
        { interactable: false, carryFrom: { stepId: 'identify', bind: 'traps' } },
        { ref: 'StaticTextContentBlock', props: { blockRole: 'section-divider' } },
        {
          ref: 'StaticTextContentBlock',
          props: {
            blockRole: 'named-point-row',
            text: 'The thought, and the trap(s) you think it fits',
          },
        },
        { interactable: false, carryFrom: { stepId: 'example', bind: 'recent_example' } },
        { ref: 'StaticTextContentBlock', props: { blockRole: 'section-divider' } },
        {
          ref: 'QuickMoodMicroWidget',
          bind: 'post_mood',
          props: {
            uiSubform: 'emoji-anchored-slider',
            promptText: 'How are you feeling now?',
            scaleMin: 1,
            scaleMax: 10,
            lowAnchorEmoji: '😔',
            highAnchorEmoji: '😊',
            sourceActivityId: 'cognitive-distortions-identification',
            sourceSaveEvent: 'post-session',
          },
        },
        { ref: 'ReflectionFraming' },
        {
          ref: 'JournalStep',
          bind: 'journal',
          props: {
            prompt:
              'Which trap surprised you the most to recognise in yourself? What might shift if you caught it sooner next time — even by a beat?',
            timerMinutes: 20,
            showWordCount: true,
            minWords: 0,
          },
        },
      ],
    },
    {
      stepId: 'saved',
      terminal: true,
      layout: 'vertical',
      collect: 'merge',
      carryAll: false,
      components: [
        {
          ref: 'SummaryOutputCard',
          props: {
            kind: 'post-session-retrospective',
            title: 'Saved',
            closingPromptText:
              'Your thinking traps snapshot is stored in your diary. Catching the pattern is the work; the rest is practice. Be patient with yourself — these grooves are old.',
          },
        },
      ],
    },
  ],
}, null, 2);

const ACTIVITY_CONTENT = JSON.stringify({
  id: 'cognitive-thinking-traps-teens',
  name: 'Thinking Traps for Teens',
  category: 'cognitive',
  subcategory: 'cognitive-restructuring',
  description: {
    short: 'Identifies four thinking traps (fortune telling, catastrophizing, overgeneralization, all-or-nothing) and teaches three challenge questions.',
    full: "This activity teaches teens to recognize and challenge four common thinking traps connected to sadness and depression: Fortune Telling (predicting that bad things will happen in the future, e.g., 'I\\'m probably going to be sad forever'), Catastrophizing (making little problems seem like big problems, e.g., 'My best friend didn\\'t text me at all today. I bet she hates me now and is going to ditch me'), Overgeneralization (assuming that because we had a hard time in one situation, the same problem will happen again, e.g., 'I had a hard time with essay questions on our English exam. I\\'m going to mess up the essay questions in History, too'), and All-or-Nothing Thinking (seeing things as all good or all bad, ignoring the middle ground, e.g., 'Three of my friends said they like my sneakers, but Tim didn\\'t say anything. I look stupid. I should have gotten a different pair'). Three challenge questions are taught: (1) What are the facts? What is the likelihood that what you\\'re worrying about will happen? (2) What would you tell a friend in this situation? (3) What can you do to solve your problem or take your mind off it? A practice worksheet provides a worked example (Fortune Telling) and blank sections for Catastrophizing, Overgeneralization, and All-or-Nothing Thinking.",
    purpose: 'Builds awareness of negative thinking patterns that maintain depression and teaches a simple three-question framework for challenging those thoughts, leading to more balanced and realistic thinking.',
  },
  therapeutic_approach: ['CBT', 'cognitive-restructuring'],
  target_conditions: {
    primary: ['major-depressive-disorder', 'persistent-depressive-disorder', 'situational-depression'],
    secondary: ['depression-with-anxiety'],
  },
  age_range: {
    min: 13,
    max: 17,
    age_adaptations: [
      {
        range: '13-17',
        modifications: 'Uses teen-relevant examples (friends, texting, school exams, sneakers). Only four thinking traps are introduced (simplified from adult versions which may have 8-12). Challenge questions are simplified to three accessible prompts. Encourages using playful examples (e.g., silly pizza catastrophizing) if serious examples feel overwhelming.',
        language_level: 'moderate',
      },
    ],
  },
  severity_range: {
    min: 'minimal',
    max: 'moderate',
    notes: 'Appropriate for teens with mild to moderate negative thinking. If changing negative thinking is very hard, the tips page suggests starting with fun/playful examples and seeking professional help if needed.',
  },
  preconditions: {
    required_activities: [],
    required_skills: ['Basic ability to identify thoughts and feelings'],
    contraindications: [
      'Not a substitute for professional cognitive therapy for severe depression',
      'If teen becomes very distressed when examining thoughts, proceed slowly or with professional support',
    ],
  },
  format: {
    primary_format: 'worksheet',
    alternate_formats: ['information-sheet', 'interactive-activity'],
    delivery_mode: ['self-guided', 'parent-assisted', 'therapist-assisted'],
    duration: { min_minutes: 15, max_minutes: 30, typical_minutes: 20 },
    frequency: { recommended: 'daily practice for a few minutes', minimum: 'weekly' },
  },
  content: {
    steps: [
      {
        step: 1,
        title: 'Learn the four thinking traps',
        description: 'Review the four common thinking traps that are often connected to sadness and depression. See if you can come up with more examples that apply to your life.',
        items: [
          {
            name: 'Fortune Telling',
            description: 'Predicting that bad things will happen in the future. People dealing with depression sometimes predict their sadness will continue.',
            type: 'reference',
            examples: ["I've felt really sad for the past few weeks. I'm probably going to be sad forever."],
          },
          {
            name: 'Catastrophizing',
            description: 'Making little problems or disappointments seem like big problems. We make a big deal out of situations, even when they might not be that serious or bad.',
            type: 'reference',
            examples: ["My best friend didn't text me at all today. I bet she hates me now and is going to ditch me."],
          },
          {
            name: 'Overgeneralization',
            description: 'Assuming that because we had a hard time in one situation, our same problem will happen again in a new one. We ignore the unique facts about a situation.',
            type: 'reference',
            examples: ["I had a hard time with the essay questions on our English exam. I'm going to mess up the essay questions in History, too!"],
          },
          {
            name: 'All-or-Nothing Thinking',
            description: "Seeing things as 'all good' or 'all bad.' We ignore the fact that many situations are in the middle and have both positive and negative aspects.",
            type: 'reference',
            examples: ["Three of my friends said they like my sneakers, but Tim didn't say anything. I look stupid. I should have gotten a different pair."],
          },
        ],
      },
      {
        step: 2,
        title: 'Learn three challenge questions',
        description: 'Use these three questions to help you think in more positive ways when you notice a thinking trap.',
        items: [
          {
            name: 'What are the facts?',
            description: "What is the likelihood that what you're worrying about will happen? Often there is very little evidence that the things we are stressed about will actually happen. Try to look at the facts to think more realistically and feel empowered that you are capable of dealing with stress.",
            type: 'reference',
          },
          {
            name: 'What would you tell a friend in this situation?',
            description: 'Focusing on helping a peer may help you with perspective taking and problem solving. This strategy can help you feel calmer and more positive about the stressor.',
            type: 'reference',
          },
          {
            name: 'What can you do to solve your problem or take your mind off it?',
            description: "If possible, take concrete steps to solve the problem. If that's not possible, use relaxation or other coping skills (Depression Skill 3) to reduce stress and take your mind off things.",
            type: 'reference',
          },
        ],
      },
      {
        step: 3,
        title: 'Review the worked example',
        description: 'Study the Fortune Telling example to see how the three challenge questions work in practice.',
        example: {
          thinking_trap: 'Fortune Telling',
          thought: "I've felt really depressed for the past few weeks. I'm going to be depressed forever.",
          'What are the Facts?': "I'm learning things that might help me start to feel better. I already feel happy sometimes after I do the stuff in Making Time for Fun. I've felt sad in the past, and it didn't last forever.",
          'What Would I Say to a Friend?': "It's going to get better! You are working hard at being more positive.",
          'What can I do to take my mind off things?': "I'm going to go for a run and try to forget about this thought for a little while.",
        },
      },
      {
        step: 4,
        title: 'Practice with the worksheet',
        description: 'For each of the three remaining thinking traps (Catastrophizing, Overgeneralization, All-or-Nothing Thinking), an example thought is provided. Answer the three challenge questions for each.',
        items: [
          {
            name: 'Catastrophizing practice',
            description: "Thought: 'My best friend didn't text me at all today. I bet she hates me now and is going to ditch me.' Answer the three challenge questions.",
            type: 'text',
          },
          {
            name: 'Overgeneralization practice',
            description: "Thought: 'I had a hard time with the essay questions on our English exam. I'm going to mess up the essay questions in History, too!' Answer the three challenge questions.",
            type: 'text',
          },
          {
            name: 'All-or-Nothing Thinking practice',
            description: "Thought: 'Three of my friends said they like my sneakers, but Tim didn't say anything. I look stupid. I should have gotten a different pair.' Answer the three challenge questions.",
            type: 'text',
          },
        ],
      },
    ],
    prompts: [
      'Can you think of examples of thinking traps in your own life?',
      'Which thinking trap do you fall into most often?',
      'What would you tell a friend who was having this thought?',
    ],
    tips: [
      'If a particular type of thinking trap is challenging, brainstorm additional examples that connect to your interests (e.g., your favorite sport or movie)',
      'If you notice yourself getting very down after school, check if you are falling into thinking traps and see if you can gently challenge them',
      'If you struggle to separate thinking traps into different categories, just focus on noticing your negative thoughts in general and changing them',
      'Negative thoughts are often automatic, like a habit. Becoming a more positive thinker requires breaking this habit through regular practice',
      "Start with fun and playful examples if jumping into your own negative thinking patterns feels overwhelming (e.g., 'I asked for sausage and they gave me pepperoni! This is the worst pizza place ever!' -- catastrophizing)",
      'Practice on a regular basis for a few minutes at a time (daily if you can manage it)',
    ],
  },
  outcomes: {
    expected_benefits: [
      'Increased awareness of negative thinking patterns',
      'Ability to identify specific thinking traps',
      'More balanced and realistic thinking',
      'Reduced feelings of hopelessness and helplessness',
      'Improved self-esteem and confidence',
    ],
    skills_developed: [
      'Identifying thinking traps',
      'Cognitive restructuring using three questions',
      'Perspective-taking (friend technique)',
      'Reality testing',
    ],
    progress_indicators: [
      'Can identify which thinking trap applies to a given negative thought',
      'Can apply the three challenge questions to their own thinking traps',
      'Reports catching thinking traps in daily life and challenging them',
    ],
  },
  when_to_use: [
    'When noticing persistent negative thoughts or sadness',
    'When feeling stuck, hopeless, or overwhelmed by a situation',
    'After mood tracking reveals patterns of negative thinking',
    'As a regular daily practice to build the habit of realistic thinking',
  ],
  when_not_to_use: [
    'Not a substitute for professional cognitive therapy for severe or treatment-resistant depression',
    'If examining thoughts significantly increases distress, pause and use relaxation skills first',
    'Should not be used to dismiss legitimate concerns -- some negative thoughts are accurate and need problem-solving rather than reframing',
  ],
  related_activities: [
    { id: 'tracking-mood-tracking-teens', relationship: 'prerequisite' },
    { id: 'behavioral-activation-making-time-for-fun-teens', relationship: 'complementary' },
    { id: 'relaxation-deep-breathing-teens', relationship: 'complementary' },
    { id: 'behavioral-problem-solving-teens', relationship: 'complementary' },
  ],
  source_references: [
    {
      title: 'Guided Self-Management Tools for Depression: Teens 13-17',
      source: "Boston Children's Hospital",
      page: '14-16',
    },
  ],
  metadata: {
    version: '1.0',
    created: '2026-04-04',
    updated: '2026-04-04',
    tags: [
      'teen',
      'thinking-traps',
      'cognitive-restructuring',
      'fortune-telling',
      'catastrophizing',
      'overgeneralization',
      'all-or-nothing',
      'BCH',
      'depression-skill-4',
    ],
  },
  visual_representations: [
    {
      format: 'thinking-trap-flashcards',
      description: "A set of 4 interactive flashcards, one per thinking trap. The front of each card shows the trap name (Fortune Telling, Catastrophizing, Overgeneralization, All-or-Nothing Thinking), a simple icon (crystal ball, megaphone, copy-paste symbol, binary switch), and a one-line definition. Tapping the card flips it to reveal the teen-relevant example thought from the workbook. A 'My Example' button lets the teen add their own personal example on the back of the card. Cards can be swiped through horizontally. After reviewing all four, a 'Start Practice' button leads to the challenge worksheet.",
      visual_elements: [
        '4 horizontal swipe cards',
        'front: trap name, icon, one-line definition',
        "back: example thought in quote bubble, 'My Example' text input",
        'flip animation',
        'card position dots (1 of 4)',
        "'Start Practice' button after all viewed",
        'trap-specific color coding',
      ],
      state_elements: [
        'current_card_index',
        'cards_viewed (set)',
        'user_examples (map of trap_name to string)',
        'card_flipped (boolean per card)',
      ],
      data_requirements: [
        'content.steps[0].items (4 thinking traps with names, descriptions, examples)',
        "content.prompts[0] ('Can you think of examples in your own life?')",
      ],
      inputs: ['swipe to navigate cards', 'tap to flip', 'type personal example'],
      outputs: ['all 4 traps reviewed', 'optional personal examples saved'],
    },
    {
      format: 'challenge-question-worksheet',
      description: "An interactive worksheet for Step 3 and Step 4. The screen shows a thought bubble at the top containing the negative thought (either from the workbook examples or the teen's own). Below it, the selected thinking trap type is shown as a labeled badge. Three expandable sections follow, one per challenge question: 'What are the facts?', 'What would you tell a friend?', 'What can you do?' Each section has a text area for the teen's response. For the Fortune Telling example (Step 3), the worked answers are pre-filled and shown in a distinct 'example' style. For the three practice thoughts (Step 4), the sections are blank for the teen to complete. A 'Compare' button on the Fortune Telling card lets the teen compare their thinking with the worked example.",
      visual_elements: [
        'thought bubble with negative thought text',
        'thinking trap badge (color-coded)',
        '3 expandable challenge-question sections',
        'text input area per question',
        'worked-example styling (italic/indented) for Fortune Telling',
        "'Compare with example' toggle on practice items",
        'submit/save button',
        'progress indicator (1 of 4 thoughts completed)',
      ],
      state_elements: [
        'current_thought_index (0=example, 1-3=practice)',
        'responses (array of {trap_type, thought, q1_answer, q2_answer, q3_answer})',
        'sections_expanded (set)',
      ],
      data_requirements: [
        'content.steps[1].items (3 challenge questions with descriptions)',
        'content.steps[2].example (Fortune Telling worked example)',
        'content.steps[3].items (3 practice thoughts: Catastrophizing, Overgeneralization, All-or-Nothing)',
      ],
      inputs: [
        'type answers for each of the 3 challenge questions',
        'tap to expand/collapse sections',
        'navigate between the 4 thought exercises',
      ],
      outputs: ['completed challenge responses for all 4 thought exercises'],
    },
    {
      format: 'thought-trap-sorter',
      description: "A gamified drag-and-drop sorting exercise to build trap-identification skill. A stream of negative thought cards appears at the top of the screen, one at a time. Four labeled 'bins' sit at the bottom (Fortune Telling, Catastrophizing, Overgeneralization, All-or-Nothing). The teen drags each thought card to the correct bin. Correct sorts trigger a brief positive animation; incorrect sorts show a gentle hint explaining why it fits a different category. The exercise uses the workbook's 4 example thoughts plus 4-6 additional generated examples. A score counter tracks correct-on-first-try. This addresses the tip about practice being key to breaking automatic negative thinking habits.",
      visual_elements: [
        'thought card at top (draggable)',
        '4 labeled drop-target bins at bottom with icons',
        'correct-sort animation (green flash, checkmark)',
        'incorrect-sort hint popup',
        'score counter',
        "card queue indicator (e.g., 'Thought 3 of 8')",
        'final summary screen with accuracy percentage',
      ],
      state_elements: [
        'thought_queue (array of {text, correct_trap})',
        'current_thought_index',
        'score (correct_first_try count)',
        'total_attempts',
        'results (array of {thought, chosen_trap, correct_trap, was_correct})',
      ],
      data_requirements: [
        'content.steps[0].items (4 thinking traps with examples)',
        'content.tips[2] (if you struggle to categorize, just notice negative thoughts)',
      ],
      inputs: ['drag thought card to a trap bin'],
      outputs: ['sorting accuracy score', 'list of thoughts with correct/incorrect categorizations'],
    },
    {
      format: 'thought-reframe-journal',
      description: "A free-form journal view for daily thinking-trap practice. The screen presents a simple form: (1) 'What negative thought did you notice?' (text input), (2) 'Which thinking trap is it?' (4-option selector with trap icons), (3) the three challenge questions as text inputs. Completed entries are saved as dated journal cards in a scrollable history feed below the form. Each historical card shows the date, the original thought, the trap type badge, and a collapsed view of the reframed responses (expandable on tap). A streak counter at the top tracks consecutive days of practice, reinforcing the daily habit recommended in the tips.",
      visual_elements: [
        'journal entry form (thought, trap selector, 3 question inputs)',
        'date stamp on each entry',
        'scrollable history feed of past entries',
        'trap-type color-coded badges',
        'expandable historical entry cards',
        'practice streak counter at top',
        "empty-state prompt ('Catch a thinking trap today!')",
      ],
      state_elements: [
        'current_entry (draft)',
        'journal_entries (array of dated entries)',
        'streak_count (consecutive days)',
        'selected_trap_type',
      ],
      data_requirements: [
        'content.steps[1].items (3 challenge questions)',
        'content.steps[0].items (4 trap types for selector)',
        "content.tips[5] ('Practice on a regular basis')",
        "format.frequency.recommended ('daily')",
      ],
      inputs: [
        'type negative thought',
        'select thinking trap type',
        'type answers to 3 challenge questions',
        'tap to save entry',
      ],
      outputs: [
        'saved journal entry',
        'growing history of reframed thoughts',
        'streak tracking data',
      ],
    },
    {
      format: 'playful-example-generator',
      description: "An ice-breaker screen for teens who find it overwhelming to start with their own negative thoughts (per the tip about using fun/playful examples). The screen presents silly, low-stakes scenarios with exaggerated thinking traps -- e.g., 'They gave me pepperoni instead of sausage! This is the WORST pizza place EVER!' (Catastrophizing). The teen identifies the trap type and answers the three challenge questions in a lighthearted context. After 2-3 playful rounds, the screen transitions to 'Now try one of your own' with the real worksheet. This lowers the barrier to engaging with cognitive restructuring.",
      visual_elements: [
        'illustrated silly scenario cards (pizza, dropped ice cream, etc.)',
        'exaggerated thought in large comic-style speech bubble',
        'trap-type selector (4 options)',
        '3 challenge question inputs',
        'playful animations on correct identification',
        "transition screen: 'Ready to try your own?'",
        '2-3 pre-loaded scenarios',
      ],
      state_elements: [
        'current_scenario_index',
        'scenarios_completed',
        'responses (array)',
        'transitioned_to_real (boolean)',
      ],
      data_requirements: [
        'content.tips[4] (playful pizza catastrophizing example)',
        'content.steps[0].items (4 trap definitions for identification)',
        'content.steps[1].items (3 challenge questions)',
      ],
      inputs: [
        'select trap type for each scenario',
        'type challenge question responses',
        'tap to advance to next scenario or real worksheet',
      ],
      outputs: [
        'playful practice completion',
        'navigation to real challenge-question-worksheet',
      ],
    },
  ],
}, null, 2);

const COMPONENT_CONTENT = JSON.stringify({
  meta_id: 'chip-multi-select-tag-group',
  normalized_tag: 'multi-select',
  raw_tags: [
    'multi-select',
    'chip-group',
    'chip-strip',
    'chip-row',
    'chip-picker',
    'chip-input',
    'tag-picker',
    'tag-input',
    'emotion-chip',
    'mood-shortcut',
    'free-tag',
    'sensation-log',
    'vocabulary',
    'presets-plus-custom',
    'free-or-preset',
    'with-guiding-question',
  ],
  cluster_label: 'Chip / tag multi-select group (presets + optional custom entry)',
  description:
    "Horizontally wrapped group of tappable chips / tags that the user toggles on to log multiple concurrent items (feelings, sensations, values, demands, qualities, resources, roadblocks, difficulties). Each chip is an individually-selectable pill; tapping toggles the on/off state and appends or removes the underlying tag from a list-typed field. Most instances ship a preset vocabulary (e.g., common feelings, supportive qualities, exercise options) and many also allow free-text / custom chip creation. Often preceded by a guiding question ('What feelings come up?', 'What values are at stake?') or scoped to a region (body part, life area, step in a wizard). Different from the single-value option-select-dropdown meta in that this surface keeps every chip visible at once and accumulates a multi-element value rather than picking one.",
  canonical_inputs: [
    'preset_chips[] (label, optional icon/color)',
    'current_selection[] (array of selected chip ids / free-tag strings)',
    "allow_custom_entry (bool — 'Add your own' chip or free-text append)",
    'guiding_question_text (optional)',
    'scope_key (optional — e.g., active body region, active step, active node)',
    'min_selection / max_selection (optional)',
  ],
  canonical_outputs: [
    'selection_changed -> new_selection[]',
    'chip_added -> new_chip_value (when allow_custom_entry)',
    'chip_removed -> removed_chip_value',
    'feeds downstream store (mood store, hope-chest, crisis-resources, per-entry tag field, compiled plan)',
  ],
  variant_axes: [
    {
      name: 'chip_vocabulary_source',
      observed: ['preset-only', 'preset-plus-custom', 'free-tag-with-suggestions'],
      description:
        'Whether the user is constrained to the preset vocabulary, can add their own, or is primarily typing free tags with preset suggestions.',
    },
    {
      name: 'framing_prompt',
      observed: ['none', 'guiding-question-above', 'scoped-to-region', 'scoped-to-step'],
      description:
        'How the chip group is introduced. Some chips sit bare in a form step; others follow a guiding question or are scoped per body region / wizard step.',
    },
    {
      name: 'downstream_effect',
      observed: [
        'enriches compiled artifact / plan',
        'feeds shared mood store as tagged context (#8 principle)',
        'hydrates hope-chest / crisis-resources stores',
        'spawns a child card below each selected chip',
        'becomes candidate list for a later picker (e.g., day-of energy picker)',
      ],
      description:
        "Selected chips don't just annotate — they often drive downstream flow (matcher cards, candidate lists, shared stores).",
    },
    {
      name: 'container',
      observed: [
        'form-step-chip-group',
        'inside-mood-modal',
        'inside-detail-card',
        'chip-strip-under-silhouette',
        'chip-row-in-diary-field',
      ],
      description: 'Where the chip group lives.',
    },
  ],
  sub_clusters: [
    {
      sub_id: 'feeling-sensation-vocabulary',
      role: 'Chip group exposing an affective / somatic vocabulary the user can tap to log what they notice. Typically supports free-tag or custom additions. Feeds the shared mood store as tagged context (platform principle #8).',
      members: [
        {
          prototype: 'emotion-override-opposite-action',
          category: 'behavioral',
          component_index: 9,
          component_name: 'chip',
          raw_tags: ['emotion-chip', 'multi-select', 'mood-shortcut', 'inside-mood-modal'],
          description:
            'Optional emotion chip (sad / anxious / angry / hopeless / heavy / withdrawn) the user can tap when editing the Mood node as a shortcut to fill the field.',
        },
        {
          prototype: 'event-based-coping-preparation',
          category: 'behavioral',
          component_index: 8,
          component_name: 'feeling-chip-multiselect',
          raw_tags: ['form', 'chip-group', 'multi-select', 'step-3', 'emotional-dimension'],
          description:
            'Multi-select chip group for specific feelings (sad, anxious, angry, excited, overwhelmed); user can add custom feelings.',
        },
        {
          prototype: 'mindfulness/body-scan',
          category: 'mindfulness',
          component_index: 10,
          component_name: 'sensation-chip-row',
          raw_tags: ['form', 'chip-row', 'multi-select', 'sensation-log', 'vocabulary'],
          description:
            'Multi-select chip row below the silhouette holding the sensation vocabulary (warmth, coolness, pressure, pain, breeze). Selections are scoped per-region.',
        },
        {
          prototype: 'trigger-identification-logging',
          category: 'tracking',
          component_index: 6,
          component_name: 'chip-input',
          raw_tags: ['emotion-field', 'multi-select', 'free-tag', 'mood-store-source'],
          description:
            'Chip/tag input for Emotion where the user can type multiple emotion words; chips feed the shared mood store as tagged context per platform principle #8.',
        },
        {
          prototype: 'sleep-diary',
          category: 'tracking',
          component_index: 23,
          component_name: 'tag-input',
          raw_tags: ['difficulties', 'multi-select', 'free-or-preset', 'per-entry'],
          description:
            "Tag input for 'My sleep was made more difficult by' (e.g., thoughts, noise, temperature, dreams, discomfort, not tired). Supports typed tags and preset suggestions.",
        },
      ],
    },
    {
      sub_id: 'guided-dimension-chips',
      role: 'Chip group paired with a guiding question that asks the user to mark which items from a curated dimension apply to them (values at stake, supportive qualities, cognitive demands, mood-regulation challenges, available resources). Selections enrich a compiled plan / artifact.',
      members: [
        {
          prototype: 'event-based-coping-preparation',
          category: 'behavioral',
          component_index: 9,
          component_name: 'cognitive-demand-chips',
          raw_tags: ['form', 'chip-group', 'multi-select', 'step-4', 'with-guiding-question'],
          description:
            'Chip multi-select for information-processing demands (think quickly, remember lots of info, learn new things) preceded by a guiding question prompt.',
        },
        {
          prototype: 'event-based-coping-preparation',
          category: 'behavioral',
          component_index: 10,
          component_name: 'mood-regulation-chips',
          raw_tags: ['form', 'chip-group', 'multi-select', 'step-5', 'with-guiding-question'],
          description:
            'Chip multi-select for mood-regulation difficulties (conflict, time pressure, financial pressure) preceded by a guiding prompt.',
        },
        {
          prototype: 'event-based-coping-preparation',
          category: 'behavioral',
          component_index: 11,
          component_name: 'values-chip-multiselect',
          raw_tags: ['form', 'chip-group', 'multi-select', 'step-6', 'nine-values'],
          description:
            'Chip multi-select for core values at stake (achievement, caretaking, love, independence, health, community, respect, equality, justice).',
        },
        {
          prototype: 'interpersonal/support-network-mapping',
          category: 'interpersonal',
          component_index: 7,
          component_name: 'supporter-qualities-chips',
          raw_tags: ['form', 'chip-group', 'multi-select', 'inside-detail-card'],
          description:
            'Multi-select chip group inside the supporter-detail-card offering common supportive qualities (good listener, empathetic, non-judgmental, reliable, honest, fun, calming); free-text allowed.',
        },
        {
          prototype: 'cognitive/decatastrophizing',
          category: 'cognitive',
          component_index: 21,
          component_name: 'resource-tag-picker',
          raw_tags: ['form', 'tag-picker', 'multi-select', 'resource'],
          description:
            "Inline picker shown after key beats prompting the user to tag the resources they'd draw on (e.g., 'savings', 'partner', 'therapist', 'sister', 'break room'). Tagged items enrich the compiled role-play plan and hydrate hope-chest / crisis-resources stores.",
        },
      ],
    },
    {
      sub_id: 'option-library-picks',
      role: 'Chip library where the user picks the subset of options they would actually use. The resulting picks become the candidate pool for a later picker or spawn companion cards below. Typically a setup-phase step.',
      members: [
        {
          prototype: 'exercise-engagement-and-planning',
          category: 'lifestyle',
          component_index: 3,
          component_name: 'playful-aerobics-chip-library',
          raw_tags: ['form', 'interactive', 'chip-strip', 'multi-select', 'setup-phase'],
          description:
            'Multi-select chip library of energetic / playful aerobic options (Swim, Hike, Dance, Sports, Walking meeting, Skating, Wash car, ...). Picks become candidates in the day-of energy picker.',
        },
        {
          prototype: 'exercise-engagement-and-planning',
          category: 'lifestyle',
          component_index: 4,
          component_name: 'indoor-motion-chip-library',
          raw_tags: ['form', 'interactive', 'chip-strip', 'multi-select', 'setup-phase'],
          description:
            'Multi-select chip library of indoor / weather-backup options (YMCA, Mall walking, Treadmill, Indoor walking video, Active video game, ...). Picks feed the day-of picker as bad-weather or low-energy alternatives.',
        },
        {
          prototype: 'lifestyle/self-care-action-planning-and-commitment',
          category: 'lifestyle',
          component_index: 4,
          component_name: 'roadblock-chip-picker',
          raw_tags: [
            'form',
            'chip-picker',
            'multi-select',
            'presets-plus-custom',
            'step-2',
            'embedded-matcher',
          ],
          description:
            "Step 2 entry point for the embedded roadblock-solution-matcher. Presets common roadblocks as preset chips with an 'Add your own' chip. Selecting a chip spawns a solution card below.",
        },
      ],
    },
  ],
  member_count: 13,
  related_metas: [
    'option-select-dropdown (single- or multi-select dropdown variant; the category-filter-dropdown member of `multi-select` is absorbed there)',
    'checklist-multi-select (same multi-select semantics rendered as a checkbox list rather than chips)',
  ],
  notes:
    'Thirteen of the sixteen `multi-select` components are this same chip / tag primitive with different preset vocabularies and different downstream effects. A single base component with props for {preset list, allow_custom, guiding_question, scope_key, min/max, downstream writer} would cover every instance. The sub-clusters reflect intent (affect vocabulary vs curated dimension vs option library) rather than widget mechanics. The 14th multi-select member (category-filter-dropdown) is dropdown-shaped and is covered by option-select-dropdown; the remaining 2 (strategy-checklist and apathy-lethargy-toolkit:checklist) are checkbox-shaped and are covered by checklist-multi-select.',
}, null, 2);

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const seed = SEED_BY_KEY[key];
    let row = await DemoText.findOne({ key });
    if (seed && (!row || (row.version || 0) < seed.version)) {
      row = await DemoText.findOneAndUpdate(
        { key },
        { content: seed.build(), version: seed.version, updatedAt: new Date() },
        { new: true, upsert: true }
      );
    }
    if (!row) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, key: row.key, content: row.content });
  } catch (error) {
    console.error('Error fetching demo text:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch demo text' });
  }
});

// Force re-seed from canonical sources (useful after editing intro copy or
// instructions.md). POST so it's not accidentally hit by crawlers.
router.post('/:key/reseed', async (req, res) => {
  try {
    const { key } = req.params;
    const seed = SEED_BY_KEY[key];
    if (!seed) {
      return res.status(404).json({ success: false, error: 'Unknown key' });
    }
    const row = await DemoText.findOneAndUpdate(
      { key },
      { content: seed.build(), version: seed.version, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, key: row.key, content: row.content });
  } catch (error) {
    console.error('Error reseeding demo text:', error);
    res.status(500).json({ success: false, error: 'Failed to reseed demo text' });
  }
});

module.exports = router;
