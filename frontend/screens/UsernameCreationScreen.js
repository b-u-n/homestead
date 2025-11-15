import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import GradientBackground from '../components/GradientBackground';
import VaporwaveButton from '../components/VaporwaveButton';
import SlotMachine from '../components/SlotMachine';
import { Colors } from '../constants/colors';
import { getWordArrays, createCustomUsername } from '../utils/username';
import AuthStore from '../stores/AuthStore';

const UsernameCreationScreen = observer(({ navigation }) => {
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
    navigation.navigate('AvatarGeneration', { username: selectedUsername });
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollTestWindow}>
        <Text style={styles.headerTitle}>What would you like to be?</Text>
        <Text style={styles.headerSubtitle}>
          Choose a unique username to help keep you anonymous.
        </Text>

        <View style={styles.previewContainer}>
          <Text style={styles.preview}>{isSpinning || !showUsername ? "???" : selectedUsername}</Text>
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
          <VaporwaveButton
            title={isSpinning ? "🎰 Spinning..." : "Random"}
            onPress={handleRandomize}
            variant="accent"
            style={styles.randomButton}
            disabled={isSpinning}
          />
          
          <VaporwaveButton
            title="Continue to Avatar"
            onPress={handleContinue}
            variant="primary"
            style={styles.continueButton}
          />
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollTestWindow: {
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  contentContainer: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.text.primary,
    textShadowColor: Colors.vaporwave.purple,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.light.primary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  previewContainer: {
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: Colors.vaporwave.pink,
    shadowColor: Colors.vaporwave.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  preview: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    textShadowColor: Colors.vaporwave.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  slotMachinesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 40,
    height: 450,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  randomButton: {
    alignSelf: 'center',
  },
  continueButton: {
    alignSelf: 'center',
  },
});

export default UsernameCreationScreen;