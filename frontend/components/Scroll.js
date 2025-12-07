import React, { forwardRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

/**
 * Scroll - Wrapper for ScrollView
 *
 * Use this instead of ScrollView directly so we can update
 * scrolling behavior app-wide in one place.
 *
 * @example
 * <Scroll>
 *   <Text>Content here</Text>
 * </Scroll>
 *
 * @example
 * <Scroll contentContainerStyle={{ gap: 10 }}>
 *   <Text>With custom content styles</Text>
 * </Scroll>
 */
const Scroll = forwardRef(({
  children,
  style,
  contentContainerStyle,
  horizontal = false,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  ...props
}, ref) => {
  return (
    <ScrollView
      ref={ref}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      horizontal={horizontal}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

export default Scroll;
