# WHOLE-ASS-PARAGRAPH

How to mine the reference extraction corpus, distill the *psychological intention* of a concept or example, and re-render it in the homestead voice — without ever copying a source's words.

This doc is the canonical "voice + research" companion to:
- `_SCHEMA.md` (structural rules R1–R6)
- `CLAUDE.md` (working-style guardrails)
- `CREATE-NEW-WORKBOOK.md` (how to assemble a whole activity)

Read this before writing or editing copy in any activity.

---

## 1. Why this exists

The 13 canonical reference activities (`relapse-prevention-plan.json`, `thought-record.json`, `gratitude-log.json`, etc.) sound like one specific person — warm, observational, never prescriptive, never promising. A lot of newly authored activities drifted away from that voice: too clinical, too cheerful, too "you'll feel better," too jargon-heavy, too judgmental of the user's current patterns.

This doc is how to pull back.

There is also a huge reference corpus at `../workbooks/depression/treatment-plan/extractions/` (hundreds of JSON files extracted from real therapy workbooks, self-help PDFs, online programs, etc.). It contains *enormous* psychological depth — case studies, example dialogs, exercises, taxonomies, vignettes, scaling rubrics. We want to *use* that depth, but we never want to copy from it directly. Two reasons: (a) the source material is copyrighted; (b) verbatim copy from clinical sources sounds nothing like the homestead voice.

---

## 2. The hard rule

> **NEVER use exact examples, sentences, scenarios, dialog, or wording from any source material.**
>
> Instead: extract the *psychological intention* of the source — what feeling it is trying to validate, what insight it is trying to surface, what shift it is trying to make possible — and craft a fresh, natural example in the homestead voice that lives in the same psychological vector space.

This applies to:
- Vignettes / case studies (rewrite the whole scene with different details, names, contexts).
- Example dialogs (rewrite the lines, keep the dynamic).
- Worksheet prompts (re-author from scratch using the source's intent).
- Taxonomies and lists (verify with two+ sources, then re-list in our voice).
- Quotes attributed to therapists / clients (never use; rewrite as our own prose).

It does NOT apply to:
- Validated instruments (PHQ-9, GAD-7 wording is fixed and must be exact — these are licensed measures with rigid wording).
- Established clinical terminology (cognitive distortion names, ACT term "cognitive defusion," etc.) — use the term, don't copy the definition.
- Public-domain crisis resources (988 number, etc.) — exact wording is required for safety.

---

## 3. The extraction corpus: what's in it, how to search it

Location: `E:/git/workbooks/depression/treatment-plan/extractions/*.json`

Each file is one extracted workbook/PDF/online-program. Files are named after the source. The shape varies, but most include:
- Source metadata (title, publisher, year).
- Sections and sub-sections.
- Activity / worksheet definitions with prompts, fields, instructions.
- Example dialogs, case vignettes, narrative explanations.
- Taxonomies (e.g. "13 cognitive distortions," "5 stages of grief").
- Sometimes scoring rubrics or interpretation paragraphs.

There are also `combined-activities/` (deduplicated canonical prototypes) and `components/` (extracted UI building blocks). The combined files are usually more useful than the raw extractions because they aggregate insight from multiple sources.

### Search patterns

Use `grep`/`Grep` first to find relevance, then `Read` the file ranges you need.

```bash
# Find every file mentioning a concept
grep -lri "assertive" workbooks/depression/treatment-plan/extractions
grep -lri "core belief" workbooks/depression/treatment-plan/extractions

# Find example dialogs (rough proxy: question-mark-heavy prose)
grep -rn "\"" workbooks/depression/treatment-plan/extractions | grep -i "client\|therapist\|patient"

# Find scoring/interpretation paragraphs (PHQ-9-style)
grep -rni "score of\|severity\|interpretation" workbooks/depression/treatment-plan/extractions
```

For richer searches:
```bash
# Multi-line example vignettes (need -U for multiline)
rg -U "Example:.*?\n.*?\n.*?(\n|$)" workbooks/depression/treatment-plan/extractions

# Find taxonomies
rg -B1 "^\s*\"items\":\s*\[" workbooks/depression/treatment-plan/extractions
```

### When you find relevance — the workflow

1. **Read the surrounding context fully.** Don't grep-and-paraphrase from a single line. Open the file, read the section, understand what the source is doing.
2. **Read 2-4 sources on the same concept.** The corpus is wide — most concepts appear in 5+ extractions. Triangulate.
3. **Take an internal note of the *psychological vector*:** What is this trying to validate? What is it trying to make visible? What is the user's likely emotional state before this exercise? After?
4. **Close the source files.** Now write the activity copy *without referring back to them word-by-word*. If you find yourself echoing a source's exact phrasing, stop and rewrite.

---

## 4. Extracting psychological intention (the core skill)

For any source example, ask:

1. **What feeling is this validating?** (Loneliness? Shame? Fear of being too much?)
2. **What insight is it trying to surface?** (That the pattern serves a function? That the cost is high? That a small shift is possible?)
3. **What shift is it trying to make possible?** (Permission to name the feeling? Naming a hidden cost? Trying a tiny new behavior?)
4. **What is the user's likely state going in?** (Defensive? Numb? Hopeful? Exhausted?)
5. **What tone makes the shift land?** (Witness-y? Curious? Matter-of-fact?)

That bundle — feeling + insight + shift + state + tone — is the *psychological vector*. Two completely different surface examples can occupy the same vector. Your job is to craft a surface that lands at the same vector, in our voice.

**Worked example.** Source vignette (paraphrased): "Maria, a 45-year-old accountant, kept saying yes to overtime even though her doctor told her to rest. When her therapist asked why, she said 'I just don't want to be a burden.'" Psychological vector: validates the cost of over-functioning; surfaces "burden" as the hidden belief; shift is permission to refuse without justifying. State: exhausted but defending the pattern.

Rewrite in homestead voice (do not name anyone, do not specify age/job, keep the dynamic): "Maybe last week, someone asked you for something — at work, at home — and you said yes before you'd checked whether you had it in you. If you sat with the 'no' for a second, what showed up underneath? For a lot of us it's some version of *I don't want to be too much.*"

The surface is completely different. The vector is the same. That's the move.

---

## 5. Applying the homestead voice

> **[`TONE.md`](./TONE.md) is the governing tone doc** — it maps the three copy surfaces (intro /
> prompt / closing) to their distinct jobs. This section is the exhaustive voice do/don't list that
> sits underneath all of them.

Reference these for tone:
- `relapse-prevention-plan.json` — most authoritative; multi-step planning with warm reflection scaffolding.
- `thought-record.json` — canonical example of cumulative-carry and intensity carry as a slider read-only.
- `gratitude-log.json` — short, low-key, generous prompts.
- `body-scan.json` — observational, no commands, no "you should."
- `support-network-map.json` — interpersonal scaffolding without prescription.

### Voice rules (do)

- **Warm-supportive.** Talk like a friend who happens to know a lot about feelings, not a clinician with a clipboard. ("Most of us, at some point…")
- **Observational, not prescriptive.** Notice with the user; don't direct them. ("You might notice…" not "You should notice…")
- **Permission-granting.** Give explicit permission to skip, leave blank, not be sure. ("If a zone doesn't apply, just leave it blank.")
- **First-person plural ("we," "us") for normalizing.** ("Most of us drift between these…") Use sparingly — too much is performative.
- **Specific small concrete moments**, not big abstract claims. ("A 10-minute walk, a text to a friend, ten minutes of reading…")
- **Use parentheticals for clarification** rather than re-defining terms. ("…clear and kind (often called assertive)")
- **Always validate before you reframe.** ("That makes sense. And…")
- **Open-ended example requests — see [`OPEN-ENDED-QUESTIONS.md`](./OPEN-ENDED-QUESTIONS.md) for the canonical guidance.** When a prompt invites the user to recall a moment or share an example, write it as an open invitation, not a form-fill. The five rules in that doc (with examples and commentary) supersede any earlier "two-door template" guidance — there is no single template; templates blur questions together. Headline reminders:
  - **Vary the entry point across sibling prompts.** A relationship ("Is there someone you've been…"), a feeling ("Has there been a feeling, lately, of…"), a sensation, a pattern, an image, an observation ("There's usually a moment when…"), or a recall ("Think of a time…"). If three prompts in the same step all open with "Try to think of a recent time," the content blurs no matter how different the zones are.
  - **Let the "I can't remember" alternative live anywhere — or nowhere.** It can be woven into the question itself, implied by open phrasing ("Has there been…" already invites "yes/no/sort of"), reframed so the out is part of the asking, or omitted entirely when the question is permissive enough on its own. It does *not* have to be a second sentence appended to every prompt.
  - **Ask one thing per question. Don't define the emotional territory in advance.** Lists like *"hurt, fear, exhaustion, feeling unheard"* do the reader's work for them and narrow what they can bring. Ask the one thing and let them find their own word for what's underneath.
  - **Match length to weight.** A harder or more exposed question can afford to be shorter — brevity creates space. A gentler question can breathe. When every prompt is the same length, the emotional difference between zones flattens.
  - **Some questions end without a net.** Open phrasing *is* the permission. Trust the reader to know their answer counts.
  - **Never frame the alternative as "skip" or "leave blank."** The user is participating either way — with a recalled example or with their own thoughts on the question. This is not opt-out permission.
  - **Don't reframe the alternative into a clinical move.** Avoid *"what you notice about this pattern in yourself"* / *"how this shows up in your relationship with X"* — those are trait-attribution / self-diagnostic asks the user didn't sign up for.
  - **Don't bolt the permission onto the placeholder too.** Placeholders stay as light hints (or empty) — the work belongs in the promptText.
  - **When promptText carries an open invitation, delete any standalone "small moments count / leave it blank" prose block above the field group** — its job has moved into the prompts.
  - **Read aloud before shipping.** If three sibling prompts have the same cadence, restructure some (fragment, invert, slow down). If you find yourself glossing the question after asking it, the question isn't open enough yet — revise the question instead of adding caveats.

### Voice rules (don't)

- **No "on the spectrum" / "spectrum of"** as a metaphor for a 1-to-10 range. The phrase reads colloquially as a reference to autism (whether or not that was the intent), and even in its older clinical "spectrum disorder" sense it carries baggage. Replace with: *range, scale, dial, ground, landing, the way it sits.* ("Where your communication has been landing" rather than "Where you sit on the spectrum.") The schema's `SpectrumSlider` primitive name is fine internally; the user-facing copy is what needs to avoid it.
- **No promises.** Never "you'll feel better," "this will work," "you'll learn to…" Soften to *might*, *can*, *may*.
- **No clinical jargon outside validated instruments.** No "cognitive restructuring," "behavioral activation deficit," "interpersonal effectiveness module." Use plain words.
- **No commanding verbs as the second word of a sentence.** No "Do this." "Try this." Soften to "If you'd like, try…" / "One option is…"
- **No grading language.** No "the point isn't to grade yourself" *immediately after a 1-10 rating* — it draws attention to the very thing you're disowning. Just don't grade.
- **No judgmental verbs for the user's current pattern.** Avoid: *drift, default to, fall into, slip into, devolve, regress*. Replace with neutral: *land, sit, end up, find yourself, notice you've been*.
- **No "version of you that…"** framing. ("The version of you that defaults somewhere else" reads as judgmental of past behavior.) Replace with: "the part of you that…" or "you on a day when…"
- **No empty self-help reassurance.** No "You've got this." "You're stronger than you think." Replace with concrete validation: "That's a lot to carry. Of course it's hard."
- **No "should" anywhere.** Never. (Quoting a user's internal *should* is fine — *"You feel a should around it?"*)
- **No promises about the future-self.** No "future you will thank present you." Replace with: "If this helps, you'll know. If it doesn't, you'll know that too."
- **No emojis in body copy** unless they're functional (mood anchors, scale anchors). Body prose is plain.
- **No interface nouns in body copy.** Describe the human action, not the UI — "keep track of how many times it slips in," never "tap the counter." Avoid *counter, slider, field, button, screen, widget*.

### Voice rules (structural)

- **Memory-retrieval prompts ALWAYS include an escape hatch.** When a prompt asks the user to recall a specific moment ("a recent time you…", "an example of…"), follow it with a permission line that accepts whatever else surfaces, AND a placeholder that names the same alternative. Pattern:
  - prompt: `"See if a recent time you X comes to mind — [description]. If a specific moment doesn't land, whatever else comes up when you sit with this is welcome too."`
  - placeholder: `"What was the situation? [further question]. Or, if nothing specific surfaces, what do you notice when you think about this pattern in yourself?"`
  
  Why: depression, anxiety, and exhaustion all impair episodic memory recall. A prompt that demands a specific incident shames the user who can't produce one. The escape hatch acknowledges that *not remembering is also data* and keeps the activity going.
- Closing journal prompts ALWAYS follow the **three-soft-question template**: *attention* (what did you notice?) → *meaning* (what does it suggest?) → *forward intention* (what might you try, gently?). Never quiz the user on the content of the activity.
- Landing pages need to include three things: (a) what we're doing here, (b) what kind of experience it will be (timing, vibe, what's expected), (c) explicit permission to be where they are. See section 7 for the expansion template.
- Section dividers are punctuation, not content. Don't add prose between every section divider.
- Carry labels should *humanize the bind key*, not just echo it. Match the source prompt's `promptText` when possible.

---

## 6. The "vector check" — before you ship

For every paragraph you write, ask:

1. Could a clinician have written this? If yes → too clinical, rewrite.
2. Could a self-help book back cover have written this? If yes → too promise-y, rewrite.
3. Is there a hidden command ("Try…," "Do…," "Notice…") in imperative form? Soften.
4. Is there a judgment of the user's current state (drift, default, fall into)? Replace.
5. Does it grant permission to not be perfect at the exercise? If not, add one line that does.
6. Does the closing journal prompt ask the user to *witness themselves* or to *report findings*? It should witness.
7. Is any sentence over 32 words? Break it up — long sentences feel clinical.

---

## 7. The landing-page expansion template

> **Superseded for voice by [`TONE.md`](./TONE.md) → Intros** — its why-first, energetic three-beat
> is the current intro standard. The structural expansion template below still applies.

Most activities' landing (intro) steps were originally written as 1-2 short prose blocks. Many need a fuller framing so the user understands what they're entering. The template:

**Block 1 — What this is (~2-4 sentences).** A warm one-paragraph "we're going to…" that names the concept being explored, normalizes it ("most of us…"), and orients the user to the territory.

**Block 2 — What the experience will be (~2-3 sentences).** A practical "here's how this'll go" — roughly how long, what you'll be asked to do, what kind of writing/thinking/rating. Includes any permission ("skip what doesn't apply").

**Block 3 — `QuickMoodMicroWidget` (pre_mood).** Required by R6. Always last in the intro step.

When expanding an existing landing page, preserve the original first paragraph if it's strong; add a second block above the mood widget to cover what's missing.

---

## 8. Common rewrites (cheat sheet)

| Drift | Rewrite |
|---|---|
| "You'll learn to…" | "You might find…" / "Many people notice…" |
| "Try to notice…" | "If you'd like, notice…" / "See what shows up when you…" |
| "The point isn't to grade yourself." | (Delete; replace the grading-feeling cause instead.) |
| "Where do you usually land?" | "Where has this been sitting lately?" |
| "Where do you sit on the spectrum?" | "Where has this been landing for you?" / "Which of these ranges feels closest?" |
| "[any] spectrum" (user-facing) | "range," "scale," "dial," "ground," "the way it's been landing." |
| "Your most assertive self…" | "A part of you that already knows what you needed to say…" |
| "Try this exercise." | "If you'd like to try this…" |
| "You should…" | (Delete or invert: "It's okay if you don't.") |
| "Don't worry if…" | "It's normal for…" / "Many of us find that…" |
| "This will help you…" | "Some people find this helps with…" |
| "Take a deep breath." | "If breath feels available, take one." |
| "A recent time you [did X]." (bare recall, repeated as a template across siblings) | An open invitation in the homestead voice — see `OPEN-ENDED-QUESTIONS.md`. Vary the entry point across sibling prompts (relationship / feeling / observation / sensation / recall); the "I can't remember" alternative can live anywhere, or be implied by open phrasing, or be omitted; ask one thing (don't list emotional possibilities); match length to weight; some questions need no net. Never frame the alternative as "skip." |

---

## 9. When to spawn an agent vs. write inline

Spawn an agent when:
- Polishing 5+ activities at once.
- The activity is long (8+ steps).
- Multiple sources need to be consulted.

Write inline when:
- The polish is 1-3 paragraphs in one activity.
- The change is one prop or one block.
- You can read the file and the audit in your own context window.

When spawning, the agent prompt should ALWAYS include:
- File path of the activity.
- Reference to this doc (`E:/git/homestead/WHOLE-ASS-PARAGRAPH.md`).
- The hard rule (section 2) restated.
- The voice rules (section 5) summarized.
- Specific tone/landing/expansion asks for this activity.

---

## 10. Self-check before declaring done

- [ ] Read the result aloud (mentally). Does it sound like the canonical refs?
- [ ] Searched for any verbatim phrasing from source material? (None should remain.)
- [ ] Three-question journal prompt in place?
- [ ] Landing page covers concept + experience + permission?
- [ ] No promises, commands, or judgments of the user's current pattern?
- [ ] R5 cumulative-carry intact, R2 terminal pair intact, R6 mood bookend intact?

If any box is unchecked, do another pass. The corpus is meant to sound like one person — be that person.
