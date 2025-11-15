import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import domain from '../utils/domain';
import ErrorStore from '../stores/ErrorStore';

const AvatarGenerator = observer(({ username, onAvatarSelect, currentAvatar = null }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState(currentAvatar);

  const generateAvatar = async () => {
    if (!username) {
      ErrorStore.addError('Please select a username first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${domain()}/api/avatar/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          style: 'cartoon'
        }),
      });

      const data = await response.json();

      if (response.status === 529) {
        ErrorStore.addError(data.message || 'Rate limit exceeded. Please try again later.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate avatar');
      }

      setGeneratedAvatar(data.imageUrl);
      onAvatarSelect(data.imageUrl);

    } catch (error) {
      console.error('Avatar generation error:', error);
      ErrorStore.addError(error.message || 'Failed to generate avatar. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Your Avatar</Text>
      <Text style={styles.subtitle}>Create a unique avatar for {username}</Text>

      <View style={styles.avatarContainer}>
        {generatedAvatar ? (
          <Image source={{ uri: generatedAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Text style={styles.placeholderText}>No Avatar</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
        onPress={generateAvatar}
        disabled={isGenerating || !username}
      >
        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" size="small" />
            <Text style={styles.buttonText}>Generating...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            {generatedAvatar ? '🎨 Generate New Avatar' : '✨ Generate Avatar'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.rateLimit}>
        ⚡ Limited to 3 avatars every 3 minutes
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  placeholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  rateLimit: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default AvatarGenerator;