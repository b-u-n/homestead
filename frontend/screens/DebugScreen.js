import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import VaporwaveButton from '../components/VaporwaveButton';
import { Colors } from '../constants/colors';

const DebugScreen = ({ navigation }) => {
  const data = Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Item ${i + 1}` }));
  
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.text}</Text>
    </View>
  );
  
  const renderHeader = () => (
    <View>
      <Text style={styles.title}>Debug Screen</Text>
      <Text style={styles.subtitle}>Testing scrolling functionality</Text>
      
      {/* Dedicated scroll window test */}
      <View style={styles.scrollTestContainer}>
        <Text style={styles.testTitle}>Scroll Test Window</Text>
        <ScrollView style={styles.scrollTestWindow}>
          {Array.from({ length: 50 }, (_, i) => (
            <View key={i} style={styles.scrollTestItem}>
              <Text style={styles.scrollTestItemText}>Scroll Test Item {i + 1}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
  
  const renderFooter = () => (
    <VaporwaveButton
      title="Back to Avatar"
      onPress={() => navigation.goBack()}
      variant="primary"
      style={styles.backButton}
    />
  );
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollTestWindow}>
        <View style={styles.content}>
          <Text style={styles.title}>Debug Screen</Text>
          <Text style={styles.subtitle}>Testing scrolling functionality</Text>
          
          {Array.from({ length: 100 }, (_, i) => (
            <View key={i} style={styles.scrollTestItem}>
              <Text style={styles.scrollTestItemText}>Item {i + 1}</Text>
            </View>
          ))}
          
          <VaporwaveButton
            title="Back to Avatar"
            onPress={() => navigation.goBack()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
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
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  item: {
    width: '100%',
    padding: 20,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 60,
  },
  itemText: {
    color: Colors.text.primary,
    fontSize: 16,
  },
  backButton: {
    marginTop: 30,
  },
  scrollTestContainer: {
    marginTop: 20,
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  testTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollTestWindow: {
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  scrollText: {
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  scrollTestItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  scrollTestItemText: {
    color: Colors.text.primary,
    fontSize: 14,
  },
  mainScrollArea: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginVertical: 20,
  },
});

export default DebugScreen;