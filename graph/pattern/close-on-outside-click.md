---
schema_version: 2
id: pattern/close-on-outside-click
type: pattern
title: Close on Outside Click
status: stable
last_audited: 2026-05-22
references:
  - spec/modal-pattern
---

## Pattern

Anchored dropdown / popover that dismisses when the user clicks outside its bounds. Implementation is platform-split:

**Web — global document listener:**
```js
useEffect(() => {
  if (!isOpen || Platform.OS !== 'web') return;
  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };
  const timeoutId = setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 0);  // delay so the opening click doesn't re-close
  return () => {
    clearTimeout(timeoutId);
    document.removeEventListener('click', handleClickOutside);
  };
}, [isOpen]);
```

**Native — backdrop Pressable:**
```jsx
{Platform.OS !== 'web' && (
  <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
)}
```

## When to use

Dropdown menus (`HamburgerMenu`, `NotificationHeart`, `EmoteMenu`), tooltips with explicit dismiss, any anchored UI that should disappear when the user signals "I'm done with this" by clicking elsewhere.

Do NOT use for full-screen modals — they use a backdrop click handler routed through `component/Modal` (different pattern, different platform contract — see [[pattern/modal-overlay-with-sound]]).

## Notes

The web `setTimeout(_, 0)` delay is mandatory: without it, the very click that opened the menu bubbles up and immediately closes it. On native, the equivalent issue is avoided by `<Pressable>`'s touch-not-click event model.

Fixed-position backdrops don't capture clicks reliably on web due to canvas stacking contexts — that's why the web path uses a global document listener instead of a backdrop view. See `md/MENUS.md` line 99.
