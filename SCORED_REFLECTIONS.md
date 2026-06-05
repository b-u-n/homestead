# SCORED_REFLECTIONS

The warm, plain-language read-back that lands after **any step the user gave
shape to** — a scored instrument (PHQ-9 / GAD-7), a Likert self-assessment
(the 7 Cs, the wellbeing domains), a values pick, an attachment-style
selection, a small-actions ranking. Wherever the user has *rated, ranked, or
selected* something, the mirror step can take what they gave you and read it
back to them in the homestead voice — without diagnosing, without empty
reassurance, without flattening.

The voice rules are [`TONE.md`](./TONE.md)'s shared voice applied to
*statements* (intros/prompts are different surfaces — this is the mirror).
Where TONE.md says "lead with a vivid why," the mirror leads with a
**vivid named experience** in the same register.

### Scope — beyond instruments

The PHQ-9 / GAD-7 read-backs are the most-developed examples and the
patterns below reverse-engineer them. The same mechanism works anywhere
`ReflectionPanel`'s `sourceStepId` points at — the panel just looks up the
user's value per item and renders the matching variation. That means:

- **Per-domain reflections.** A wellbeing-log step where the user picks one
  domain (sleep, connection, body, meaning…) authors ten variations under
  that one item, keyed by the domain choice instead of by score.
- **Per-chip prompts and placeholders.** A values-to-action activity where
  each selected value gets a tailored prompt the user models their answer
  on — author one variation set per value.
- **Per-pattern presentations.** An attachment-style activity that, after a
  multi-item selection step, presents what they chose back as a warm
  paragraph naming the pattern in their own words — author one variation
  set per pattern.

If the user gave you something to look at, the mirror's job is to look at
it warmly *with* them, not at them.

---

## Mechanism (what you're actually authoring)

`ReflectionPanel` walks the source step's scored items and, for each item whose
score is `> 0`, picks one variation from the entries you authored for *that
item at that score*. The picked variations are joined into one paragraph and
emitted as a bound value (`generated_reflection`) that later steps can carry.

Authoring shape — **nested under the ReflectionPanel's `props`**, not at step
level:

```json
{
  "stepId": "reflection",
  "components": [
    {
      "ref": "ReflectionPanel",
      "props": {
        "sourceStepId": "questionnaire",
        "items": [
          { "id": "gad1", "text": "Feeling nervous, anxious, or on edge" },
          { "id": "gad2", "text": "Not being able to stop or control worrying" }
        ],
        "reflections": {
          "gad1": {
            "1": ["…","…"],
            "2": ["…","…"],
            "3": ["…","…"]
          }
        }
      }
    }
  ]
}
```

- **Each score level holds an array of variations**, randomly picked at render
  so the read-back stays fresh across sessions.
- **Score 0 contributes nothing.** Items the user didn't endorse stay out.
- **Order follows the items array**, so the paragraph reads in the same order
  the questions were asked.

---

## What the gold-standard examples actually do (reverse-engineered)

Reading the live GAD-7 and PHQ-9 entries, the patterns that make them land:

1. **Quantifier woven into prose, never the raw score.** *"a few days lately"*
   for 1, *"more days than not"* / *"most days"* for 2, *"nearly every day"* /
   *"every single day"* / *"day after day"* for 3. The reader feels the
   frequency; they never see a number.
2. **Image > category.** *"Anxiety hums in the background"*, *"the worry has
   colonized your headspace"*, *"your body has been braced for something for
   so long it doesn't know how to stop"*, *"your receiver got muffled."* The
   visceral metaphor lands what a category label can't.
3. **Two-clause shape at higher scores.** Score 1 is often a single sentence
   with a dash (*"That nervous feeling has been showing up for you lately — not
   constantly, but enough that you notice it."*). Scores 2 and 3 lengthen into
   two sentences: **name + quantify**, then a separate **felt-cost / honoring**
   sentence. That second sentence is what makes a high score land honestly
   rather than alarmingly.
4. **Validate before honoring.** A score-3 line names the cost first
   (*"Living with that level of anxiety nearly every day is exhausting."*),
   then honors the persistence (*"The fact that you're still here, still
   trying — that matters."*). Skipping straight to "you've got this" would
   read empty.
5. **Trust the noticing.** *"That noticing is real"*, *"You're not making it
   up"*, *"That awareness is real."* The person rating themselves *did the
   noticing*; affirm that before anything else.
6. **Sensory + somatic over evaluative.** *"Your body's saying something"*,
   *"that's depression in your bones"*, *"a foot that won't stop tapping"*,
   *"waking up underneath something heavy."* Locate the experience in the
   body when you can.
7. **Vary the entry point across variations.** Some variations open with the
   symptom (*"That nervous feeling…"*), some with the felt sense (*"There's
   been a flutter…"*), some with second-person observation (*"You've
   noticed…"*), some with an image (*"anxiety hums in the background"*). Read
   10 variations in a row — none should blur.
8. **Earned validation, never empty.** *"I'm glad you did"* / *"that matters"*
   only after the cost has been named and only at scores that warrant it.
   Never on a low score; never as a default closer.
9. **Universalizing without flattening.** *"Most people can't fully understand
   unless they've felt it."* Locates the loneliness rather than denying it.
10. **No diagnosis. Context is enough.** PHQ-9 reflections can name
    "depression" because the instrument's context already does — *"that's
    depression in your bones"* — but never as a verdict (*"you have…"*). The
    paragraph reflects what the person *just told you*, not a clinical label.

---

## The per-variation template (by score)

```
Score 1 — one sentence
  [Soft-quantified named experience] — [permission / "you notice it" close]
  "That nervous feeling has been showing up for you lately — not constantly,
   but enough that you notice it."

Score 2 — two sentences
  [Stronger quantifier + named experience].
  [The felt cost — what it takes out of you].
  "You've been carrying a lot of that on-edge feeling, more days than not.
   That takes something out of you, even when you push through."

Score 3 — two sentences
  [Near-daily / daily quantifier + named experience, often as a fragment].
  [The cost + an earned honoring of having stayed in motion].
  "Living with that level of anxiety nearly every day is exhausting.
   The fact that you're still here, still trying — that matters."
```

Sentence fragments are allowed and welcome (*"Every single day, that nervous
feeling."*) — they're part of the spoken cadence TONE.md asks for everywhere.

---

## Three live examples to study (real, in production)

### GAD-7, `gad1` — *"Feeling nervous, anxious, or on edge"*

- **1**: *"That nervous feeling has been showing up for you lately — not
  constantly, but enough that you notice it."*
- **2**: *"You've been carrying a lot of that on-edge feeling, more days than
  not. That takes something out of you, even when you push through."*
- **3**: *"Living with that level of anxiety nearly every day is exhausting.
  The fact that you're still here, still trying — that matters."*

### GAD-7, `gad4` — *"Trouble relaxing"*

- **1**: *"Relaxing hasn't come as easily lately. Your body is holding onto
  something, even when you want to let go."*
- **2**: *"When you can't settle down even when you want to, it's your nervous
  system talking. It's not that you're doing it wrong."*
- **3**: *"Not being able to relax, day after day — your body has been stuck
  in go-mode for a while now. That's not sustainable, and it's okay to name
  that."*

### PHQ-9, `phq1` — *"Little interest or pleasure in doing things"*

- **1**: *"You've reached for the things you usually love and they haven't
  quite reached back. That's not laziness — that's something worth noticing."*
- **2**: *"You've been showing up for the things you used to love and they
  aren't showing up back. More days than not. That's a particular kind of
  lonely."*
- **3**: *"Nearly every day, you've been reaching and getting nothing back.
  That's a deep kind of grief — and your body knows it, even when your mind
  tries to keep moving."*

Three things are true across all nine: a felt quantifier (not a number), an
image (*"reaching and getting nothing back"*, *"stuck in go-mode"*,
*"haven't quite reached back"*), and validation that *doesn't promise relief*.

---

## Relationship to TONE.md

Scored reflections are a **statement** surface — distinct from TONE.md's
intro (orient + motivate), prompt (invite self-disclosure), and closing
(witness). The person isn't being asked to do anything in this paragraph;
they're being shown, plainly and gently, what they just said.

The **shared voice** (warm-supportive, vivid + concrete, warm not flat,
spoken cadence, permission-granting, observational not prescriptive) is
[`TONE.md`](./TONE.md)'s — don't restate it; read it there. The TONE.md
don'ts that bite *hardest* on this surface:

- **No diagnosis.** This is the PHQ-9/GAD-7 hot zone — the clinical label
  is right there. Never *"you have…"* / *"this looks like…"*. The paragraph
  reflects what the person just told you, not a verdict.
- **No promises.** Especially at high scores, the urge to soften with
  *"this will pass"* / *"with treatment you'll…"* is strong. Don't.
- **No empty reassurance.** *"You've got this"* is out. *"That matters"* is
  in, but only when it follows a named cost.
- **No "should"**, anywhere. *"You should rest more"* is a command in a
  cardigan.
- **No judgment verbs** (*drift, default, fall into, slip into*). At score 1
  it's easy to slip into *"some days you've drifted into…"* — replace with
  neutral *land, sit, end up, find yourself*.

---

## Hard rules

- **Author under `ReflectionPanel`'s `props.reflections`**, not at step level.
  Items live in `props.items`. (Mistakes here render an empty panel.)
- **Variations are arrays of strings.** `["A","B","C"]` picks one at render;
  never concatenate as `"A B C"`.
- **Score 0 entries don't exist.** Don't author them.
- **One or two sentences per variation** — never three. If a score 3 line
  feels short, sharpen the felt cost; don't pile on.
- **Vary entry points** across the 5–10 variations per score. If three open
  *"The worry…"* in a row, restructure.
- **Validated item wording is verbatim** — only the reflection prose is
  authored copy. Never edit the instrument's question text.
- **PHQ-9 item 9 (self-harm) is its own register.** Slower, gentler,
  hand-offs to the crisis-line surface; it does not blend into the rest of
  the read-back.
- **Read the paragraph aloud, end-to-end, with two or three items at the
  same score.** If sibling lines collide (same opener, same quantifier-word,
  same image), refactor — the gestalt is what the user reads.
