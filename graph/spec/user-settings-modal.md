---
schema_version: 2
id: spec/user-settings-modal
type: spec
title: User Settings Storage & Sync
status: stable
last_audited: 2026-05-22
tags: [settings, sync]
source_doc:
  - doc/usersettings
governs:
  - component/UserSettingsModal
  - component/SoundSettingsStore
  - component/ThemeStore
---

## Rules

### R1: Settings are read locally first, then synced from the server

On store rehydrate, MobX stores load from `localStorage` / `AsyncStorage` for immediate UI. After the WebSocket session authenticates, `loadFromServer()` fetches the canonical value and merges/overrides. Server values win on conflict.

**Why:** The local cache gives the app a startup feel that does not wait on the network; the server is authoritative for what the user saw on another device. The merge order is the only one that preserves both properties.
**Evidence:** `md/USERSETTINGS.md` Architecture Overview.
**Test:** Edit a setting on Device A; open Device B with stale local cache; after WebSocket auth, the Device A value wins.

### R2: Sound settings are a `Map<soundKey, { volume, enabled }>` on the `Account` model

`Account.soundSettings` is a Mongoose `Map` of sound-key → `{ volume?: Number(0..1), enabled?: Boolean }`. Both fields are optional per entry — a missing field means "use default".

**Why:** Keying by sound name (instead of a fixed object schema) lets the team add new sounds without a schema migration. The optional fields let users disable a sound without setting volume.
**Evidence:** `md/USERSETTINGS.md` Sound Settings schema.
**Test:** Update one key via `soundSettings:update`; the rest of the Map is preserved.

### R3: Theme settings have global + per-flow scopes, with per-flow `enabled` gating overrides

`Account.themeSettings` has `globalSettings` (applied app-wide) and `flowSettings` (a Map keyed by flow name). A flow's overrides only apply if its `enabled: true` flag is set.

**Why:** Users can theme by-flow but expect the global theme to be the default when they haven't opted in per flow. The `enabled` flag is the explicit toggle that disambiguates "I have a flow setting saved but want to use the global" vs "use the flow setting".
**Evidence:** `md/USERSETTINGS.md` Theme Settings schema and Color Resolution Order.
**Test:** Set `flowSettings.weepingWillow.enabled = false`; the global theme renders despite the saved per-flow colors.

### R4: MinkyPanel color resolution follows a fixed 5-step priority chain

`MinkyPanel` resolves its overlay color in this order: (1) explicit `overlayColor` prop, (2) flow-specific override if `enabled`, (3) global override, (4) flow default color, (5) variant default color. First match wins.

**Why:** Encoding the priority once (in `ThemeStore.getMinkyColor`) keeps every panel consistent and lets the explicit prop always win for one-off use cases (debug panels, hardcoded designs).
**Evidence:** `md/USERSETTINGS.md` Color Resolution Order → MinkyPanel.
**Test:** Set global pink + flow-blue + explicit red on one panel; that panel renders red, others render flow-blue, panels outside any flow render pink.

### R5: WoolButton (ButtonBase) color resolution follows a 4-step chain with disabled-state short-circuit

A disabled `ButtonBase` always renders gray (highest priority). Otherwise: flow-specific override → global override → default color for variant+state. The state (`default | selected | hover`) selects which sub-value of the variant entry is read.

**Why:** Disabled is functional, not aesthetic — it should never inherit a theme color that makes it look pressable. The remaining order mirrors R4 but per state.
**Evidence:** `md/USERSETTINGS.md` Color Resolution Order → WoolButton.
**Test:** Apply a green flow override; press a green button (`state: hover`); it renders the override's hover value, not the variant default.

### R6: Theme overrides only apply to NESTED components inside `FlowEngine` via `FlowContext`

`FlowEngine` provides a React context with the current `flowName`. `MinkyPanel` and `ButtonBase` read this context to know which `flowSettings` entry to consult. A component rendered outside any `FlowEngine` sees no flow context and falls through to global → variant defaults.

**Why:** Per-flow theming is a "this flow is the current surface" notion; it would be wrong to apply Weeping Willow blue to a panel in the Bazaar. Context-based propagation is automatic and impossible to forget at the call site.
**Evidence:** `md/USERSETTINGS.md` Component Integration → FlowContext.
**Test:** Render `<MinkyPanel />` outside any flow with a saved flow override; it ignores the override.

## Notes

The mutating event surface is symmetric across sound + theme: `get`, `update`, `reset` (per key/flow) and `resetAll`. Theme adds `resetFlow(flowName)` because the per-flow scope is finer-grained.

This spec does NOT govern the visual layout of `UserSettingsModal` itself — that follows the standard modal pattern (`Modal` component + content drops).
