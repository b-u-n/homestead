---
schema_version: 2
id: pattern/mobx-store
type: pattern
title: MobX Store
status: stable
last_audited: 2026-05-22
tags: [state, mobx]
source_doc:
  - doc/architecture
  - doc/claude
references:
  - spec/architecture-overview
---

## Pattern

A frontend store is a plain class:

```js
import { makeAutoObservable } from 'mobx';

class MyStore {
  data = null;
  constructor() { makeAutoObservable(this); }
  setData(d) { this.data = d; }
}

export default new MyStore();  // singleton
```

Consumed by wrapping the React component in `observer` from `mobx-react-lite`:

```js
import { observer } from 'mobx-react-lite';
import MyStore from '../stores/MyStore';

const MyComponent = observer(() => <Text>{MyStore.data}</Text>);
```

Async loading from server uses `loadFromServer()` convention; this is invoked from `WebSocketService.connect()`'s `on('connect', ...)` handler so stores rehydrate on every reconnection.

## When to use

- Any state shared across more than one component.
- Any state persisted to AsyncStorage or hydrated from the server.
- Any state that must survive unmount (auth, profile, session, inventory, mood, etc.).
- NOT for local UI toggles, transient text inputs, focus state — those stay in `useState`.

## Notes

20+ stores live under `frontend/stores/`. The same shape recurs everywhere: file is `<Name>Store.js`, exports a singleton instance, uses `makeAutoObservable(this)` in the constructor, mutations are plain methods (no actions/reducers). `runInAction` is used only for async-mutation contexts where MobX's auto-action wrapping doesn't apply (e.g. `FontSettingsStore`).

Components in other clusters typically `follows: pattern/mobx-store` from their store node — every store in `frontend/stores/*Store.js` is an instance.
