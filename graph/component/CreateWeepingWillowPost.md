---
schema_version: 2
id: component/CreateWeepingWillowPost
type: component
title: CreateWeepingWillowPost
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/drops/CreateWeepingWillowPost.js
belongs_to:
  - concept/weeping-willow
emits:
  - weepingWillow:posts:create
source_doc:
  - doc/weeping-willow
---

## Purpose

Post-creation drop. Heart-bounty selector (1–9 from the user's active balance) and message textarea (max 5000 chars). On submit, hearts are deducted server-side and the post is broadcast to all clients.

## Notes

Cannot stake more hearts than the active balance. Layout adapts mobile vs desktop. Form state persisted via `FormStore`.
