import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { observer } from 'mobx-react-lite';
import InventoryStore from '../stores/InventoryStore';
import ErrorStore from '../stores/ErrorStore';

const InventoryItem = observer(({ item, index, onUse, onMove }) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#8E8E93';
      case 'rare': return '#007AFF';
      case 'epic': return '#9500FF';
      case 'legendary': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const handleUse = () => {
    if (item.type === 'consumable') {
      Alert.alert(
        'Use Item',
        `Use ${item.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use', onPress: () => onUse(item.id) }
        ]
      );
    } else {
      ErrorStore.addError(`${item.name} cannot be used here`);
    }
  };

  return (
    <TouchableOpacity style={styles.itemSlot} onPress={handleUse} activeOpacity={0.7}>
      <View style={[styles.itemBorder, { borderColor: getRarityColor(item.rarity) }]}>
        <Text style={styles.itemIcon}>{item.icon}</Text>
        {item.quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>
        )}
      </View>
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );
});

const EmptySlot = () => (
  <View style={styles.emptySlot}>
    <View style={styles.emptySlotInner} />
  </View>
);

const InventoryScreen = observer(({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('all');

  const handleUseItem = (itemId) => {
    const success = InventoryStore.useItem(itemId);
    if (success) {
      ErrorStore.addError('Item used!', 2000);
    }
  };

  const getFilteredItems = () => {
    if (selectedTab === 'all') return InventoryStore.items;
    return InventoryStore.getItemsByType(selectedTab);
  };

  const renderInventoryGrid = () => {
    const filteredItems = getFilteredItems();
    const slots = [];
    
    // Add items
    filteredItems.forEach((item, index) => {
      slots.push(
        <InventoryItem 
          key={item.id} 
          item={item} 
          index={index}
          onUse={handleUseItem}
        />
      );
    });
    
    // Fill remaining slots if showing all items
    if (selectedTab === 'all') {
      const remainingSlots = InventoryStore.maxSlots - InventoryStore.items.length;
      for (let i = 0; i < remainingSlots; i++) {
        slots.push(<EmptySlot key={`empty-${i}`} />);
      }
    }
    
    return slots;
  };

  const tabs = [
    { id: 'all', name: 'All', icon: '📦' },
    { id: 'tool', name: 'Tools', icon: '🔧' },
    { id: 'consumable', name: 'Items', icon: '🧪' },
    { id: 'key', name: 'Keys', icon: '🗝️' },
    { id: 'food', name: 'Food', icon: '🍎' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>
          {InventoryStore.itemCount}/{InventoryStore.maxSlots} slots
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.tabActive]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.inventoryContainer} contentContainerStyle={styles.inventoryContent}>
        <View style={styles.inventoryGrid}>
          {renderInventoryGrid()}
        </View>
      </ScrollView>

      {InventoryStore.isEmpty && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎒</Text>
          <Text style={styles.emptyText}>Your inventory is empty</Text>
          <Text style={styles.emptySubtext}>Explore the world to find items!</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    minWidth: 70,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
  },
  inventoryContainer: {
    flex: 1,
  },
  inventoryContent: {
    padding: 20,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemSlot: {
    width: '18%',
    aspectRatio: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  itemBorder: {
    width: '100%',
    height: '80%',
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemIcon: {
    fontSize: 24,
  },
  itemName: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    color: '#333',
  },
  quantityBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptySlot: {
    width: '18%',
    aspectRatio: 1,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotInner: {
    width: '80%',
    height: '80%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#f9f9f9',
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});

export default InventoryScreen;