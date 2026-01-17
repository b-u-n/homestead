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

  // Handle click on track to jump
  const handleTrackClick = useCallback((e) => {
    if (!onScroll || Platform.OS !== 'web' || !trackRef.current) return;

    // Don't handle if clicking on thumb
    if (e.target !== e.currentTarget && e.target.closest('[data-thumb="true"]')) return;

    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickRatio = clickY / rect.height;
    const maxScroll = contentHeight - visibleHeight;
    const newOffset = clickRatio * maxScroll;
    onScroll(Math.max(0, Math.min(newOffset, maxScroll)));
  }, [onScroll, contentHeight, visibleHeight]);

  // Handle drag move
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !onScroll || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const trackHeight = rect.height;
    const thumbHeight = (thumbHeightPercent / 100) * trackHeight;
    const availableTrackHeight = trackHeight - thumbHeight;

    if (availableTrackHeight <= 0) return;

    const deltaY = e.clientY - dragStartY.current;
    const scrollDelta = (deltaY / availableTrackHeight) * (contentHeight - visibleHeight);
    const newOffset = dragStartOffset.current + scrollDelta;
    const maxScroll = contentHeight - visibleHeight;

    onScroll(Math.max(0, Math.min(newOffset, maxScroll)));
  }, [onScroll, contentHeight, visibleHeight, thumbHeightPercent]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Handle drag start
  const handleMouseDown = useCallback((e) => {
    if (Platform.OS !== 'web' || !canScroll) return;

    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartOffset.current = scrollOffset;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [scrollOffset, canScroll, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle mousewheel on scrollbar
  const handleWheel = useCallback((e) => {
    if (!onScroll || !canScroll) return;

    e.preventDefault();
    const delta = e.deltaY;
    const maxScroll = contentHeight - visibleHeight;
    const newOffset = scrollOffset + delta;
    onScroll(Math.max(0, Math.min(newOffset, maxScroll)));
  }, [onScroll, canScroll, contentHeight, visibleHeight, scrollOffset]);

  // Don't render if content fits (unless alwaysShow is true)
  if (!alwaysShow && !canScroll) {
    return null;
  }

  const trackWidth = width * 2;

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      onWheel={handleWheel}
      style={{
        height: '100%',
        width: trackWidth,
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

      {/* Thumb - with padding from top/bottom */}
      <div
        data-thumb="true"
        onMouseDown={handleMouseDown}
        style={{
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
        }}
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
