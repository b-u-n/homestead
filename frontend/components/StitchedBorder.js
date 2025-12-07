import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Reusable component for the internal stitched/dashed border pattern
 * Used in buttons, slot machines, color selectors, and preview containers
 */
const StitchedBorder = ({
  children,
  borderRadius = 6,
  borderWidth = 2,
  borderColor = 'rgba(92, 90, 88, 0.55)',
  padding,
  paddingHorizontal,
  paddingVertical,
  style = {}
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          borderWidth,
          borderColor,
          ...(padding !== undefined && { padding }),
          ...(paddingHorizontal !== undefined && { paddingHorizontal }),
          ...(paddingVertical !== undefined && { paddingVertical }),
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderStyle: 'dashed',
  },
});

export default StitchedBorder;
