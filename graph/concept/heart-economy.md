---
schema_version: 2
id: concept/heart-economy
type: concept
title: Heart Economy (In-App Currency)
status: drifting
last_audited: 2026-05-22
kind: feature
source_doc:
  - doc/hearts
---

## Overview

Hearts are the in-app currency used for posting bounties and earning rewards on social features like Weeping Willow / Help Wanted. Users hold up to 9 **Active Hearts** for spending and unlimited overflow in the **Heart Bank**. Hearts are spent on creating posts (selectable bounty) and awarded to first-responders.

## Notes

`status: drifting` reflects open bugs documented in `md/HEARTS.md`: backend handlers do not return updated heart counts after transactions, and frontend drops do not refresh `ProfileStore`. See `drift/hearts-transaction-response-incomplete` and `drift/hearts-success-check-pattern-mismatch`.

Anchor for `component/HeartPaymentModal`, `component/Heart`, `component/NotificationHeart`, `spec/heart-balance-and-spending`.
