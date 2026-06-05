---
schema_version: 2
id: component/PostsList
type: component
title: PostsList
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/PostsList.js
belongs_to:
  - concept/weeping-willow
handles:
  - weepingWillow:newPost
  - weepingWillow:postUpdated
source_doc:
  - doc/weeping-willow
---

## Purpose

Filterable / sortable list of Weeping Willow help-wanted posts. Sorts: Unresponded, Most Popular, Most Hearts, Least Hearts, Newest, Oldest. Each row shows author name, avatar, bounty, content, response count; expandable to show all responses; "RESPOND" button routes to the response drop.

## Notes

Layout differs mobile vs desktop. Real-time updates via the broadcast events on `handles`. Cannot respond to your own posts (enforced server-side).
