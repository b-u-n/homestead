import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Scroll from '../components/Scroll';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import RoomStore from '../stores/RoomStore';
import AuthStore from '../stores/AuthStore';
import KnapsackIcon from '../components/KnapsackIcon';

const RoomScreen = observer(() => {
  const router = useRouter();
  const { roomId, roomName } = useLocalSearchParams();
  const [items, setItems] = useState([
    { id: '1', name: 'Welcome Sign', x: 50, y: 100 },
    { id: '2', name: 'Chat Board', x: 200, y: 150 },
  ]);

  useEffect(() => {
    // TODO: Load room data and join room
    // WebSocketService.joinRoom(roomId);
  }, [roomId, roomName]);

  const handleItemPress = (item) => {
    console.log('Item pressed:', item);
  };

  const handleAddItem = () => {
    console.log('Add item');
  };

  return (
    <View style={styles.container}>
      <KnapsackIcon />
      
      <View style={styles.header}>
        <Text style={styles.roomTitle}>{roomName}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.mapItem, { left: item.x, top: item.y }]}
            onPress={() => handleItemPress(item)}
          >
            <Text style={styles.itemText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomPanel}>
        <Text style={styles.panelTitle}>Room Info</Text>
        <Text style={styles.panelText}>Click items on the map to interact</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  roomTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#e8f4fd',
    position: 'relative',
  },
  mapItem: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomPanel: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  panelText: {
    fontSize: 14,
    color: '#666',
  },
});

export default RoomScreen;