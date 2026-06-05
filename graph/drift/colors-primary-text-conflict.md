---
schema_version: 2
id: drift/colors-primary-text-conflict
type: drift
title: Primary text color conflict (COLORS.md vs ART_STYLE.md)
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/design-tokens
affects:
  - component/MinkyPanel
  - token/color-primary-text
source_doc:
  - doc/colors
  - doc/art-style
---

## Symptom

Two docs disagree on the primary text color:

- `md/COLORS.md` (line 30): `Primary Text | #403F3E`
- `md/ART_STYLE.md` (line 23): `Primary text: #2D2C2B — never full black`

Both files claim to be authoritative for the design system. The two values are visually close (both very dark warm gray) but not identical — `#2D2C2B` is meaningfully darker. Components rendering text on a `MinkyPanel` are inconsistent in practice; some literal hex strings in the codebase use one, some use the other.

Per `CLAUDE.md` ("Colors → Primary Text: `#403F3E`"), the `COLORS.md` value is what the project conventions in the root claude.md ratified. But `ART_STYLE.md` is the more recently authored doc and reflects an aesthetic intention that the primary text be slightly darker for emboss contrast.

## Resolution

**Decision pending.** Options:

1. Adopt `#403F3E` (matches `CLAUDE.md` and most components). Edit `md/ART_STYLE.md` to align. Low risk, preserves existing render.
2. Adopt `#2D2C2B` (matches `ART_STYLE.md` aesthetic intention). Edit `md/COLORS.md` + `CLAUDE.md` to align. Audit and update all components that hardcode the old value.

Whichever is chosen, the value lives in `token/color-primary-text` going forward and components reference it via that node (per `spec/design-tokens` R1).

If unresolved within `auto_accept_after: 90` days (by 2026-08-20), `status` flips to `accepted` — meaning whichever value is currently in `token/color-primary-text` becomes ratified by inaction, and the conflicting doc is updated to match.

## Audit log

| Date       | Agent          | Note                                                                 |
|------------|----------------|----------------------------------------------------------------------|
| 2026-05-22 | claude (init)  | Drift recorded during graph bootstrap. Both source docs unchanged.   |
