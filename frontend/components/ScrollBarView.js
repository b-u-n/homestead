import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import Scrollbar from './Scrollbar';

/**
 * ScrollBarView - A ScrollView wrapper that provides a MinkyPanel-styled scrollbar
 *
 * Behaves identically to ScrollView but renders a Scrollbar on the right side.
 * All ScrollView props are passed through.
 */
const ScrollBarView = forwardRef(({
  children,
  style,
  contentContainerStyle,
  overlayColor = 'rgba(112, 68, 199, 0.25)',
  thumbOverlayColor = 'rgba(135, 180, 210, 0.5)',
  scrollbarWidth = 12,
  scrollbarStyle,
  alwaysShowScrollbar = false,
  onScroll,
  onScrollbarDrag,
  ...scrollViewProps
}, ref) => {
  const [scrollMetrics, setScrollMetrics] = useState({
    offset: 0,
    visible: 0,
    content: 0,
  });
  const scrollRef = useRef(null);
  const scrollbarDragRef = useRef(onScrollbarDrag);
  scrollbarDragRef.current = onScrollbarDrag;

  // Expose ScrollView methods via ref
  useImperativeHandle(ref, () => ({
    scrollTo: (...args) => scrollRef.current?.scrollTo(...args),
    scrollToEnd: (...args) => scrollRef.current?.scrollToEnd(...args),
    getScrollResponder: () => scrollRef.current?.getScrollResponder(),
    getInnerViewNode: () => scrollRef.current?.getInnerViewNode(),
  }));

  const handleScroll = useCallback((e) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setScrollMetrics({
      offset: contentOffset.y,
      visible: layoutMeasurement.height,
      content: contentSize.height,
    });
    onScroll?.(e);
  }, [onScroll]);

  const handleLayout = useCallback((e) => {
    const { height } = e.nativeEvent.layout;
    setScrollMetrics(prev => ({
      ...prev,
      visible: height,
    }));
    scrollViewProps.onLayout?.(e);
  }, [scrollViewProps.onLayout]);

  const handleContentSizeChange = useCallback((w, h) => {
    setScrollMetrics(prev => ({
      ...prev,
      content: h,
    }));
    scrollViewProps.onContentSizeChange?.(w, h);
  }, [scrollViewProps.onContentSizeChange]);

  const handleScrollbarScroll = useCallback((offset) => {
    scrollRef.current?.scrollTo({ y: offset, animated: false });
    scrollbarDragRef.current?.(offset);
  }, []);

  // Determine if scrollbar should be visible
  const canScroll = scrollMetrics.content > scrollMetrics.visible && scrollMetrics.visible > 0;
  const showScrollbar = alwaysShowScrollbar || canScroll;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollRef}
        style={showScrollbar ? styles.scrollViewWithBar : styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
      {showScrollbar && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 2,
            bottom: 8,
            width: 30,
            display: 'flex',
            flexDirection: 'row',
          }}
          onWheel={(e) => {
            e.preventDefault();
            const maxScroll = scrollMetrics.content - scrollMetrics.visible;
            if (maxScroll <= 0) return;
            const newOffset = scrollMetrics.offset + e.deltaY;
            handleScrollbarScroll(Math.max(0, Math.min(newOffset, maxScroll)));
          }}
        >
          {/* Invisible padding area that captures wheel events */}
          <div style={{ width: 6 }} />
          <Scrollbar
            contentHeight={scrollMetrics.content}
            visibleHeight={scrollMetrics.visible}
            scrollOffset={scrollMetrics.offset}
            onScroll={handleScrollbarScroll}
            overlayColor={overlayColor}
            thumbOverlayColor={thumbOverlayColor}
            width={scrollbarWidth}
            style={scrollbarStyle}
            alwaysShow={alwaysShowScrollbar}
          />
        </div>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewWithBar: {
    flex: 1,
    paddingRight: 30, // Make room for scrollbar (12 * 2 + padding)
  },
});

export default ScrollBarView;
