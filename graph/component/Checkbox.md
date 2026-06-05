---
schema_version: 2
id: component/Checkbox
type: component
title: Checkbox (primitive)
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/primitives/Checkbox.js
belongs_to:
  - concept/vaporwave-aesthetic
follows:
  - pattern/stitched-checkbox-indicator
  - pattern/emboss-text-shadow
uses:
  - component/MinkyPanel
source_doc:
  - doc/checkboxes
---

## Purpose

The canonical "selectable concept with explanatory voice" primitive used across workbook activities. One row = one concept (a trap, warning sign, value, symptom). Pairs a tappable blue `MinkyPanel` (title + short definition + chevron) with a collapsible voice block (first-person example quotes). Replaces the older `WoolButton + ✓` multi-select pattern for form-control surfaces.

## Notes

Referenced from v2 activity JSON via `{ "ref": "Checkbox" }`. Also rendered indirectly by `ChecklistAssessmentStep` and `ChipMultiSelectTagGroup`'s `checkbox-list-vertical` mode (see `md/CHECKBOXES.md`). Indicator and panel are two independent tap zones — see `spec/checkbox-pattern` R1.
