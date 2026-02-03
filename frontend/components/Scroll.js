import React, { forwardRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import ScrollBarView from './ScrollBarView';

/**
 * Scroll - Wrapper for scrollable content with MinkyPanel-styled scrollbar
 *
 * Use this instead of ScrollView directly so we can update
 * scrolling behavior app-wide in one place. Automatically provides a custom
 * scrollbar on web that:
 * - Resizes thumb based on content/viewport ratio
 * - Moves thumb when content is scrolled
 * - Supports click-to-jump on track
 * - Supports dragging the thumb
 * - Supports mousewheel on scrollbar area
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to scroll
 * @param {Object} props.style - Style for the outer container
 * @param {Object} props.contentContainerStyle - Style for the inner content container
 * @param {boolean} props.horizontal - Enable horizontal scrolling (default: false)
 * @param {string} props.keyboardShouldPersistTaps - Keyboard behavior (default: 'handled')
 * @param {boolean} props.fadeEdges - Apply fade mask at edges on web (default: true)
 * @param {string} props.overlayColor - Scrollbar track overlay color
 * @param {string} props.thumbOverlayColor - Scrollbar thumb overlay color
 *
 * @example
 * <Scroll>
 *   <Text>Content here</Text>
 * </Scroll>
 *
 * @example
 * // Without edge fading
 * <Scroll fadeEdges={false}>
 *   <Text>Content here</Text>
 * </Scroll>
 */
const Scroll = forwardRef(({
  children,
  style,
  contentContainerStyle,
  horizontal = false,
  keyboardShouldPersistTaps = 'handled',
  fadeEdges = true,
  overlayColor = 'rgba(112, 68, 199, 0.25)',
  thumbOverlayColor = 'rgba(135, 180, 210, 0.5)',
  onScrollbarDrag,
  ...props
}, ref) => {
  // Apply fade mask on web
  if (Platform.OS === 'web' && fadeEdges) {
    return (
      <View style={[styles.fadeWrapper, style]}>
        <div style={{
          flex: 1,
          maskImage: horizontal
            ? 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.85) 8px, black 14px, black calc(100% - 14px), rgba(0,0,0,0.85) calc(100% - 8px), rgba(0,0,0,0.1))'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85) 8px, black 14px, black calc(100% - 14px), rgba(0,0,0,0.85) calc(100% - 8px), rgba(0,0,0,0.1))',
          WebkitMaskImage: horizontal
            ? 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.85) 8px, black 14px, black calc(100% - 14px), rgba(0,0,0,0.85) calc(100% - 8px), rgba(0,0,0,0.1))'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85) 8px, black 14px, black calc(100% - 14px), rgba(0,0,0,0.85) calc(100% - 8px), rgba(0,0,0,0.1))',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <ScrollBarView
            ref={ref}
            style={styles.scroll}
            contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
            horizontal={horizontal}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            overlayColor={overlayColor}
            thumbOverlayColor={thumbOverlayColor}
            onScrollbarDrag={onScrollbarDrag}
            {...props}
          >
            {children}
          </ScrollBarView>
        </div>
      </View>
    );
  }

  return (
    <ScrollBarView
      ref={ref}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      horizontal={horizontal}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      overlayColor={overlayColor}
      thumbOverlayColor={thumbOverlayColor}
      onScrollbarDrag={onScrollbarDrag}
      {...props}
    >
      {children}
    </ScrollBarView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 8,
  },
  fadeWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default Scroll;
