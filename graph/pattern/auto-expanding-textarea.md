---
schema_version: 2
id: pattern/auto-expanding-textarea
type: pattern
title: Auto-Expanding Textarea
status: stable
last_audited: 2026-05-22
references:
  - spec/textbox-autoexpand
---

## Pattern

Platform-split multiline text input that grows to fit content:

**Web:**
- Raw HTML `<textarea>` with inline styles
- `boxSizing: 'border-box'`, `overflow: 'hidden'`, `resize: 'none'`
- `onInput` handler: `e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px';`
- Hydration `useEffect` on content: `requestAnimationFrame` then same resize but with `+8` pixels

**Native:**
- `<TextInput multiline />` with StyleSheet styles
- `textAlignVertical: 'top'`, `minHeight: 120`
- No manual resize needed — RN handles it

Both: `maxLength={5000}` + `<Text>{content.length}/5000</Text>` counter underneath.

## When to use

Long-form text inputs in forms: post body, response text, ask-for-help body, any place where users type more than one sentence. Single-line inputs use `<input>` (web) / `<TextInput />` (native) without the auto-expand.

Currently inlined in `CreateWeepingWillowPost.js`, `CreatePost.js`, `RespondToPost.js`. A future `component/TextBox` could extract this pattern; until then, copy-paste from one of those files.

## Notes

The `+8` pixel offset on hydration is the curious bit — required because the saved content's `scrollHeight` reads short before the next layout pass. Without it, hydrated content shows a hidden last line until the user types. The `+8` is empirical (covers padding + line-height rounding); finer-grained fixes have been attempted and abandoned.

Web cannot use `<TextInput>` inside Modal — focus is lost on mount. See [[spec/textbox-autoexpand]] R1 and [[spec/modal-pattern]] R6.
