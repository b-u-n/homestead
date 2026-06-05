---
schema_version: 2
id: concept/permissions-and-roles
type: concept
title: Permissions and Roles
status: stable
last_audited: 2026-05-22
kind: feature
governs:
  - concept/bazaar
  - concept/wishing-well
  - concept/weeping-willow
  - concept/user-customization
  - concept/activity-system
source_doc:
  - doc/permissions
  - doc/roles
---

## Overview

Permission-based access model where Accounts carry an array of permission strings (`admin`, `developer`, `support`, `moderator`, `creator`). Some permissions imply others (`admin` implies all; `developer` implies `support`; `moderator` implies `creator`). The concept anchors both the role hierarchy and the per-event/per-endpoint access checks that gate admin, moderation, and support flows.

## Notes

The two source docs `md/PERMISSIONS.md` and `md/ROLES.md` describe the same model from two angles (PERMISSIONS by permission level, ROLES by feature access matrix). They are consistent today; if they diverge, open a drift node. Anchors [[spec/permissions-model]] and [[spec/role-system]].
