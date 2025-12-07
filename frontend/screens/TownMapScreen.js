import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Scroll from '../components/Scroll';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import RoomStore from '../stores/RoomStore';
import WebSocketService from '../services/websocket';
import KnapsackIcon from '../components/KnapsackIcon';
import WoolButton from '../components/WoolButton';

const TownMapScreen = observer(() => {
  const router = useRouter();
  const [rooms] = useState([
    { id: '1', name: 'Community Center', type: 'community' },
    { id: '2', name: 'Town Square', type: 'community' },
    { id: '3', name: 'Weeping Willows', type: 'nature' },
    { id: '4', name: 'Sugarbee Cafe', type: 'community' },
  ]);

  useEffect(() => {
    WebSocketService.connect();
    // TODO: Load actual rooms from server
    // WebSocketService.getRooms();
  }, []);

  const handleRoomPress = (room) => {
    router.push({ pathname: `/homestead/explore/rooms/${room.name.toLowerCase().replace(/\s+/g, '-')}`, params: { roomId: room.id, roomName: room.name } });
  };

  const handleCreateRoom = () => {
    // TODO: Implement create room screen
    console.log('Create room not implemented yet');
  };

  return (
    <View style={styles.container}>
      <KnapsackIcon />
      
      <Text style={styles.title}>Town Map</Text>
      <Text style={styles.subtitle}>Choose a room to explore</Text>
      
      <Scroll style={styles.roomList}>
        {rooms.map((room) => (
          <TouchableOpacity
            key={room.id}
            style={styles.roomCard}
            onPress={() => handleRoomPress(room)}
          >
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomType}>{room.type}</Text>
          </TouchableOpacity>
        ))}
      </Scroll>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateRoom}>
        <Text style={styles.createButtonText}>+ Create New Room</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  roomList: {
    flex: 1,
  },
  roomCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
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
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  roomType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TownMapScreen;