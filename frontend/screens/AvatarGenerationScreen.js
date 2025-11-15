import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import GradientBackground from '../components/GradientBackground';
import VaporwaveButton from '../components/VaporwaveButton';
import { Colors } from '../constants/colors';
import domain from '../utils/domain';
import ErrorStore from '../stores/ErrorStore';
import AuthStore from '../stores/AuthStore';

const AvatarGenerationScreen = observer(({ route, navigation }) => {
  const { username } = route.params;
  const screenHeight = Dimensions.get('window').height;
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#B3E6FF');
  const [selectedColorName, setSelectedColorName] = useState('sky');
  const [refreshesRemaining, setRefreshesRemaining] = useState(3);

  // Parse username into components
  const parseUsername = (username) => {
    // This is a simple parser - you might want to make it more robust
    // For now, assume the username follows the pattern: AdjectiveAdverbNoun
    const words = username.match(/[A-Z][a-z]*/g) || [];
    return {
      adjective: words[0] || 'Mysterious',
      adverb: words[1] || 'Glowing', 
      noun: words[2] || 'Spirit'
    };
  };

  // Function to darken a hex color
  const darkenColor = (hex, amount) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  // Function to lighten a hex color
  const lightenColor = (hex, amount) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const generateAvatars = async () => {
    if (!username) {
      ErrorStore.addError('Username is required');
      return;
    }

    setIsGenerating(true);
    // Don't clear existing avatars, keep them
    setSelectedAvatar(null);

    try {
      const { adjective, adverb, noun } = parseUsername(username);
      const userId = AuthStore.user?.id || 'anonymous';

      const response = await fetch(`${domain()}/api/avatar/generate-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          adjective,
          adverb,
          noun,
          color: selectedColor
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        ErrorStore.addError(data.error || 'Rate limit exceeded. Please try again later.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate avatars');
      }

      if (data.success && data.options) {
        const successfulOptions = data.options.filter(option => option.success);
        // Add new avatars to existing ones instead of replacing
        setAvatarOptions(prev => [...prev, ...successfulOptions]);
        setRefreshesRemaining(prev => Math.max(0, prev - 1));
        
        if (successfulOptions.length === 0) {
          ErrorStore.addError('No avatars were generated successfully. Please try again.');
        }
      }

    } catch (error) {
      console.error('Avatar generation error:', error);
      ErrorStore.addError(error.message || 'Failed to generate avatars. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAvatarSelect = (avatar) => {
    console.log('Avatar selected:', avatar);
    setSelectedAvatar(avatar);
  };

  const handleContinue = async () => {
    console.log('Continue button clicked');
    console.log('SessionStore.sessionId:', SessionStore.sessionId);
    console.log('username:', username);
    console.log('selectedAvatar:', selectedAvatar);
    
    if (!selectedAvatar || !username || !SessionStore.sessionId) {
      console.log('Missing required data, cannot continue');
      return;
    }

    try {
      console.log('Creating user and saving avatar...');
      
      // Create or update user with session and avatar
      const response = await fetch(`${domain()}/api/accounts/save-user-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: SessionStore.sessionId,
          username: username,
          avatarUrl: selectedAvatar.imageUrl,
          avatarData: selectedAvatar
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update AuthStore with the created user
        AuthStore.setUser(data.user, data.token || 'session_token');
        console.log('User created and avatar saved, navigating to canvas...');
        navigation.navigate('Canvas');
      } else {
        ErrorStore.addError(data.error || 'Failed to save avatar');
      }
    } catch (error) {
      console.error('Error creating user and saving avatar:', error);
      ErrorStore.addError('Failed to save avatar. Please try again.');
    }
  };

  const handleSkip = () => {
    navigation.navigate('TownMap');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollTestWindow}>
        <Text style={styles.title}>What looks like you?</Text>
        <Text style={styles.subtitle}>
          Pick your favourite colour and we'll generate an avvie for you!
        </Text>

        <View style={styles.colorWheelContainer}>
          <Text style={styles.usernameInBox}>{username}</Text>
          <View style={styles.separator} />
          
          <View style={styles.colorWheel}>
            {[
              [
                { name: 'rose', color: '#FFB3B3' },
                { name: 'coral', color: '#FFAB66' },
                { name: 'sunshine', color: '#FFDD66' },
                { name: 'mint', color: '#99FFD6' }
              ],
              [
                { name: 'sky', color: '#B3E6FF' },
                { name: 'lavender', color: '#DDBBFF' },
                { name: 'plum', color: '#7044C7' },
                { name: 'caramel', color: '#C49A6B' }
              ],
              [
                { name: 'crimson', color: '#FF6B6B' },
                { name: 'bubblegum', color: '#FF99CC' },
                { name: 'forest', color: '#66B366' },
                { name: 'ocean', color: '#6BB6FF' }
              ],
              [
                { name: 'vanilla', color: '#FFF8E1' },
                { name: 'cloud', color: '#FFFFFF' },
                { name: 'silver', color: '#B3B3B3' },
                { name: 'charcoal', color: '#666666' }
              ]
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.colorRow}>
                {row.map((colorObj) => (
                  <TouchableOpacity
                    key={colorObj.name}
                    style={[
                      styles.colorOption,
                      { 
                        backgroundColor: colorObj.color,
                        borderColor: darkenColor(colorObj.color, 35),
                        borderWidth: 1.5,
                      },
                      selectedColor === colorObj.color && [
                        styles.selectedColorOption,
                        { shadowColor: Colors.vaporwave.cyan }
                      ]
                    ]}
                    onPress={() => {
                      setSelectedColor(colorObj.color);
                      setSelectedColorName(colorObj.name);
                    }}
                  >
                    <View style={[styles.colorGlow, { backgroundColor: colorObj.color }]} />
                    {selectedColor === colorObj.color && (
                      <Text style={styles.colorCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
          
          <View style={styles.separator} />
          
          <Text style={[styles.selectedColorText, { color: `${selectedColor}DE` }]}>{selectedColorName}</Text>

          {avatarOptions.length > 0 && (
            <>
              <View style={styles.separator} />
              <View style={styles.avatarGrid}>
              {avatarOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarOption,
                    { alignItems: index % 2 === 0 ? 'flex-end' : 'flex-start' }
                  ]}
                  onPress={() => handleAvatarSelect(option)}
                >
                  <View style={[
                    styles.avatarContainer,
                    selectedAvatar === option && styles.selectedAvatarContainer
                  ]}>
                    <Image source={{ uri: option.imageUrl }} style={styles.avatarImage} />
                    {selectedAvatar === option && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            </>
          )}

          <View style={styles.separator} />

          <View style={styles.buttonContainer}>
            <VaporwaveButton
              title={isGenerating ? 'Generating...' : (avatarOptions.length > 0 ? '🎨 Generate New Options' : '✨ Generate Avatars')}
              onPress={generateAvatars}
              variant="primary"
              disabled={isGenerating || refreshesRemaining === 0}
              style={styles.generateButton}
            />

            {isGenerating && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.vaporwave.cyan} />
                <Text style={styles.loadingText}>This may take a minute...</Text>
              </View>
            )}

            <Text style={styles.rateLimit}>
              {refreshesRemaining > 0 ? `${refreshesRemaining} refreshes remaining` : 'No refreshes remaining'}
            </Text>

            <View style={styles.separator} />

            <View style={styles.navigationButtons}>
              {selectedAvatar ? (
                <VaporwaveButton
                  title="Continue to Homestead"
                  onPress={handleContinue}
                  variant="secondary"
                  style={styles.continueButton}
                />
              ) : (
                <Text style={styles.debugText}>
                  {avatarOptions.length === 0 ? 'Generate avatars first' : 'Select an avatar to continue'}
                </Text>
              )}
              
              <VaporwaveButton
                title="Skip for now"
                onPress={handleSkip}
                variant="accent"
                style={styles.skipButton}
              />
            </View>
          </View>
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
  scrollContent: {
    padding: 20,
    paddingTop: 68,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    color: Colors.text.primary,
    textAlign: 'center',
    textShadowColor: Colors.vaporwave.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.primary,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 30,
    marginTop: 24,
    gap: 10,
  },
  avatarOption: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 15,
    backgroundColor: Colors.background.card,
    borderWidth: 2,
    borderColor: Colors.vaporwave.purple,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedAvatarContainer: {
    borderColor: Colors.vaporwave.cyan,
    borderWidth: 3,
    shadowColor: Colors.vaporwave.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  avatarImage: {
    width: 128,
    height: 128,
    resizeMode: 'cover',
  },
  usernameLabel: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.vaporwave.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: Colors.background.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    marginBottom: 40,
  },
  placeholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background.card,
    borderWidth: 3,
    borderColor: Colors.vaporwave.purple,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  generateButton: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: Colors.light.secondary,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  rateLimit: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  navigationButtons: {
    gap: 15,
    alignItems: 'center',
  },
  continueButton: {
    minWidth: 200,
  },
  skipButton: {
    minWidth: 150,
  },
  colorWheelContainer: {
    alignItems: 'center',
    marginVertical: 30,
    padding: 20,
    paddingTop: 25,
    marginHorizontal: 34,
    borderRadius: 20,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  colorWheel: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  colorOption: {
    width: 64,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedColorOption: {
    borderColor: Colors.vaporwave.cyan,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 25,
    transform: [{ scale: 1.1 }],
  },
  colorCheckmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selectedColorText: {
    fontSize: 26,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 28,
    textAlign: 'center',
    textShadowColor: '#060606',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 3,
  },
  colorGlow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 16,
    opacity: 0.3,
  },
  username: {
    fontSize: 27,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
    textShadowColor: Colors.vaporwave.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  separator: {
    width: '100%',
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 0,
    padding: 0,
    marginBottom: 18,
    shadowColor: 'rgba(255, 255, 255, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  usernameInBox: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: Colors.vaporwave.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  debugText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  scrollTestWindow: {
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
});

export default AvatarGenerationScreen;