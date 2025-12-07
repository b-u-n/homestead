import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ImageBackground,  } from 'react-native';
import Scroll from '../components/Scroll';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import WoolButton from '../components/WoolButton';
import SlotMachine from '../components/SlotMachine';
import StitchedBorder from '../components/StitchedBorder';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { getWordArrays, createCustomUsername } from '../utils/username';
import AuthStore from '../stores/AuthStore';

const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

const UsernameCreationScreen = observer(() => {
  const router = useRouter();
  const wordArrays = getWordArrays();
  
  // Start with random selection
  const getRandomSelection = () => ({
    adjective: wordArrays.adjectives[Math.floor(Math.random() * wordArrays.adjectives.length)],
    adverb: wordArrays.adverbs[Math.floor(Math.random() * wordArrays.adverbs.length)],
    noun: wordArrays.nouns[Math.floor(Math.random() * wordArrays.nouns.length)]
  });

  const initialSelection = getRandomSelection();
  
  const [selectedAdjective, setSelectedAdjective] = useState(initialSelection.adjective);
  const [selectedAdverb, setSelectedAdverb] = useState(initialSelection.adverb);
  const [selectedNoun, setSelectedNoun] = useState(initialSelection.noun);
  const [isSpinning, setIsSpinning] = useState(true); // Start spinning
  const [showUsername, setShowUsername] = useState(false);
  const [completedSpins, setCompletedSpins] = useState(0);

  const selectedUsername = createCustomUsername(selectedAdjective, selectedAdverb, selectedNoun);

  // Initial spin animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpinning(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show username when all 3 slot machines have completed movement
  useEffect(() => {
    if (completedSpins === 3) {
      setTimeout(() => {
        setShowUsername(true);
      }, 324);
    }
  }, [completedSpins]);

  const handleSpinComplete = () => {
    setCompletedSpins(prev => prev + 1);
  };

  const resetSpinCount = () => {
    setCompletedSpins(0);
    setShowUsername(false);
  };

  const handleContinue = () => {
    // Update user with username
    if (AuthStore.user) {
      const updatedUser = {
        ...AuthStore.user,
        name: selectedUsername
      };
      AuthStore.setUser(updatedUser, AuthStore.token);
    }

    // Navigate to avatar generation
    router.push({ pathname: '/homestead/onboarding/avatar', params: { username: selectedUsername } });
  };

  const handleRandomize = async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    resetSpinCount(); // Reset counters
    
    // Select new random values
    const newAdjective = wordArrays.adjectives[Math.floor(Math.random() * wordArrays.adjectives.length)];
    const newAdverb = wordArrays.adverbs[Math.floor(Math.random() * wordArrays.adverbs.length)];
    const newNoun = wordArrays.nouns[Math.floor(Math.random() * wordArrays.nouns.length)];
    
    // Update state to trigger spin animations
    setSelectedAdjective(newAdjective);
    setSelectedAdverb(newAdverb);
    setSelectedNoun(newNoun);
    
    // Reset spinning state after animation completes
    setTimeout(() => {
      setIsSpinning(false);
    }, 2000);
  };

  return (
    <Scroll style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text
              style={[
                styles.headerTitle,
                Platform.OS === 'web' && {
                  textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
                }
              ]}
            >
              What would you like to be?
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                Platform.OS === 'web' && {
                  textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
                }
              ]}
            >
              choose an anonymous username
            </Text>
          </View>

        <View style={styles.previewContainer}>
          {/* Background texture */}
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
              style={styles.previewBgImage}
              imageStyle={styles.previewBgImageStyle}
              resizeMode="repeat"
            />
          )}
          <View style={styles.previewOverlay}>
            <StitchedBorder borderRadius={8} style={styles.previewBorder}>
              <Text
                style={[
                  styles.preview,
                  Platform.OS === 'web' && {
                    textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
                  }
                ]}
              >
                {isSpinning || !showUsername ? "???" : selectedUsername}
              </Text>
            </StitchedBorder>
          </View>
        </View>

        <View style={styles.slotMachinesContainer}>
          <SlotMachine
            items={wordArrays.adjectives}
            selectedItem={selectedAdjective}
            onItemSelect={setSelectedAdjective}
            title=""
            triggerSpin={isSpinning}
            onSpinComplete={handleSpinComplete}
          />
          <SlotMachine
            items={wordArrays.adverbs}
            selectedItem={selectedAdverb}
            onItemSelect={setSelectedAdverb}
            title=""
            triggerSpin={isSpinning}
            onSpinComplete={handleSpinComplete}
          />
          <SlotMachine
            items={wordArrays.nouns}
            selectedItem={selectedNoun}
            onItemSelect={setSelectedNoun}
            title=""
            triggerSpin={isSpinning}
            onSpinComplete={handleSpinComplete}
          />
        </View>

          <View style={styles.buttonContainer}>
            <WoolButton
              title={isSpinning ? "Spinning..." : "Randomize"}
              onPress={handleRandomize}
              variant="accent"
              style={styles.randomButton}
              disabled={isSpinning}
            />

            <WoolButton
              title="Continue to Avatar"
              onPress={handleContinue}
              variant="primary"
              style={styles.continueButton}
            />
          </View>
        </View>
    </Scroll>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
    backgroundColor: 'transparent',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontFamily: Typography.fonts.header,
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.cottagecore.greyDark,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: Typography.fonts.subheader,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.cottagecore.greyDark,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 26,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 8,
    marginBottom: 30,
    maxWidth: 640,
    width: '100%',
    overflow: 'hidden',
  },
  previewBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  previewBgImageStyle: {
    borderRadius: 8,
    opacity: 0.8,
  },
  previewOverlay: {
    width: '100%',
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBorder: {
    width: '100%',
    padding: 20,
  },
  preview: {
    fontFamily: Typography.fonts.header,
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.cottagecore.greyDarker,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 1,
  },
  slotMachinesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 40,
    minHeight: 450,
    maxWidth: 1000,
    gap: 10,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'stretch',
    gap: 16,
  },
  randomButton: {
    width: '100%',
  },
  continueButton: {
    width: '100%',
  },
});

export default UsernameCreationScreen;