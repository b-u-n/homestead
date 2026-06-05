---
schema_version: 2
id: drift/activities-md-primary-text-mismatch
type: drift
title: ACTIVITIES.md primary text color contradicts CLAUDE.md
status: open
last_audited: 2026-05-22
cause: parallel_authoring
auto_accept_after: 90
drifts_from:
  - spec/design-tokens
affects:
  - component/WorkbookActivity
child_of:
  - drift/colors-primary-text-conflict
source_doc:
  - doc/activities
  - doc/colors
---

## Symptom

`md/ACTIVITIES.md` "Consistency Notes" table (line 462) gives `Primary text color | #2D2C2B`. This matches `md/ART_STYLE.md` but contradicts `md/COLORS.md` (`#403F3E`) and the top-level `CLAUDE.md` ("Colors → Primary Text: `#403F3E`").

Activity step content rendered inside `MinkyPanel` uses the inline hex `#2D2C2B` per the example in `md/ACTIVITIES.md` line 506:

```javascript
<Text style={{
  fontFamily: 'Comfortaa',
  color: '#2D2C2B',
  // ...
}}>
```

Meaning the workbook activity surface specifically renders text at the darker `ART_STYLE.md` value while the rest of the app (per `CLAUDE.md`) is at `#403F3E`. This is the surface where the existing [[drift/colors-primary-text-conflict]] manifests in code.

## Resolution

Tied to [[drift/colors-primary-text-conflict]]. Whichever value the design-tokens cluster ratifies becomes the single source in [[token/color-primary-text]]; `md/ACTIVITIES.md` and any inline hex in `frontend/components/drops/WorkbookActivity.js` then reference the token.

Until the parent drift resolves, the activities surface remains visibly darker than the rest of the app. Low priority; visually subtle.

## Audit log

| Date       | Agent                | Note                                                                                            |
|------------|----------------------|-------------------------------------------------------------------------------------------------|
| 2026-05-22 | claude (cluster init)| Spotted while reading ACTIVITIES.md for the activities-system cluster. Propagates to existing color drift. |
