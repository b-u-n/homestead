# Architecture Guidelines

## User Object Pattern

When storing or returning data that references a user, always use a consistent `user` object structure:

```js
user: {
  id: ObjectId,      // Account._id
  name: String,      // username
  avatar: String,    // avatar URL
  color: String      // hex color from avatarData.color
}
```

### Posts

A post contains content created by a user:

```js
{
  _id: ObjectId,
  content: String,
  user: { id, name, avatar, color },  // the author
  // ... other post-specific fields (hearts, createdAt, etc.)
  responses: [Response]
}
```

### Responses

A response is nested within a post. It includes the responder as `user` and the parent post's author as `parent.user`:

```js
{
  _id: ObjectId,
  content: String,
  user: { id, name, avatar, color },  // the responder
  parent: {
    user: { id, name, avatar, color }  // the post author
  },
  // ... other response-specific fields (createdAt, etc.)
}
```

This makes responses self-contained - you can display a response with full context without needing to look up the parent post.

### Helper Function

Use this helper to build the user object from an Account document:

```js
function buildUserObject(account) {
  return {
    id: account._id,
    name: account.userData?.username || 'Anonymous',
    avatar: account.userData?.avatar || null,
    color: account.userData?.avatarData?.variables?.color || null
  };
}
```

### Why This Pattern?

1. **Consistency** - Same structure everywhere makes frontend code predictable
2. **Self-contained** - Responses include parent context, no extra lookups needed
3. **Complete** - All user display fields (name, avatar, color) in one place
4. **Extensible** - Easy to add new user fields in one place

### Frontend Usage

```jsx
// Post author
<AvatarStamp
  avatarUrl={post.user.avatar}
  avatarColor={post.user.color}
/>
<Text>{post.user.name}</Text>

// Response
<AvatarStamp
  avatarUrl={response.user.avatar}
  avatarColor={response.user.color}
/>
<Text>{response.user.name}</Text>

// MinkyPanel with user's color
<MinkyPanel
  overlayColor={hexToRgba(post.user.color, 0.2)}
  borderColor={hexToRgba(post.user.color, 0.5)}
>
```

---

## Activity renderer data flow

Activities run inside `frontend/components/drops/WorkbookActivity.js`, which delegates per-step rendering to `frontend/components/workbook/ComponentStep.js`. The renderer is the central orchestrator — primitives stay simple consumers of resolved props. There are three input paths into a primitive and two output paths back out.

### Input paths

**1. Author-set props** (from activity JSON)

```json
{ "ref": "FreeTextMultilineArea", "bind": "belief",
  "props": { "promptText": "What's been making things harder?", "placeholder": "..." } }
```

The renderer hands these to the primitive verbatim.

**2. Carry-over** (`carryFrom`, R5)

```json
{ "interactable": false, "carryFrom": { "stepId": "name-belief", "bind": "belief" } }
```

The renderer reads the named step's saved value and renders it as text (or, if a `ref` is provided, hydrates the primitive with that value). `carryFrom.bind` accepts dot-notation (`"sorted.control"`) and an optional `filterByValue` to filter object-map shapes. Details: `activities/v2/_SCHEMA.md`.

**3. Renderer-injected props** (resolved by `ComponentStep` from directives)

Many primitives need access to a *prior step's* saved state, an activity-level library, or a multi-bind assembly. Rather than threading the entire data graph through every primitive, `ComponentStep` runs ~12 resolvers in `renderOne()` and injects the resolved values as named props:

| Directive | Injected as | Used by |
|---|---|---|
| `sourceStepId` + `sourceBind` | `sourceValue`, `selectedChipIds` | PerChipPromptList, ChipSortToGroups, CardDeckWalker, BodySilhouetteWithZones (paint mode) |
| `placeholderByBind` / `placeholdersByDomain` | `placeholder` (overridden) | dynamic prompt-per-context inputs |
| `randomFromLibrary` | `text` (overridden on StaticTextContentBlock) | today's affirmation |
| `_receiptContent` | `resolvedReceipt` | ButtonExportShareAction |
| `_nodeFillFromBinds` (step-level) | `filledNodeIds` | DiagramCanvasWithNodesAndEdges |
| `persons` | `resolvedPersons` | PerPersonShareReceiptButtons |
| `durationFromBind` | `durationSeconds` (overridden) | TimerCountdownOrSession |
| `phaseDurationFromBind` | `phaseDurationsSeconds` (overridden) | BreathPacerAnimation |

Full directive reference: `activities/v2/_SCHEMA.md` § "Renderer directives".

### Output paths

**1. `onValueChanged` / `onValueCommitted` (standard)**

Primitives emit their bound value via these callbacks. `ComponentStep` writes the result into the step's accumulated state under the entry's `bind` key. The step's aggregate value flows up to `WorkbookActivity`, which persists it via the v2 auto-save pathway (R4).

**2. Sibling-aware callbacks (rare, used sparingly)**

A small number of primitives expose lifecycle callbacks that sibling primitives consume — e.g. `FreeTextShortInput` exposes an `onBlur(text)` prop that `ChipMultiSelectTagGroup` wires to its `addCustom` so unsubmitted draft text auto-converts to a chip on focus loss. This is a documented exception to the "primitives don't talk to siblings" rule; new uses should be added with a header comment naming the consumer.

### Primitive prop conventions (canonical for new primitives)

Existing primitives diverge (`value` vs `currentValue`, `onChange` vs `onValueChanged`). `ComponentStep` injects all aliases, so existing code keeps working. For **new** primitives:

- Read the bound value from **`currentValue`**.
- Emit changes via **`onValueChanged(next)`** and **`onValueCommitted(next)`** (call both with the same value if there's no commit/draft distinction).
- Accept renderer-injected props by their documented names: `sourceValue`, `selectedChipIds`, `placeholder`, `resolvedReceipt`, `filledNodeIds`, `resolvedPersons`, etc.

### Where to put new resolvers

A new directive lands in `ComponentStep.renderOne()` as either (a) a conditional gate at the top (`showIfSelected`-style — return null) or (b) a prop-patching block that mutates `mergedProps` before the primitive renders. Document the new directive in `activities/v2/_SCHEMA.md` § "Renderer directives" at the same time — the schema doc and the renderer must stay in sync.
