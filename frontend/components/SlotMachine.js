import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Animated, PanResponder, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const { height: screenHeight } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 9;
const CENTER_INDEX = 4;

const SlotMachine = ({ items, selectedItem, onItemSelect, title, triggerSpin = false, onSpinComplete }) => {
  const scrollViewRef = useRef(null);
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // Detect mobile or mobile web
  const isMobileOrMobileWeb = Platform.OS !== 'web' || 
    (Platform.OS === 'web' && typeof window !== 'undefined' && 
     (window.innerWidth <= 768 || 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)));

  // Handle keyboard navigation
  const handleKeyPress = (event) => {
    if (isSpinning) return;
    
    const key = event.key || event.nativeEvent?.key;
    let newIndex = currentIndex;
    
    if (key === 'ArrowUp') {
      event.preventDefault();
      newIndex = Math.max(0, currentIndex - 1);
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      newIndex = Math.min(items.length - 1, currentIndex + 1);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      onItemSelect(items[currentIndex]);
      return;
    }
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      onItemSelect(items[newIndex]);
      scrollToIndex(newIndex);
    }
  };

  // Enhanced wheel event handling with proper throttling
  const lastWheelTime = useRef(0);
  const handleWheel = (event) => {
    if (isSpinning) return;
    
    // Require minimum scroll distance to prevent tiny movements
    if (Math.abs(event.deltaY) < 30) return;
    
    const now = Date.now();
    
    // Platform-specific throttle - slower on desktop, no throttle on mobile
    const throttleTime = Platform.OS === 'web' ? 284 : 0;
    if (now - lastWheelTime.current < throttleTime) return;
    lastWheelTime.current = now;
    
    event.preventDefault();
    event.stopPropagation();
    
    // Each scroll moves exactly 1 item
    const direction = event.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(items.length - 1, currentIndex + direction));
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      onItemSelect(items[newIndex]);
      scrollToIndex(newIndex);
    }
  };

  // Pan responder for drag handling - fixed sensitivity
  const dragStartIndex = useRef(currentIndex);
  const accumulatedDelta = useRef(0);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isSpinning,
    onMoveShouldSetPanResponder: () => !isSpinning,
    onPanResponderGrant: () => {
      dragStartIndex.current = currentIndex;
      accumulatedDelta.current = 0;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (isSpinning) return;
      
      // More sensitive for mobile - easier dragging
      accumulatedDelta.current = gestureState.dy;
      const itemsMoved = Math.floor(accumulatedDelta.current / ITEM_HEIGHT);
      const newIndex = Math.max(0, Math.min(items.length - 1, dragStartIndex.current - itemsMoved));
      
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        onItemSelect(items[newIndex]);
        scrollToIndex(newIndex);
      }
    },
    onPanResponderRelease: () => {
      scrollToIndex(currentIndex);
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => {
      scrollToIndex(currentIndex);
    },
  });

  useEffect(() => {
    const index = items.findIndex(item => item === selectedItem);
    if (index !== -1) {
      setCurrentIndex(index);
      if (!triggerSpin) {
        scrollToIndex(index);
      }
    }
  }, [selectedItem, items]);

  useEffect(() => {
    if (triggerSpin) {
      performSpinAnimation();
    }
  }, [triggerSpin]);

  // Add wheel event listener for better mouse scroll (desktop web only)
  useEffect(() => {
    if (isMobileOrMobileWeb) return; // Skip on mobile and mobile web
    
    const container = containerRef.current;
    if (container && container.addEventListener) {
      const wheelHandler = (e) => handleWheel(e);
      container.addEventListener('wheel', wheelHandler, { passive: false });
      return () => {
        if (container.removeEventListener) {
          container.removeEventListener('wheel', wheelHandler);
        }
      };
    }
  }, [currentIndex, isSpinning, items, isMobileOrMobileWeb]);

  const performSpinAnimation = async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    const spinCount = 15 + Math.floor(Math.random() * 10);
    const spinDuration = 188; // Adjusted speed (188ms per frame)
    
    for (let i = 0; i < spinCount; i++) {
      const randomIndex = Math.floor(Math.random() * items.length);
      if (scrollViewRef.current) {
        // During spinning, scroll directly to item position (no padding)
        scrollViewRef.current.scrollTo({
          y: randomIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
      await new Promise(resolve => setTimeout(resolve, spinDuration));
    }
    
    // End spinning first to restore padding
    setIsSpinning(false);
    
    // Then scroll to final position with padding
    setTimeout(() => {
      const finalIndex = items.findIndex(item => item === selectedItem);
      setCurrentIndex(finalIndex);
      scrollToIndex(finalIndex);
      
      // Notify parent that this slot machine has completed spinning
      if (onSpinComplete) {
        setTimeout(() => {
          onSpinComplete();
        }, 200); // Wait for scroll animation to complete
      }
    }, 100);
  };

  const scrollToIndex = (index) => {
    if (scrollViewRef.current) {
      // Scroll to put the selected item in the center
      scrollViewRef.current.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const handleScroll = (event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    
    if (index !== currentIndex && index >= 0 && index < items.length) {
      setCurrentIndex(index);
      onItemSelect(items[index]);
    }
  };

  const handleMomentumScrollEnd = (event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    scrollToIndex(index);
  };

  const getItemOpacity = (itemIndex, currentIndex) => {
    // When spinning, show all items at full opacity
    if (isSpinning) return 1;
    
    const distance = Math.abs(itemIndex - currentIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.9;
    if (distance === 2) return 0.8;
    if (distance === 3) return 0.6;
    if (distance === 4) return 0.4;
    return 0.2;
  };

  const getItemScale = (itemIndex, currentIndex) => {
    const distance = Math.abs(itemIndex - currentIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.9;
    return 0.8;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} id={`${title}-label`}>{title}</Text>
      
      <View 
        ref={containerRef}
        style={styles.slotContainer}
        {...(!isMobileOrMobileWeb ? panResponder.panHandlers : {})}
        {...(Platform.OS === 'web' ? {
          role: "listbox",
          "aria-labelledby": `${title}-label`,
          "aria-activedescendant": `${title}-item-${currentIndex}`,
          tabIndex: isSpinning ? -1 : 0,
          onKeyDown: handleKeyPress
        } : {
          accessibilityRole: "adjustable",
          accessibilityLabel: `${title} selector. Current selection: ${items[currentIndex]}. Use arrow keys to change selection.`,
          accessibilityValue: {
            now: currentIndex,
            min: 0,
            max: items.length - 1,
            text: items[currentIndex]
          }
        })}
      >
        {/* Gradient overlays for fade effect */}
        <LinearGradient
          colors={[Colors.background.card, 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', Colors.background.card]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
        
        
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={isMobileOrMobileWeb ? handleScroll : undefined}
          onMomentumScrollEnd={isMobileOrMobileWeb ? handleMomentumScrollEnd : undefined}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={isMobileOrMobileWeb && !isSpinning}
          accessible={false}
          importantForAccessibility="no"
        >
          {/* Padding items for centering - only when not spinning */}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
          
          {items.map((item, index) => {
            const opacity = getItemOpacity(index, currentIndex);
            const scale = getItemScale(index, currentIndex);
            
            return (
              <View
                key={item}
                style={[
                  styles.item,
                  {
                    opacity,
                    transform: [{ scale }]
                  }
                ]}
                accessible={false}
                importantForAccessibility="no"
              >
                <Text style={[
                  styles.itemText,
                  !isSpinning && currentIndex === index && styles.selectedItemText,
                  { opacity }
                ]}>
                  {item}
                </Text>
              </View>
            );
          })}
          
          {/* Padding items for centering - only when not spinning */}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  title: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  slotContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.background.card,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.vaporwave.cyan,
    overflow: 'hidden',
    cursor: 'default',
    outline: 'none',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 2,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 2,
  },
  selector: {
    position: 'absolute',
    top: ITEM_HEIGHT * CENTER_INDEX,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: Colors.vaporwave.pink,
    opacity: 0.15,
    zIndex: 1,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.vaporwave.pink,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  paddingItem: {
    height: ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  selectedItem: {
    backgroundColor: 'transparent',
  },
  itemText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    userSelect: 'none',
    cursor: 'default',
  },
  selectedItemText: {
    color: Colors.text.primary,
    fontWeight: '700',
    textShadowColor: Colors.vaporwave.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    userSelect: 'none',
    cursor: 'default',
  },
});

export default SlotMachine;