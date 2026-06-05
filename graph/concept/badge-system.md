---
schema_version: 2
id: concept/badge-system
type: concept
title: Badge System (Overlay Indicators)
status: stable
last_audited: 2026-05-22
kind: feature
source_doc:
  - doc/badges
---

## Overview

Badges are small overlay elements positioned on the corners of cards and components to display counts, status, or special indicators (hearts bounty, first-response, notification count, quantity). All badges share a common styling pattern: a small `MinkyPanel` with reduced `borderRadius` and `padding`, positioned absolutely at the parent's top-right (`top: -8, right: -8`). The parent wrapper carries `overflow: 'visible'` plus matching margins to prevent clipping.

## Notes

Five distinct badge variants are catalogued in `md/BADGES.md`: Hearts, First Response, Bounty, Notification, Quantity. Each is rendered inline by its owning component (not a shared `Badge` component) — the shared element is the styling recipe, captured by `pattern/badge-positioning-overlay`.
