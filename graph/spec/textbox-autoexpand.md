---
schema_version: 2
id: spec/textbox-autoexpand
type: spec
title: Auto-Expanding Textbox
status: stable
last_audited: 2026-05-22
tags: [forms, input]
source_doc:
  - doc/textbox
references:
  - spec/design-tokens
  - spec/modal-pattern
---

## Rules

### R1: Multiline text inputs MUST be platform-split — web uses `<textarea>`, native uses `<TextInput>`

Web: raw HTML `<textarea>` with inline styles and `onInput` resize. Native: React Native `<TextInput multiline />` with StyleSheet styles. Do NOT use `<TextInput>` on web — it has focus issues inside Modal.

**Why:** React Native Web's `<TextInput>` loses focus when its Modal parent mounts; raw HTML `<textarea>` does not. Native has no HTML so it uses `<TextInput>`.
**Evidence:** `md/TEXTBOX.md` "Web Text Inputs" section + "Modal overlay" note.
**Test:** Mount a `<TextInput multiline />` inside a `<Modal>` on web — focus is lost on mount. Replace with `<textarea>` — focus retained.

### R2: Auto-resize fires on both hydration AND user input

Hydration resize (when FormStore loads stored content): `useEffect` on `[content]` calls `requestAnimationFrame` then sets `style.height = 'auto'` then `style.height = scrollHeight + 8 + 'px'`. Input resize (every keystroke): `onInput` handler sets `style.height = 'auto'` then `style.height = scrollHeight + 'px'` (NO `+8`).

**Why:** Hydration needs the `+8` because the saved content's `scrollHeight` reads short before the layout settles. Live input doesn't need it — the height adjusts on each keystroke and `+8` would compound.
**Evidence:** `md/TEXTBOX.md` "Key Points" 1 and 2.
**Test:** Save a long entry, navigate away, come back — confirm the textarea fully shows the content without scrollbars. Type into a fresh textarea — confirm height tracks content with no extra gap.

### R3: Web textarea MUST set `boxSizing: 'border-box'`, `overflow: 'hidden'`, `resize: 'none'`

These three CSS properties together produce the "auto-expand, no manual resize handle, no internal scrollbar" behavior. Omitting `boxSizing` breaks width math (border counts against `width: 100%`). Omitting `overflow: hidden` adds an internal scrollbar that fights the auto-resize. Omitting `resize: none` shows the corner drag handle.

**Why:** All three are needed; the textarea looks wrong if any is missing.
**Evidence:** `md/TEXTBOX.md` "Key Points" 4 and 5, plus the inline style block.
**Test:** Remove any one of the three from a textarea and confirm the visual regression matches the description above.

### R4: FormStore keys MUST match a registered pattern or be dynamic (`response:*`, `*:newPost`)

Static keys are pre-registered with hardcoded defaults (e.g. `bankDrop`, `avatarGeneration`). Dynamic keys must end with `:newPost` or start with `response:`. Keys that match neither pattern make `setField` a no-op — inputs appear frozen with no error.

**Why:** The silent failure mode is the bug pattern: a typo or unmatched key produces a textbox that won't accept input. Documenting the contract prevents 30 minutes of debugging.
**Evidence:** `md/TEXTBOX.md` "FormStore Keys" section.
**Test:** Set a form key to `bazaar:submit` (matches neither pattern) — typing does nothing. Change to `bazaar:newPost` — typing works.

### R5: Character count display uses `{content.length}/<maxLength>` below the textarea

The pattern is consistent: `maxLength={5000}` on the input, `<Text>{content.length}/5000</Text>` styled with `fontSize: 10`, `color: '#5C5A58'`, `textAlign: 'right'`.

**Why:** Users need to see they're approaching the limit, and the limit must be enforced at the input layer (not just on submit).
**Evidence:** `md/TEXTBOX.md` "StyleSheet Styles" — `charCount` style.
**Test:** Type up to 5000 characters — confirm the counter updates and further input is rejected.

## Notes

This spec governs the *pattern* of an auto-expanding textbox, not a single component. The pattern is currently inlined in `CreateWeepingWillowPost.js`, `CreatePost.js`, and `RespondToPost.js`. A future `component/TextBox` could extract it; until then this spec's `governs:` is intentionally empty and the pattern lives in [[pattern/auto-expanding-textarea]].

The web `boxShadow` value (`'0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), ...'`) implements the emboss aesthetic — should be tokenized when `spec/design-tokens` covers shadows.
