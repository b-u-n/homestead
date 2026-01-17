import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, ImageBackground, Easing } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Typography } from '../constants/typography';
import { Colors } from '../constants/colors';
import StitchedBorder from './StitchedBorder';
import FontSettingsStore from '../stores/FontSettingsStore';

const buttonBgImage = require('../assets/images/button-bg.png');

const KnittedLoader = observer(({ text = 'Loading...' }) => {
  // Four boxes with animated opacity for fade effect
  const box1Opacity = useRef(new Animated.Value(1)).current;
  const box2Opacity = useRef(new Animated.Value(0.5)).current;
  const box3Opacity = useRef(new Animated.Value(0.5)).current;
  const box4Opacity = useRef(new Animated.Value(0.5)).current;
  const [activeBox, setActiveBox] = React.useState(0);

  const boxOpacities = [box1Opacity, box2Opacity, box3Opacity, box4Opacity];

  useEffect(() => {
    const duration = 480;
    const fadeInDuration = 960;
    const fadeOutDuration = 1280;
    let currentBox = 0;

    const animateToNext = () => {
      const prevBox = currentBox;
      currentBox = (currentBox + 1) % 4;
      setActiveBox(currentBox);

      // Fade out previous (slow, cubic ease out), fade in current (fast, cubic ease in)
      Animated.timing(boxOpacities[prevBox], {
        toValue: 0.5,
        duration: fadeOutDuration,
        easing: Easing.bezier(0.33, 0, 0.67, 1),
        useNativeDriver: true,
      }).start();

      Animated.timing(boxOpacities[currentBox], {
        toValue: 1,
        duration: fadeInDuration,
        easing: Easing.bezier(0.33, 1, 0.67, 1),
        useNativeDriver: true,
      }).start();
    };

    const interval = setInterval(animateToNext, duration);

    return () => clearInterval(interval);
  }, []);

  // Normal button variant colors
  const boxColors = [
    'rgba(222, 134, 223, 0.25)', // primary - pink
    'rgba(179, 230, 255, 0.25)', // secondary - sky blue
    'rgba(110, 200, 130, 0.32)', // green
    'rgba(248, 217, 124, 0.15)', // accent - yellow
  ];

  // Bright versions when lit up
  const boxColorsBright = [
    'rgba(222, 140, 222, 0.55)', // primary-bright - pink
    'rgba(150, 200, 240, 0.55)', // secondary-bright - sky blue
    'rgba(110, 200, 140, 0.55)', // green-bright
    'rgba(240, 210, 140, 0.55)', // accent-bright - yellow
  ];

  const renderBox = (animatedOpacity, colorIndex, isActive) => {
    const color = isActive ? boxColorsBright[colorIndex] : boxColors[colorIndex];

    return (
      <Animated.View style={[styles.boxWrapper, { opacity: animatedOpacity }]}>
        <View style={styles.box}>
          {Platform.OS === 'web' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${typeof buttonBgImage === 'string' ? buttonBgImage : buttonBgImage.default || buttonBgImage.uri || buttonBgImage})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '80%',
                borderRadius: 6,
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            />
          )}
          {Platform.OS !== 'web' && (
            <ImageBackground
              source={buttonBgImage}
              style={styles.boxBgImage}
              imageStyle={styles.boxBgImageStyle}
              resizeMode="repeat"
            />
          )}
          <View style={[styles.boxOverlay, { backgroundColor: color }]}>
            <StitchedBorder borderRadius={6} paddingHorizontal={0} paddingVertical={0}>
              <Text
                style={[
                  styles.plusSign,
                  Platform.OS === 'web' && {
                    textShadow: '0 -1px 0 rgba(0, 0, 0, 0.36)',
                  }
                ]}
              >
                +
              </Text>
            </StitchedBorder>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.boxRow}>
        {renderBox(box1Opacity, 0, activeBox === 0)}
        {renderBox(box2Opacity, 1, activeBox === 1)}
      </View>
      <View style={styles.boxRow}>
        {renderBox(box4Opacity, 3, activeBox === 3)}
        {renderBox(box3Opacity, 2, activeBox === 2)}
      </View>
      <Text
        style={[
          styles.text,
          { fontSize: FontSettingsStore.getScaledFontSize(22), color: FontSettingsStore.getFontColor(Colors.cottagecore.greyDarker || '#3a3937') },
          Platform.OS === 'web' && {
            textShadow: '0 -1px 0 rgba(0, 0, 0, 0.36)',
          }
        ]}
      >
        {text}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  boxRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  boxWrapper: {
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: Colors.vaporwave.pink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  box: {
    width: 32,
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  boxBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  boxBgImageStyle: {
    borderRadius: 6,
  },
  boxOverlay: {
    width: '100%',
    height: '100%',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Typography.fonts.header,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.cottagecore.greyDarker || '#3a3937',
    marginTop: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 0.8,
  },
  plusSign: {
    fontFamily: Typography.fonts.needleworkGood,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(69, 67, 64, 0.55)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.36)',
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 0,
    top: 2,
  },
});

export default KnittedLoader;
