import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions, Platform, ImageBackground } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import VaporwaveButton from '../components/VaporwaveButton';
import StitchedBorder from '../components/StitchedBorder';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import domain from '../utils/domain';
import ErrorStore from '../stores/ErrorStore';
import AuthStore from '../stores/AuthStore';
import SessionStore from '../stores/SessionStore';
import WebSocketService from '../services/websocket';

const buttonBgImage = require('../assets/images/button-bg.png');
const slotBgImage = require('../assets/images/slot-bg-2.jpeg');

const AvatarGenerationScreen = observer(() => {
  const router = useRouter();
  const { username } = useLocalSearchParams();
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

  // Get border color for color selectors - lighter for dark colors
  const getBorderColor = (color) => {
    // For dark colors (plum, charcoal), use a lighter border
    if (color === '#7044C7' || color === '#666666') {
      return lightenColor(color, 80); // Halfway to white
    }
    // Default border color for other colors
    return 'rgba(92, 90, 88, 0.55)';
  };

  // Get glow color for selected color - darken light colors so they show up
  const getGlowColor = (color) => {
    // For very light colors, darken them so the glow is visible
    if (color === '#FFFFFF' || color === '#FFF8E1' || color === '#B3B3B3') {
      return darkenColor(color, 60);
    }
    // For most colors, just use the color itself
    return color;
  };

  // Get descriptive color text for AI prompt
  const getColorText = (colorName) => {
    const colorMap = {
      'rose': 'rose pink',
      'coral': 'coral orange',
      'sunshine': 'sunshine yellow',
      'mint': 'mint green',
      'sky': 'sky blue',
      'lavender': 'lavender purple',
      'plum': 'plum purple',
      'caramel': 'caramel brown',
      'crimson': 'crimson red',
      'bubblegum': 'bubblegum pink',
      'forest': 'forest green',
      'ocean': 'ocean blue',
      'vanilla': 'vanilla cream',
      'cloud': 'cloud white',
      'silver': 'silver grey',
      'charcoal': 'charcoal grey'
    };
    return colorMap[colorName] || colorName;
  };

  // Get display text for color (capitalized)
  const getColorDisplayText = (colorName) => {
    const colorText = getColorText(colorName);
    // Capitalize each word
    return colorText.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
      const colorText = getColorText(selectedColorName);

      console.log('Generating avatars with:', { userId, adjective, adverb, noun, color: selectedColor, colorText });

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
          color: selectedColor,
          colorText
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

      console.log('Avatar generation response:', data);

      if (data.success && data.options) {
        const successfulOptions = data.options.filter(option => option.success);
        console.log(`Got ${successfulOptions.length} successful avatars`);

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
    // Toggle selection - if clicking the same avatar, unselect it
    if (selectedAvatar === avatar) {
      setSelectedAvatar(null);
    } else {
      setSelectedAvatar(avatar);
    }
  };

  const handleContinue = async () => {
    try {
      console.log('=== Continue button clicked ===');
      console.log('SessionStore:', SessionStore);
      console.log('SessionStore.sessionId:', SessionStore?.sessionId);
      console.log('username:', username);
      console.log('selectedAvatar:', selectedAvatar);

      if (!selectedAvatar || !username) {
        console.error('Missing avatar or username');
        ErrorStore.addError('Please select an avatar before continuing');
        return;
      }

      if (!SessionStore || !SessionStore.sessionId) {
        console.error('SessionStore or sessionId is missing', SessionStore);
        ErrorStore.addError('No session found. Please refresh the page and try again.');
        return;
      }

      console.log('Creating user and saving avatar...');
      console.log('Request body:', {
        sessionId: SessionStore.sessionId,
        username: username,
        avatarUrl: selectedAvatar.imageUrl
      });

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

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        // Update AuthStore with the created user
        AuthStore.setUser(data.user, data.token || 'session_token');
        console.log('User created and avatar saved, connecting to websocket...');

        // Connect to websocket to load user profile
        WebSocketService.connect();

        console.log('Navigating to explore...');
        router.push('/homestead/explore/map/town-square');
      } else {
        console.error('Server error:', data.error);
        ErrorStore.addError(data.error || 'Failed to save avatar');
      }
    } catch (error) {
      console.error('Error in handleContinue:', error);
      console.error('Error stack:', error.stack);
      ErrorStore.addError(`Failed to save avatar: ${error.message}`);
    }
  };

  const handleSkip = () => {
    router.push('/homestead/explore/map');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
          <Text
            style={[
              styles.title,
              Platform.OS === 'web' && {
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
              }
            ]}
          >
            You can be anything!
          </Text>
          <Text
            style={[
              styles.subtitle,
              Platform.OS === 'web' && {
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
              }
            ]}
          >
            Pick your favourite colour and we'll generate an avvie for you!
          </Text>
        </View>

        <View style={styles.colorWheelContainer}>
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
                borderRadius: 20,
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            />
          )}
          {Platform.OS !== 'web' && (
            <ImageBackground
              source={slotBgImage}
              style={styles.slotBgImage}
              imageStyle={styles.slotBgImageStyle}
              resizeMode="repeat"
            />
          )}
          <View style={styles.colorWheelOverlay}>
            <StitchedBorder borderRadius={20} style={styles.colorWheelBorder}>
              <Text
                style={[
                  styles.usernameInBox,
                  Platform.OS === 'web' && {
                    textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
                  }
                ]}
              >
                {username}
              </Text>
          
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
                      selectedColor === colorObj.color && [
                        styles.selectedColorOption,
                        { shadowColor: getGlowColor(colorObj.color) }
                      ]
                    ]}
                    onPress={() => {
                      setSelectedColor(colorObj.color);
                      setSelectedColorName(colorObj.name);
                    }}
                  >
                    {/* Background texture */}
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
                          backgroundSize: '15%',
                          borderRadius: 17,
                          pointerEvents: 'none',
                          opacity: 0.8,
                        }}
                      />
                    )}
                    {Platform.OS !== 'web' && (
                      <ImageBackground
                        source={buttonBgImage}
                        style={styles.colorBgImage}
                        imageStyle={{ opacity: 0.8 }}
                        resizeMode="repeat"
                      />
                    )}

                    {/* Color overlay */}
                    <View style={[styles.colorOverlay, { backgroundColor: colorObj.color }]}>
                      <StitchedBorder borderRadius={15} borderWidth={1.5} borderColor={getBorderColor(colorObj.color)}>
                        {selectedColor === colorObj.color && (
                          <Text style={styles.colorCheckmark}>✓</Text>
                        )}
                      </StitchedBorder>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <Text
            style={[
              styles.selectedColorText,
              Platform.OS === 'web' && {
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3)',
              }
            ]}
          >
            {getColorDisplayText(selectedColorName)}
          </Text>

          {avatarOptions.length > 0 && (
            <>
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
                  <View style={styles.avatarButtonWrapper}>
                    {/* Background texture */}
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
                          backgroundSize: '40%',
                          borderRadius: 15,
                          pointerEvents: 'none',
                          opacity: 0.8,
                        }}
                      />
                    )}
                    {Platform.OS !== 'web' && (
                      <ImageBackground
                        source={buttonBgImage}
                        style={styles.avatarBgImage}
                        imageStyle={{ borderRadius: 15, opacity: 0.8 }}
                        resizeMode="repeat"
                      />
                    )}

                    <View style={[styles.avatarOverlay, { backgroundColor: selectedColor }]}>
                      <View style={[
                        styles.avatarContainer,
                        selectedAvatar === option && {
                          borderColor: selectedColor,
                          borderWidth: 3,
                          borderStyle: 'dashed',
                          shadowColor: selectedColor,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 15,
                          elevation: 15,
                        }
                      ]}>
                        {option.imageUrl ? (
                          <Image source={{ uri: option.imageUrl }} style={styles.avatarImage} />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarPlaceholderText}>?</Text>
                          </View>
                        )}
                        {selectedAvatar === option && (
                          <View style={[styles.selectedIndicator, { backgroundColor: selectedColor }]}>
                            <Text style={styles.selectedText}>✓</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            </>
          )}

              <View style={styles.buttonContainer}>
            <VaporwaveButton
              title={isGenerating ? 'Generating...' : (avatarOptions.length > 0 ? 'Generate New Options' : 'Generate Avatars')}
              onPress={generateAvatars}
              variant="secondary"
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

            <View style={styles.navigationButtons}>
              {selectedAvatar ? (
                <VaporwaveButton
                  title="Continue to Homestead"
                  onPress={handleContinue}
                  variant="secondary"
                  style={styles.continueButton}
                />
              ) : (
                <>
                  <Text style={styles.placeholderText}>
                    {avatarOptions.length === 0 ? 'Generate an avatar to continue...' : 'Select an avatar to continue...'}
                  </Text>
                  <VaporwaveButton
                    title="Skip for now"
                    onPress={handleSkip}
                    variant="blue"
                    style={styles.skipButton}
                  />
                </>
              )}
              </View>
            </View>
            </StitchedBorder>
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
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
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
  title: {
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
  subtitle: {
    fontFamily: Typography.fonts.subheader,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.cottagecore.greyDark,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 26,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  avatarButtonWrapper: {
    position: 'relative',
    borderRadius: 15,
    overflow: 'hidden',
  },
  avatarBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 15,
    backgroundColor: Colors.background.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 90, 88, 0.55)',
    overflow: 'hidden',
    position: 'relative',
  },
  selectedAvatarContainer: {
    borderColor: Colors.vaporwave.cyan,
    borderWidth: 3,
    borderStyle: 'dashed',
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
  avatarPlaceholder: {
    width: 128,
    height: 128,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 64,
    color: Colors.text.secondary,
    fontWeight: '800',
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
  oldPlaceholderContainer: {
    marginBottom: 40,
  },
  oldPlaceholderAvatar: {
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
  oldPlaceholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  oldPlaceholderSubtext: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 0,
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
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: Colors.cottagecore.greyDark,
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
    position: 'relative',
    alignItems: 'center',
    marginVertical: 30,
    marginHorizontal: 34,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  slotBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  slotBgImageStyle: {
    borderRadius: 20,
    opacity: 0.8,
  },
  colorWheelOverlay: {
    width: '100%',
    backgroundColor: 'rgba(222, 134, 223, 0.25)',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorWheelBorder: {
    width: '100%',
    padding: 20,
    paddingTop: 25,
    overflow: 'visible',
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
    marginHorizontal: 6,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  colorBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  colorOverlay: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    overflow: 'hidden',
  },
  selectedColorOption: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 30,
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
    fontFamily: Typography.fonts.header,
    fontSize: 28,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 28,
    textAlign: 'center',
    color: Colors.cottagecore.greyDark,
    letterSpacing: 0.8,
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
    fontFamily: Typography.fonts.header,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.cottagecore.greyDark,
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 0.8,
  },
  placeholderText: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: Colors.cottagecore.greyDark,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default AvatarGenerationScreen;