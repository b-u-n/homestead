// Module-level scroll lock — not React context (needs to work above the consumer)
let _scrollEnabled = true;
const _listeners = new Set();

export function setScrollEnabled(enabled) {
  _scrollEnabled = enabled;
  _listeners.forEach(fn => fn(enabled));
}

export function getScrollEnabled() {
  return _scrollEnabled;
}

export function onScrollEnabledChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
