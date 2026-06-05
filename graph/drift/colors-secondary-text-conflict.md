---
schema_version: 2
id: drift/colors-secondary-text-conflict
type: drift
title: Secondary text color conflict (COLORS.md vs ART_STYLE.md)
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/design-tokens
affects:
  - component/MinkyPanel
  - token/color-secondary-text
source_doc:
  - doc/colors
  - doc/art-style
---

## Symptom

Two docs disagree on the secondary / muted text color:

- `md/COLORS.md` line 32: `Muted Text | #5C5A58`
- `md/ART_STYLE.md` line 24: `Secondary text: #454342`

Same parallel-authoring root cause as [[drift/colors-primary-text-conflict]]. The two values are visually similar but not identical; `#454342` is meaningfully darker.

## Resolution

**Decision pending.** Resolving this together with the primary-text conflict is sensible — both decisions should land in the same direction (either both adopt the warm-mid grays from `COLORS.md`, or both adopt the darker values from `ART_STYLE.md`). Then `token/color-secondary-text` updates its value accordingly, and one of the two source docs is edited to align.

## Audit log

| Date       | Agent          | Note                                                                   |
|------------|----------------|------------------------------------------------------------------------|
| 2026-05-22 | claude (init)  | Drift recorded during graph bootstrap. Pair this resolution with primary-text. |
