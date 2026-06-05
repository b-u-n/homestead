---
schema_version: 2
id: component/Heart
type: component
title: Heart
status: stable
last_audited: 2026-05-22
surface: frontend
file: /frontend/components/Heart.js
belongs_to:
  - concept/heart-economy
source_doc:
  - doc/hearts
---

## Purpose

The shared heart icon. Renders a heart glyph at a configurable `size` prop. Used wherever heart currency is visualized: `HeartPaymentModal` picker, badge content (Hearts Badge, First Response Badge, Bounty Badge), `NotificationHeart`, and the heart counter in `UserStatus`.

## Notes

Single-responsibility primitive. Consumers control color and state via parent styling (e.g., opacity for available vs unavailable). Used as a structural element inside [[pattern/badge-positioning-overlay]] instances.
