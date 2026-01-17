# Scrollbar

A MinkyPanel-styled scrollbar component that pairs with ScrollView.

## ScrollBarView (Recommended)

Use `ScrollBarView` for a drop-in replacement for ScrollView that includes a MinkyPanel-styled scrollbar:

```jsx
import ScrollBarView from '../components/ScrollBarView';

const MyComponent = () => {
  return (
    <ScrollBarView
      overlayColor="rgba(112, 68, 199, 0.2)"
      thumbOverlayColor="rgba(112, 68, 199, 0.4)"
      alwaysShowScrollbar={true}
    >
      {/* Your content */}
    </ScrollBarView>
  );
};
```

ScrollBarView accepts all ScrollView props plus:
- `overlayColor` - MinkyPanel overlay color for track (default: `rgba(112, 68, 199, 0.2)`)
- `thumbOverlayColor` - MinkyPanel overlay color for thumb (default: `rgba(112, 68, 199, 0.4)`)
- `scrollbarWidth` - Width of scrollbar (default: 12)
- `scrollbarStyle` - Additional styles for the scrollbar
- `alwaysShowScrollbar` - Show scrollbar even when content fits (default: false)

---

## Manual Usage (Scrollbar component)

```jsx
import { useState, useRef } from 'react';
import { View, ScrollView } from 'react-native';
import Scrollbar from '../components/Scrollbar';

const MyComponent = () => {
  const scrollRef = useRef(null);
  const [scrollMetrics, setScrollMetrics] = useState({
    offset: 0,
    visible: 0,
    content: 0,
  });

  return (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        onScroll={(e) => setScrollMetrics({
          offset: e.nativeEvent.contentOffset.y,
          visible: e.nativeEvent.layoutMeasurement.height,
          content: e.nativeEvent.contentSize.height,
        })}
        onLayout={(e) => setScrollMetrics(prev => ({
          ...prev,
          visible: e.nativeEvent.layout.height,
        }))}
        onContentSizeChange={(w, h) => setScrollMetrics(prev => ({
          ...prev,
          content: h,
        }))}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Your content */}
      </ScrollView>
      <Scrollbar
        contentHeight={scrollMetrics.content}
        visibleHeight={scrollMetrics.visible}
        scrollOffset={scrollMetrics.offset}
        onScroll={(offset) => scrollRef.current?.scrollTo({ y: offset, animated: false })}
      />
    </View>
  );
};
```

**Important**: Always include `onLayout` and `onContentSizeChange` handlers to get initial dimensions. Without these, the scrollbar won't show until the user scrolls for the first time.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| contentHeight | number | 0 | Total height of scrollable content |
| visibleHeight | number | 0 | Height of visible viewport |
| scrollOffset | number | 0 | Current scroll position |
| onScroll | function | - | Callback when clicking track to scroll |
| trackColor | string | `rgba(0, 0, 0, 0.1)` | Background track color |
| thumbColor | string | `rgba(120, 100, 140, 0.5)` | Scrollbar thumb color |
| width | number | 8 | Width of scrollbar |
| style | object | - | Additional styles for track |

## Behavior

- Automatically hides when content fits in viewport
- Thumb size is inversely proportional to content length
- Click track to jump to position (web only)
- Minimum thumb height of 10% for usability

## Styling Examples

```jsx
// Purple theme
<Scrollbar
  thumbColor="rgba(112, 68, 199, 0.6)"
  trackColor="rgba(112, 68, 199, 0.15)"
  width={6}
/>

// Wider scrollbar
<Scrollbar width={12} />

// Custom positioned
<Scrollbar style={{ marginLeft: 4 }} />
```
