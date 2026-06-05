# ACTIVITIES-TO-BUILD

Deferred activity designs that aren't yet implemented. Each entry has enough psychological + structural detail that a future agent (or the user) can pick it up and ship it without re-doing the research.

When picking one up, follow `CREATE-NEW-WORKBOOK.md` end-to-end.

---

## 1. assertive-communication-skills-v2 — situational scoring + interpretation paragraphs

### Why this is here

The current `assertive-communication-skills.json` is a low-friction spectrum self-rating with three example boxes. It's fine as a quick-pattern-noticing activity, but it leaves a lot of psychological depth on the floor:

- The user rates themselves directly. People with low assertive confidence often *systematically misreport* — over-rating passivity (because shame), or under-rating aggression (because defensiveness).
- A direct self-rating doesn't surface *which contexts* the user is passive/assertive/aggressive in. The pattern is rarely uniform.
- There's no scaffolding for the user to compare their pattern to a normative interpretation paragraph the way PHQ-9/GAD-7 do.

A v2 should be a **scored situational assessment** modeled on the PHQ-9/GAD-7 format: the user responds to realistic scenarios, each response is weighted across multiple sub-dimensions, and at the end the user gets a multi-axis profile with interpretation paragraphs that explain what each dimension means and what shifts that dimension toward the middle.

### Design at a glance

- **N situational items** (target ~10-15) covering the contexts where assertiveness commonly fails or succeeds: saying no, asking for what you need, receiving criticism, giving feedback, repairing after a conflict, navigating power imbalances, etc.
- For each item, the user picks one of 4 multiple-choice responses representing different styles of handling that situation.
- Each response carries weighted scores across **multiple sub-dimensions** (not just a single "assertiveness" score). E.g.:
  - **Voice** — willingness to say the thing at all.
  - **Clarity** — how directly the thing is said.
  - **Warmth** — preserving connection while being direct.
  - **Containment** — modulating force/intensity (not over-firing).
  - **Repair-readiness** — willingness to acknowledge impact and adjust.
- Items can score asymmetrically. E.g. one item might be `+0.5 voice, -1.0 containment` (the response shows willingness to speak but uses too much force).
- Scores are normalized at the end to a 1-5 (or 0-10) range per dimension.
- The user then sees their multi-dimensional profile plus an interpretation paragraph per dimension explaining what high/middle/low means *for that dimension*, not globally.

### Why multi-dimensional matters

A single "assertiveness score" hides the actual psychological structure. A person who scores low on *voice* but high on *clarity* (when they do speak) needs different support than someone who scores high on *voice* but low on *containment*. The first person needs permission and small-step practice; the second needs work on the underlying anger/fear that's leaking. Lumping them into one score erases the difference.

### Source-mining notes

Already scoped (see `WHOLE-ASS-PARAGRAPH.md` §2: do not copy verbatim from any of these):

- `extractions/3e048-41f-...-values-workbook.json` — has an assertiveness section.
- `extractions/anti-depression-skills-at-work-self-care-guide.json` — assertive communication at work.
- `extractions/behavioral-activation-for-depression.json` — touches on interpersonal effectiveness.
- `extractions/big-list-of-coping-skills.json` — assertion as a coping skill.
- `extractions/cbt-patient-workbook-2016-rct.json` — CBT-style scaling of communication patterns.
- `extractions/complete-caregiver-support-guide.json` — assertion in caregiving contexts (which has unique pressures).
- `extractions/complete-worksheets-2014.json` — has multiple worksheets touching this.
- `extractions/coping-with-depression-basic-depression-overview.json` — assertion in low-energy states.
- `extractions/depression-online-program-web.json` — online module structure.
- `extractions/depression-workbook-new.json` — modern packaging.

Read 4-6 of these for the *psychological vector* of assertiveness across contexts, then close them and design fresh items. The hard rule from `WHOLE-ASS-PARAGRAPH.md` §2 applies: do not lift example dialogs, scenarios, or wording.

Also worth reading:
- `prototypes/interpersonal/assertive-communication-skills.json` (if it exists) and adjacent prototypes.
- `combined-activities/*.json` for any aggregated assertiveness canonical.

### Interpretation-paragraph design

Model after PHQ-9 (`phq9-assessment.json`) for shape — not for content. Each dimension gets ~3 buckets (low / middle / high) with a paragraph each. The paragraph should:
- Validate where the user is now (no shame for low or high).
- Name the likely cost of being at that pole.
- Name one specific tiny shift that moves toward the middle.
- Not promise improvement.

The user sees their score and the relevant paragraph for each dimension at the end. The paragraphs are not generic — they're written specifically for assertiveness sub-dimensions.

### Structural plan (rough)

| Step | Purpose |
|---|---|
| `intro` | Framing + `pre_mood`. Per `WHOLE-ASS-PARAGRAPH.md` §7. |
| `item-1` … `item-N` | One step per situational item. User picks 1 of 4 responses. Bind keyed `item_1_response` … `item_N_response`. |
| `score-computed` | Display the multi-dimensional profile (5 numeric sliders or a small radar). Bind: `assertion_profile` (object of dimension scores). |
| `interpretation` | Per-dimension paragraph block (`StaticTextContentBlock` with conditional content from the score). |
| `your-takeaway` | Short reflection prompt about what surprised you in the profile. |
| `save` | R5 cumulative carry of everything + `post_mood` + `ReflectionFraming` + `JournalStep`. |
| `saved` | Terminal `SummaryOutputCard`. |

Open questions for the implementer:
- Are conditional `StaticTextContentBlock` paragraphs already supported? If not, this needs a `__primitivesNeeded: ["ConditionalPsychoedParagraph"]` annotation and a fallback that shows all three buckets with a "yours is …" marker.
- The radar chart for the multi-dimensional profile would benefit from a `RadarChart` primitive (already in `__primitivesNeeded` corpus-wide). Fallback: stack of read-only `NumericRatingSlider`s, one per dimension.

### Estimated effort

- Item design + sub-dimension scoring sheet: ~3-4 hours of careful authorship after source mining.
- Interpretation paragraphs (5 dimensions × 3 buckets = 15 paragraphs): ~2 hours.
- JSON authoring + R-rule pass: ~2 hours.
- Audit + voice pass: ~1 hour.

Total: ~1 day of focused work.

---

## 2. Future entries

Future deferred designs go here. Format:

### template

**Why this is here:** one paragraph on the gap this fills.

**Design at a glance:** bullets.

**Source-mining notes:** which extractions to read.

**Structural plan:** step table.

**Estimated effort:** rough hours.

---

(No further entries yet.)
