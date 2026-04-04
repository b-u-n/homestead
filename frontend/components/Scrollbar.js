import React, { useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

/**
 * Scrollbar - A MinkyPanel-styled scrollbar that pairs with a ScrollView
 */
const Scrollbar = ({
  contentHeight = 0,
  visibleHeight = 0,
  scrollOffset = 0,
  onScroll,
  overlayColor = 'rgba(112, 68, 199, 0.25)',
  thumbOverlayColor = 'rgba(135, 180, 210, 0.5)',
  width = 12,
  style,
  alwaysShow = false,
  horizontal = false,
  rotated = false,
}) => {
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);

  // Calculate whether scrolling is possible
  const canScroll = contentHeight > visibleHeight && visibleHeight > 0;

  // Calculate thumb size (inversely proportional to content)
  const ratio = contentHeight > 0 ? visibleHeight / contentHeight : 1;
  const thumbHeightPercent = canScroll ? Math.max(ratio * 100, 10) : 100;

  // Calculate thumb position
  const scrollableHeight = contentHeight - visibleHeight;
  const scrollProgress = scrollableHeight > 0 ? scrollOffset / scrollableHeight : 0;
  const thumbTopPercent = canScroll ? scrollProgress * (100 - thumbHeightPercent) : 0;

  // Effective 1D drag position accounting for 90deg CW rotation
  const getClientPos = useCallback((clientX, clientY) => {
    if (horizontal) return rotated ? -clientY : clientX;
    return rotated ? -clientX : clientY;
  }, [horizontal, rotated]);

  // Handle drag move (mouse or touch)
  const handleDragMove = useCallback((clientPos) => {
    if (!isDragging.current || !onScroll || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    // When rotated, track's physical length is along the perpendicular axis
    const trackSize = (horizontal === rotated) ? rect.height : rect.width;
    const thumbSize = (thumbHeightPercent / 100) * trackSize;
    const availableTrackSize = trackSize - thumbSize;

    if (availableTrackSize <= 0) return;

    const delta = clientPos - dragStartY.current;
    const scrollDelta = (delta / availableTrackSize) * (contentHeight - visibleHeight);
    const newOffset = dragStartOffset.current + scrollDelta;
    const maxScroll = contentHeight - visibleHeight;

    onScroll(Math.max(0, Math.min(newOffset, maxScroll)));
  }, [onScroll, contentHeight, visibleHeight, thumbHeightPercent, horizontal, rotated]);

  const handleMouseMove = useCallback((e) => handleDragMove(getClientPos(e.clientX, e.clientY)), [handleDragMove, getClientPos]);
  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    handleDragMove(getClientPos(e.touches[0].clientX, e.touches[0].clientY));
  }, [handleDragMove, getClientPos]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleTouchMove, { capture: true });
    document.removeEventListener('touchend', handleDragEnd, { capture: true });
  }, [handleMouseMove, handleTouchMove]);

  // Keep old name for existing refs
  const handleMouseUp = handleDragEnd;

  // Handle press on track to jump and start drag
  const handleTrackMouseDown = useCallback((e) => {
    if (!onScroll || Platform.OS !== 'web' || !trackRef.current) return;
    if (e.target !== e.currentTarget && e.target.closest('[data-thumb="true"]')) return;

    e.preventDefault();
    e.stopPropagation();
    const rect = trackRef.current.getBoundingClientRect();
    let clickPos, trackLength;
    if (horizontal) {
      if (rotated) {
        clickPos = rect.bottom - e.clientY;
        trackLength = rect.height;
      } else {
        clickPos = e.clientX - rect.left;
        trackLength = rect.width;
      }
    } else {
      if (rotated) {
        clickPos = rect.right - e.clientX;
        trackLength = rect.width;
      } else {
        clickPos = e.clientY - rect.top;
        trackLength = rect.height;
      }
    }
    const clickRatio = clickPos / trackLength;
    const maxScroll = contentHeight - visibleHeight;
    const newOffset = Math.max(0, Math.min(clickRatio * maxScroll, maxScroll));
    onScroll(newOffset);

    isDragging.current = true;
    dragStartY.current = getClientPos(e.clientX, e.clientY);
    dragStartOffset.current = newOffset;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [onScroll, contentHeight, visibleHeight, handleMouseMove, handleDragEnd, horizontal, rotated, getClientPos]);

  const handleTrackTouchStart = useCallback((e) => {
    if (!onScroll || Platform.OS !== 'web' || !trackRef.current) return;
    if (e.target !== e.currentTarget && e.target.closest('[data-thumb="true"]')) return;

    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = trackRef.current.getBoundingClientRect();
    let touchPos, trackLength;
    if (horizontal) {
      if (rotated) {
        touchPos = rect.bottom - touch.clientY;
        trackLength = rect.height;
      } else {
        touchPos = touch.clientX - rect.left;
        trackLength = rect.width;
      }
    } else {
      if (rotated) {
        touchPos = rect.right - touch.clientX;
        trackLength = rect.width;
      } else {
        touchPos = touch.clientY - rect.top;
        trackLength = rect.height;
      }
    }
    const touchRatio = touchPos / trackLength;
    const maxScroll = contentHeight - visibleHeight;
    const newOffset = Math.max(0, Math.min(touchRatio * maxScroll, maxScroll));
    onScroll(newOffset);

    isDragging.current = true;
    dragStartY.current = getClientPos(touch.clientX, touch.clientY);
    dragStartOffset.current = newOffset;
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', handleDragEnd, { capture: true });
  }, [onScroll, contentHeight, visibleHeight, handleTouchMove, handleDragEnd, horizontal, rotated, getClientPos]);

  // Handle drag start (mouse)
  const handleMouseDown = useCallback((e) => {
    if (Platform.OS !== 'web' || !canScroll) return;

    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    dragStartY.current = getClientPos(e.clientX, e.clientY);
    dragStartOffset.current = scrollOffset;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [scrollOffset, canScroll, handleMouseMove, handleDragEnd, getClientPos]);

  // Handle drag start (touch)
  const handleTouchStart = useCallback((e) => {
    if (Platform.OS !== 'web' || !canScroll) return;

    e.stopPropagation();
    isDragging.current = true;
    dragStartY.current = getClientPos(e.touches[0].clientX, e.touches[0].clientY);
    dragStartOffset.current = scrollOffset;

    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', handleDragEnd, { capture: true });
  }, [scrollOffset, canScroll, handleTouchMove, handleDragEnd, getClientPos]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
      document.removeEventListener('touchend', handleDragEnd, { capture: true });
    };
  }, [handleMouseMove, handleTouchMove, handleDragEnd]);

  // Handle mousewheel on scrollbar
  const handleWheel = useCallback((e) => {
    if (!onScroll || !canScroll) return;

    e.preventDefault();
    const delta = rotated
      ? -(horizontal ? (e.deltaY || e.deltaX) : (e.deltaX || e.deltaY))
      : (horizontal ? (e.deltaX || e.deltaY) : e.deltaY);
    const maxScroll = contentHeight - visibleHeight;
    const newOffset = scrollOffset + delta;
    onScroll(Math.max(0, Math.min(newOffset, maxScroll)));
  }, [onScroll, canScroll, contentHeight, visibleHeight, scrollOffset, horizontal, rotated]);

  // Don't render if content fits (unless alwaysShow is true)
  if (!alwaysShow && !canScroll) {
    return null;
  }

  const trackWidth = width * 2;

  // Swap track and thumb orientation based on horizontal prop
  const trackStyle = horizontal
    ? { width: '100%', height: trackWidth }
    : { height: '100%', width: trackWidth };

  const thumbStyle = horizontal
    ? {
        position: 'absolute',
        top: 3,
        bottom: 3,
        width: `calc(${thumbHeightPercent}% - 8px)`,
        left: `calc(${thumbTopPercent}% + 4px)`,
        cursor: canScroll ? 'grab' : 'default',
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: '#E8D4C8',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15)',
      }
    : {
        position: 'absolute',
        left: 3,
        right: 3,
        height: `calc(${thumbHeightPercent}% - 8px)`,
        top: `calc(${thumbTopPercent}% + 4px)`,
        cursor: canScroll ? 'grab' : 'default',
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: '#E8D4C8',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15)',
      };

  return (
    <div
      ref={trackRef}
      onMouseDown={handleTrackMouseDown}
      onTouchStart={handleTrackTouchStart}
      onWheel={handleWheel}
      style={{
        ...trackStyle,
        cursor: canScroll ? 'pointer' : 'default',
        position: 'relative',
        ...style,
      }}
    >
      {/* Track background - full height with minky texture */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#E8D4C8',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15)',
      }}>
        {/* Texture */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${typeof slotBgImage === 'string' ? slotBgImage : slotBgImage.default || slotBgImage.uri || slotBgImage})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200%',
          opacity: 0.8,
          transform: 'translate3d(0,0,0)',
          WebkitBackfaceVisibility: 'hidden',
        }} />
        {/* Color overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: overlayColor,
        }} />
        {/* Stitched border */}
        <div style={{
          position: 'absolute',
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
          borderRadius: 4,
          border: '2px dashed rgba(92, 90, 88, 0.55)',
        }} />
      </div>

      {/* Thumb */}
      <div
        data-thumb="true"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={thumbStyle}
      >
        {/* Texture */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${typeof slotBgImage === 'string' ? slotBgImage : slotBgImage.default || slotBgImage.uri || slotBgImage})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200%',
          opacity: 0.8,
          transform: 'translate3d(0,0,0)',
          WebkitBackfaceVisibility: 'hidden',
        }} />
        {/* Color overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: thumbOverlayColor,
        }} />
        {/* Stitched border */}
        <div style={{
          position: 'absolute',
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
          borderRadius: 3,
          border: '2px dashed rgba(92, 90, 88, 0.55)',
        }} />
      </div>
    </div>
  );
};

export default Scrollbar;
