import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,  } from 'react-native';
import Scroll from './Scroll';
import { observer } from 'mobx-react-lite';
import { generateUsername, getWordArrays, createCustomUsername } from '../utils/username';

const UsernameSelector = observer(({ onUsernameSelect, initialUsername = null }) => {
  const [selectedAdjective, setSelectedAdjective] = useState('');
  const [selectedAdverb, setSelectedAdverb] = useState('');
  const [selectedNoun, setSelectedNoun] = useState('');
  const [wordArrays, setWordArrays] = useState({ adjectives: [], adverbs: [], nouns: [] });

  useEffect(() => {
    const arrays = getWordArrays();
    setWordArrays(arrays);

    if (initialUsername) {
      // Try to parse existing username (this is approximate)
      setSelectedAdjective(arrays.adjectives[0]);
      setSelectedAdverb(arrays.adverbs[0]);
      setSelectedNoun(arrays.nouns[0]);
    } else {
      // Generate random selection
      setSelectedAdjective(arrays.adjectives[Math.floor(Math.random() * arrays.adjectives.length)]);
      setSelectedAdverb(arrays.adverbs[Math.floor(Math.random() * arrays.adverbs.length)]);
      setSelectedNoun(arrays.nouns[Math.floor(Math.random() * arrays.nouns.length)]);
    }
  }, [initialUsername]);

  useEffect(() => {
    if (selectedAdjective && selectedAdverb && selectedNoun) {
      const username = createCustomUsername(selectedAdjective, selectedAdverb, selectedNoun);
      onUsernameSelect(username);
    }
  }, [selectedAdjective, selectedAdverb, selectedNoun, onUsernameSelect]);

  const handleRandomize = () => {
    setSelectedAdjective(wordArrays.adjectives[Math.floor(Math.random() * wordArrays.adjectives.length)]);
    setSelectedAdverb(wordArrays.adverbs[Math.floor(Math.random() * wordArrays.adverbs.length)]);
    setSelectedNoun(wordArrays.nouns[Math.floor(Math.random() * wordArrays.nouns.length)]);
  };

  const renderWordSelector = (title, words, selected, onSelect) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>
      <Scroll horizontal showsHorizontalScrollIndicator={false} style={styles.wordScroll}>
        {words.map((word) => (
          <TouchableOpacity
            key={word}
            style={[styles.wordButton, selected === word && styles.wordButtonSelected]}
            onPress={() => onSelect(word)}
          >
            <Text style={[styles.wordText, selected === word && styles.wordTextSelected]}>
              {word}
            </Text>
          </TouchableOpacity>
        ))}
      </Scroll>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Username</Text>
      
      <View style={styles.previewContainer}>
        <Text style={styles.preview}>
          {selectedAdjective}{selectedAdverb}{selectedNoun}
        </Text>
      </View>

      {renderWordSelector('Adjective', wordArrays.adjectives, selectedAdjective, setSelectedAdjective)}
      {renderWordSelector('Adverb', wordArrays.adverbs, selectedAdverb, setSelectedAdverb)}
      {renderWordSelector('Noun', wordArrays.nouns, selectedNoun, setSelectedNoun)}

      <TouchableOpacity style={styles.randomButton} onPress={handleRandomize}>
        <Text style={styles.randomButtonText}>🎲 Randomize</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  preview: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  wordScroll: {
    maxHeight: 50,
  },
  wordButton: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  wordButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  wordText: {
    fontSize: 14,
    color: '#333',
  },
  wordTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  randomButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  randomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UsernameSelector;