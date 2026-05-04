# Checkboxes & the selectable-with-examples pattern

The `Checkbox` primitive is the canonical "selectable with explanatory voice"
control across workbook activities. One row = one selectable concept (a trap,
a warning sign, a value, a symptom). The row pairs a **labelled selectable
panel** (title + short definition, tappable to toggle expansion) with a
**collapsible voice block** (concrete first-person examples that show what the
concept sounds like in practice).

It replaces the older "WoolButton with a checkbox glyph inside" pattern,
which read as a tappable button rather than a form control.

## Component

**Yes — `Checkbox` is a primitive.**

`frontend/components/primitives/Checkbox.js`, exported through the primitives
barrel as `Checkbox`. Reference it directly from v2 activity JSON via
`{ "ref": "Checkbox", ... }`, or use it implicitly through one of the
list-rendering surfaces below.

## Visual structure

```
┌─ blue MinkyPanel ─ tap to expand/collapse ──── ▾ ─┐
│  [☐]  Title (Comfortaa 700, primary)              │
│       Short definition — one soft line.           │
└────────────────────────────────────────────────────┘
       (when expanded — purple-bordered indent)
       │ "First concrete example in the user's voice."
       │ "Second example — short, first-person, dark text."
       │ "Third example — three reads best."
```

### Anatomy

| Region | Color / type | Notes |
|--------|--------------|-------|
| Panel (unchecked) | `rgba(100, 130, 195, 0.25)` (muted blue) | The "not selected" state. |
| Panel (checked) | `rgba(135, 180, 210, 0.55)` (scrollbar blue) + stitched border | The "selected" state. |
| Indicator | 22×22 stitched dashed border `rgba(92, 90, 88, 0.55)`, fills with `rgba(255, 255, 255, 0.65)` + `✓` glyph when checked | Sits inside the panel on the left. |
| Title | Comfortaa 700, `#2D2C2B`, content emboss `rgba(255,255,255,0.35)` | The selectable concept's name. |
| Description | Comfortaa 600 (not italic), `#1A1A19` (near-black), lineHeight 18, stronger white emboss `rgba(255,255,255,0.62)` | One definition line under the title. Must read clearly on the muted-blue panel ground — light grays disappear. |
| Chevron | `▾` collapsed / `▴` expanded — Comfortaa 900, 28px scaled, `#2D2C2B` with strong white emboss | Right-aligned inside the panel. Passive icon — not its own press target. |
| Examples block | Indented 14px, 12px paddingLeft, 2px-wide left border `rgba(112, 68, 199, 0.45)` | Distinguishes voice from definition. |
| Example line | Comfortaa 600, `#1A1A19` (near-black), **not** italic, 15px scaled, lineHeight 22 | Curly quotes wrap the text. Larger and darker than the description so it's actually readable on the textured ground. |

### Tap zones (important)

- **Tap the panel body** (anywhere on title / description / chevron area) →
  toggles the **expand/collapse** state. This is the bigger, more
  discoverable affordance — most users want to see examples before deciding,
  not check the box reflexively.
- **Tap the stitched checkbox indicator** on the left → toggles the **check**.
  Its own Pressable with `stopPropagation` so the panel's expand handler
  doesn't also fire.
- The chevron is `pointerEvents="none"` — it just signals state. The whole
  panel's job is to expand.

If a row has no `examples`, the chevron is omitted and the panel becomes
non-pressable (only the indicator toggles the check).

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | boolean | `false` | Whether the box is checked |
| `onToggle` | `(next: boolean) => void` | — | Fired with the next value on indicator press |
| `title` | string | — | Main label (required for visible content) |
| `description` | string | — | Optional one-line definition under the title |
| `examples` | string[] | — | Optional first-person voice lines, revealed when expanded. 3 reads best. |
| `defaultExpanded` | boolean | `false` | Start with examples open |
| `disabled` | boolean | `false` | Locks the indicator (panel still expands) |
| `interactable` | boolean | `true` | `false` renders as a static display row (no toggle) |

Accessibility: indicator gets `accessibilityRole="checkbox"` +
`accessibilityState={{ checked }}`; the panel gets `accessibilityRole="button"`
with label "Show examples" / "Hide examples" when there's content to expand.

## Usage

### Standalone

```jsx
import Checkbox from '../components/primitives/Checkbox';

<Checkbox
  checked={isChecked}
  onToggle={setChecked}
  title="Catastrophizing"
  description="Jumping straight to the worst possible outcome."
  examples={[
    "If I fail this test, my whole future is ruined.",
    "This headache must be something serious.",
    "They didn't text back — something terrible happened.",
  ]}
/>
```

### Inside `checklist-assessment` activity steps

`ChecklistAssessmentStep` renders a `Checkbox` for every item. Each item
supports `title`, `description`, and `examples` directly:

```js
{
  stepId: 'identify',
  type: 'checklist-assessment',
  prompt: 'Which thinking traps do you tend to fall into?',
  items: [
    {
      id: 'catastrophizing',
      title: 'Catastrophizing',
      description: 'Jumping straight to the worst possible outcome.',
      examples: [
        "If I fail this test, my whole future is ruined.",
        "This headache must be something serious.",
        "They didn't text back — something terrible happened."
      ]
    }
    // …
  ],
  scoring: {
    thresholds: [
      { min: 0, max: 2, interpretation: '…' },
      { min: 3, max: 5, interpretation: '…' },
      { min: 6, max: 8, interpretation: '…' }
    ]
  }
}
```

Legacy items may use `text` instead of `title` (kept for backwards compat
with older seed data). New items should use `title`.

### Inside `ChipMultiSelectTagGroup` (v2 — checkbox list with custom entry)

`ChipMultiSelectTagGroup`'s `checkbox-list-vertical` rendering is implemented
on top of the same `Checkbox` primitive, so the look is unified. Add
`allowCustomEntry: true` to give users a "add your own…" input under the
list. Each preset chip can carry rich content via an object form:

```json
{
  "ref": "ChipMultiSelectTagGroup",
  "bind": "traps",
  "props": {
    "rendering": "checkbox-list-vertical",
    "rowFormat": "name-plus-short-description",
    "allowCustomEntry": true,
    "presetChips": [
      {
        "id": "catastrophizing",
        "label": "Catastrophizing",
        "short_description": "Jumping straight to the worst possible outcome.",
        "examples": [
          "If I fail this test, my whole future is ruined.",
          "This headache must be something serious.",
          "They didn't text back — something terrible happened."
        ]
      }
    ]
  }
}
```

`label` becomes the Checkbox `title`; `short_description` becomes
`description` (only rendered when `rowFormat === "name-plus-short-description"`);
`examples` is passed through verbatim.

## When to use a checkbox vs. other controls

| Surface | Use |
|---------|-----|
| Definitive "select all that apply" with explanatory items + scoring | `checklist-assessment` step type (renders Checkboxes) |
| "Select all that apply" with **add-your-own** | `ChipMultiSelectTagGroup` `rendering: "checkbox-list-vertical"` + `allowCustomEntry: true` |
| Quick pill picker, no descriptions, no scoring | `ChipMultiSelectTagGroup` (default chip strip rendering) |
| Single per-item heart/star/done glyph | `BinaryStateToggle` |
| Likert rating scale (Not at all → Nearly every day) | `LikertStep` / `NumericRatingSlider` |
| One-off custom checkbox row | `Checkbox` (this primitive, used directly) |

## Authoring guidelines

### Description (the soft definition under the title)

- One short clause. **Define, don't describe** — "Jumping straight to the
  worst possible outcome." not "This is when you tend to think about bad
  outcomes that might happen in the future."
- Same voice as the rest of activity copy: gentle, present-tense, no clinical
  jargon. See `md/ACTIVITIES.md` likert-reflection writing notes for tone.
- It's the user's quick scan-line — they read it before deciding to expand.

### Examples (the voice block)

- **3 examples is the sweet spot.** Fewer feels thin; more crowds the
  expanded panel.
- **First-person, present-tense quotes** when the concept is a thought
  ("If I fail this test…"). Short scenarios when it isn't ("Pulling away from
  people I care about").
- Keep each line **under ~70 characters** so they wrap cleanly on mobile.
- Examples are **illustrative, not exhaustive.** The user shouldn't feel they
  need to match an example exactly to check the box. Pick three that *sound
  like the concept* — different enough that one of them clicks for most
  users.
- Don't paraphrase the title or description. The voice block is for
  *concrete instances*; the title/description is for the *abstract concept*.
- No extra punctuation around the strings — the renderer wraps each in
  curly quotes for you. `"If I fail…"` and `'If I fail…'` are stripped before
  the curly quotes are applied, so either input form works.

### When to use this pattern

Whenever the user is being asked to identify an instance of a labelled
clinical concept they may not yet recognise in themselves. Cognitive
distortions, attachment styles, warning signs, values, schema patterns,
emotion families, somatic markers — anything where the abstract label is
short ("Catastrophizing") and the felt experience is recognisable but
unworded for most people.

If the user already has a clear vocabulary for the concept (e.g. "Sleep
worse"), examples are unnecessary — omit them and the chevron will
auto-disappear.
