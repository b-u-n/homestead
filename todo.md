# TODO

## Account System

- [ ] Implement account merging when OAuth login happens - merge anonymous Account data (posts, hearts, responses) into the OAuth Account so users don't lose their history

## Status Effects

- [ ] Implement status effects system - replaceable coffee status effect by buying coffee, maybe a list of four status effects you can have up at any given time and when you buy one it pushes the next off the list or something, or we can have single replaceable and temporary and static "permanent" like there are a million things we can do with this but start with the coffee and make it expandable in the other directions

## Workbook Activities

- [ ] Extend `resolveCarryLabels` in `frontend/components/workbook/ComponentStep.js` to optionally return `{id, label}` pairs (under a flag) so future carry-over surfaces can badge the ID alongside the human-readable label. Currently returns label strings only, which is sufficient for the bulleted-list render but limits programmatic styling.
