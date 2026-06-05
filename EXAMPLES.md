# EXAMPLES

The "show before you ask" scaffolding — a concrete example baked into the input's **placeholder**.
Companion to [`TONE.md`](./TONE.md) (how the copy sounds); this is where the *example* lives.

When an open input would otherwise be a blank box, give it a `placeholder` that models one real,
everyday answer, prefixed **`e.g. `**. The example sits in the field it's an example for, so the
user sees the shape of a good answer exactly where they'll type it.

## When to add a placeholder example

- The input is open-ended free-text and a blank box would leave a real "what do I even put here?"
- There's no other scaffolding (no carried recap that already shows the shape, no preset chips).

## When NOT to

- Selections, ratings, toggles, or obvious / low-stakes asks ("name one thing that went okay").
- **Validated clinical instruments** (PHQ-9, GAD-7, screeners) — never model answers around items.
- The field already has a concrete placeholder.

## How to build one

1. **Analyze the activity first** — what would a *real* answer look like from someone in a hard week?
2. **One concrete, everyday, relatable example per field**, prefixed `e.g. `. Low-drama, ordinary
   life (the 2am ceiling, the dreaded inbox, the room full of strangers). Vary them across sibling
   fields; show range, don't hand over the "right answer."
3. **Paired or structured inputs** (barrier → response, situation → line, the four corners) — each
   box gets its *own* example, so the pairing reads across the row.
4. The prompt is the question; the placeholder is the example.

## Hard rules

- **Middle steps only.** Never touch the intro, `save`/`saved`, `pre_mood`/`post_mood`/`journal`,
  `stepId`s, `bind`s, `carryFrom`, layouts, or tags.
- Edit only the `placeholder`.
- **Stay valid JSON**, and re-validate after each edit.
