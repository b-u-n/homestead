import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import InventoryStore from '../stores/InventoryStore';

const KnapsackIcon = observer(({ navigation, style = {} }) => {
  const handlePress = () => {
    navigation.navigate('Inventory');
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.knapsack}>
        <Text style={styles.icon}>🎒</Text>
        
        {InventoryStore.itemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {InventoryStore.itemCount > 99 ? '99+' : InventoryStore.itemCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
  },
  knapsack: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});

export default KnapsackIcon;