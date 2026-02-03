import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import Scrollbar from './Scrollbar';

/**
 * ScrollBarView - A ScrollView wrapper that provides a MinkyPanel-styled scrollbar
 *
 * Behaves identically to ScrollView but renders a Scrollbar on the right side
 * (or bottom side when horizontal). All ScrollView props are passed through.
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
  horizontal,
  ...scrollViewProps
}, ref) => {
  const [scrollMetrics, setScrollMetrics] = useState({
    offset: 0,
    visible: 0,
    content: 0,
  });
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const scrollbarDragRef = useRef(onScrollbarDrag);
  scrollbarDragRef.current = onScrollbarDrag;
  const metricsRef = useRef(scrollMetrics);
  metricsRef.current = scrollMetrics;
  const touchScrollRef = useRef({ startPos: 0, startOffset: 0, isScrolling: false, active: false });

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
      offset: horizontal ? contentOffset.x : contentOffset.y,
      visible: horizontal ? layoutMeasurement.width : layoutMeasurement.height,
      content: horizontal ? contentSize.width : contentSize.height,
    });
    onScroll?.(e);
  }, [onScroll, horizontal]);

  const handleLayout = useCallback((e) => {
    const { layout } = e.nativeEvent;
    setScrollMetrics(prev => ({
      ...prev,
      visible: horizontal ? layout.width : layout.height,
    }));
    scrollViewProps.onLayout?.(e);
  }, [scrollViewProps.onLayout, horizontal]);

  const handleContentSizeChange = useCallback((w, h) => {
    setScrollMetrics(prev => ({
      ...prev,
      content: horizontal ? w : h,
    }));
    scrollViewProps.onContentSizeChange?.(w, h);
  }, [scrollViewProps.onContentSizeChange, horizontal]);

  const handleScrollbarScroll = useCallback((offset) => {
    if (horizontal) {
      scrollRef.current?.scrollTo({ x: offset, animated: false });
    } else {
      scrollRef.current?.scrollTo({ y: offset, animated: false });
    }
    scrollbarDragRef.current?.(offset);
  }, [horizontal]);

  // Touch-to-scroll: native DOM listeners bypass RNW's Responder system
  // which can intercept touch events from Pressable children and prevent scrolling
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = containerRef.current;
    if (!node) return;

    const scrollbarSize = 32; // scrollbar width/height + margin

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      const rect = node.getBoundingClientRect();

      // Don't handle touches on the scrollbar area — let Scrollbar handle those
      if (!horizontal) {
        if (touch.clientX - rect.left > rect.width - scrollbarSize) return;
      } else {
        if (touch.clientY - rect.top > rect.height - scrollbarSize) return;
      }

      touchScrollRef.current = {
        startPos: horizontal ? touch.clientX : touch.clientY,
        startOffset: metricsRef.current.offset,
        isScrolling: false,
        active: true,
      };
    };

    const handleTouchMove = (e) => {
      if (!touchScrollRef.current.active) return;
      const touch = e.touches[0];
      const pos = horizontal ? touch.clientX : touch.clientY;
      const delta = touchScrollRef.current.startPos - pos;
      const metrics = metricsRef.current;
      const maxScroll = metrics.content - metrics.visible;

      if (maxScroll <= 0) return;

      if (!touchScrollRef.current.isScrolling && Math.abs(delta) > 8) {
        touchScrollRef.current.isScrolling = true;
      }

      if (touchScrollRef.current.isScrolling) {
        e.preventDefault();
        const newOffset = Math.max(0, Math.min(touchScrollRef.current.startOffset + delta, maxScroll));
        if (horizontal) {
          scrollRef.current?.scrollTo({ x: newOffset, animated: false });
        } else {
          scrollRef.current?.scrollTo({ y: newOffset, animated: false });
        }
      }
    };

    const handleTouchEnd = () => {
      touchScrollRef.current.active = false;
      touchScrollRef.current.isScrolling = false;
    };

    node.addEventListener('touchstart', handleTouchStart, { passive: true });
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    node.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
      node.removeEventListener('touchend', handleTouchEnd);
    };
  }, [horizontal]);

  // Determine if scrollbar should be visible
  const canScroll = scrollMetrics.content > scrollMetrics.visible && scrollMetrics.visible > 0;
  const showScrollbar = alwaysShowScrollbar || canScroll;

  // Scrollbar positioning: right side for vertical, bottom for horizontal
  const scrollbarContainerStyle = horizontal
    ? {
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 2,
        height: 30,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }
    : {
        position: 'absolute',
        top: 8,
        right: 2,
        bottom: 8,
        width: 30,
        display: 'flex',
        flexDirection: 'row',
        zIndex: 10,
      };

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      <ScrollView
        ref={scrollRef}
        style={showScrollbar
          ? (horizontal ? styles.scrollViewWithBarHorizontal : styles.scrollViewWithBar)
          : styles.scrollView
        }
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={horizontal}
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
          style={scrollbarContainerStyle}
          onWheel={(e) => {
            e.preventDefault();
            const maxScroll = scrollMetrics.content - scrollMetrics.visible;
            if (maxScroll <= 0) return;
            const delta = horizontal ? (e.deltaX || e.deltaY) : e.deltaY;
            const newOffset = scrollMetrics.offset + delta;
            handleScrollbarScroll(Math.max(0, Math.min(newOffset, maxScroll)));
          }}
        >
          {/* Invisible padding area that captures wheel events */}
          <div style={horizontal ? { height: 6 } : { width: 6 }} />
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
            horizontal={horizontal}
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
  scrollViewWithBarHorizontal: {
    flex: 1,
    paddingBottom: 30, // Make room for horizontal scrollbar
  },
});

export default ScrollBarView;
