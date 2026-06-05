---
schema_version: 2
id: component/AvatarGenerator
type: component
title: AvatarGenerator
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/AvatarGenerator.js
belongs_to:
  - concept/user-customization
source_doc:
  - doc/customization
---

## Purpose

Frontend wrapper for the avatar-generation feature. The user provides semantic inputs (style preference, color choices); the component sends a backend request and receives a finished avatar URL. Per `CLAUDE.md`'s AI-service-abstraction rule, the frontend never sees the underlying AI provider URL — the backend downloads, stores, and serves the avatar from its own path.

## Notes

This component is the cluster's primary AI-abstraction boundary: prompts and provider details live exclusively on the backend, the frontend talks in user-meaningful terms.
