import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, PanResponder, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import Scroll from './Scroll';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import StitchedBorder from './StitchedBorder';
import FontSettingsStore from '../stores/FontSettingsStore';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

const { height: screenHeight } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 9;
const CENTER_INDEX = 4;

const SlotMachine = observer(({ items, selectedItem, onItemSelect, title, triggerSpin = false, onSpinComplete }) => {
  const scrollViewRef = useRef(null);
  const containerRef = useRef(null);
  const slotContainerRef = useRef(null);
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
      scrollToIndex(newIndex, 'keyboard');
    }
  };

  // Wheel scrolling with gradual ramp-up
  const wheelAccumulator = useRef(0);
  const wheelSnapTimer = useRef(null);
  const wheelItemsMoved = useRef(0);
  const currentScrollOffset = useRef(0);
  const handleWheel = (event) => {
    if (isSpinning) return;

    event.preventDefault();
    event.stopPropagation();

    // Normalize delta for line-mode scroll wheels (e.g. Firefox)
    let delta = event.deltaY;
    if (event.deltaMode === 1) {
      delta *= ITEM_HEIGHT;
    }

    wheelAccumulator.current += delta;

    // Move items one at a time; threshold decreases gradually the more you scroll
    let targetIndex = currentIndex;
    let threshold = Math.max(88, 100 - wheelItemsMoved.current * 3);

    while (Math.abs(wheelAccumulator.current) >= threshold) {
      const direction = wheelAccumulator.current > 0 ? 1 : -1;
      wheelAccumulator.current -= direction * threshold;
      wheelItemsMoved.current++;
      targetIndex = Math.max(0, Math.min(items.length - 1, targetIndex + direction));
      threshold = Math.max(88, 100 - wheelItemsMoved.current * 3);
    }

    if (targetIndex !== currentIndex) {
      setCurrentIndex(targetIndex);
      lastSelectionSource.current = 'wheel';
      onItemSelect(items[targetIndex]);
      scrollToIndex(targetIndex, 'wheel');
    }

    // Reset ramp-up when scrolling stops
    if (wheelSnapTimer.current) clearTimeout(wheelSnapTimer.current);
    wheelSnapTimer.current = setTimeout(() => {
      wheelAccumulator.current = 0;
      wheelItemsMoved.current = 0;
    }, 150);
  };

  // Pan responder for drag handling - fixed sensitivity
  const dragStartIndex = useRef(currentIndex);
  const accumulatedDelta = useRef(0);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, gestureState) =>
      !isSpinning && (Math.abs(gestureState.dy) > 5 || Math.abs(gestureState.dx) > 5),
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
        scrollToIndex(newIndex, 'panMove');
      }
    },
    onPanResponderRelease: () => {
      scrollToIndex(currentIndex, 'panRelease');
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => {
      scrollToIndex(currentIndex, 'panTerminate');
    },
  });

  useEffect(() => {
    const index = items.findIndex(item => item === selectedItem);
    if (index !== -1) {
      setCurrentIndex(index);
      if (!triggerSpin && lastSelectionSource.current !== 'scroll') {
        scrollToIndex(index, 'useEffect');
      }
      lastSelectionSource.current = null;
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

    const container = slotContainerRef.current;
    if (container && container.addEventListener) {
      const wheelHandler = (e) => handleWheel(e);
      container.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
      return () => {
        if (container.removeEventListener) {
          container.removeEventListener('wheel', wheelHandler, { capture: true });
        }
        if (wheelSnapTimer.current) clearTimeout(wheelSnapTimer.current);
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
      scrollToIndex(finalIndex, 'spinEnd');
      
      // Notify parent that this slot machine has completed spinning
      if (onSpinComplete) {
        setTimeout(() => {
          onSpinComplete();
        }, 200); // Wait for scroll animation to complete
      }
    }, 100);
  };

  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimer = useRef(null);
  const lastSelectionSource = useRef(null);

  const scrollToIndex = (index, source) => {
    if (scrollViewRef.current) {
      console.log('[scrollToIndex] called from:', source, 'index:', index, 'isProgrammatic was:', isProgrammaticScroll.current);
      isProgrammaticScroll.current = true;
      if (programmaticScrollTimer.current) clearTimeout(programmaticScrollTimer.current);
      programmaticScrollTimer.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 400);
      scrollViewRef.current.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const handleScroll = (event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    currentScrollOffset.current = yOffset;

    if (isProgrammaticScroll.current) return;

    const index = Math.round(yOffset / ITEM_HEIGHT);
    if (index !== currentIndex && index >= 0 && index < items.length) {
      setCurrentIndex(index);
      lastSelectionSource.current = 'scroll';
      onItemSelect(items[index]);
    }
  };

  const handleMomentumScrollEnd = (event) => {
    if (isProgrammaticScroll.current) return;
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    console.log('[momentumEnd] firing, index:', index);
    scrollToIndex(index, 'momentumEnd');
  };

  const getItemOpacity = (itemIndex, currentIndex) => {
    if (isSpinning) return 1;

    const distance = Math.abs(itemIndex - currentIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.85;
    if (distance === 2) return 0.8;
    if (distance === 3) return 0.75;
    if (distance === 4) return 0.7;
    return 0.65;
  };

  const getItemScale = (itemIndex, currentIndex) => {
    const distance = Math.abs(itemIndex - currentIndex);
    if (distance === 0) return 1.1;
    if (distance === 1) return 0.95;
    return 0.9;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor(Colors.light.secondary) }]} id={`${title}-label`}>{title}</Text>
      
      <View ref={slotContainerRef} style={styles.slotContainer}>
        <View style={styles.backgroundImageWrapper}>
          {Platform.OS === 'web' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${typeof slotBgImage === 'string' ? slotBgImage : slotBgImage.default || slotBgImage.uri || slotBgImage})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '40%',
                borderRadius: 8,
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            />
          )}
          {Platform.OS !== 'web' && (
            <ImageBackground
              source={slotBgImage}
              style={styles.backgroundImageNative}
              imageStyle={styles.imageStyle}
              resizeMode="repeat"
            />
          )}
          <View style={styles.overlay}>
            <StitchedBorder style={{ overflow: 'hidden' }}>
              <View
                ref={containerRef}
                style={styles.slotInner}
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
              <Scroll
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
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
              <TouchableOpacity
                key={item}
                activeOpacity={0.7}
                onPress={() => {
                  if (isSpinning) return;
                  console.log('[SlotMachine] clicked index:', index, 'item:', item, 'currentIndex was:', currentIndex);
                  setCurrentIndex(index);
                  lastSelectionSource.current = 'click';
                  onItemSelect(items[index]);
                  scrollToIndex(index, 'click');
                }}
                style={styles.item}
                accessible={false}
                importantForAccessibility="no"
              >
                <View style={{ opacity, transform: [{ scale }] }} pointerEvents="none">
                  <Text style={[
                    styles.itemText,
                    !isSpinning && currentIndex === index && styles.selectedItemText,
                    { opacity, fontSize: FontSettingsStore.getScaledFontSize(18), color: FontSettingsStore.getFontColor(Colors.cottagecore.greyDarker) },
                    Platform.OS === 'web' && !isSpinning && currentIndex === index && {
                      textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
                    }
                  ]}>
                    {item}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* Padding items for centering - only when not spinning */}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
          {!isSpinning && <View style={styles.paddingItem} />}
        </Scroll>
              </View>
            </StitchedBorder>
          </View>
        </View>
      </View>
    </View>
  );
});

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
    borderRadius: 8,
    overflow: 'hidden',
  },
  backgroundImageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  backgroundImageNative: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  imageStyle: {
    borderRadius: 8,
  },
  overlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
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
    fontFamily: Typography.fonts.header,
    color: Colors.cottagecore.greyDarker,
    fontSize: 18,
    opacity: 0.8,
    textAlign: 'center',
    userSelect: 'none',
    cursor: 'default',
    letterSpacing: 0.5,
  },
  selectedItemText: {
    fontFamily: Typography.fonts.header,
    color: Colors.cottagecore.greyDarker,
    opacity: 0.8,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    userSelect: 'none',
    cursor: 'default',
    letterSpacing: 0.5,
  },
});

export default SlotMachine;