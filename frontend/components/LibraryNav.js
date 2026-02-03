import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SoundManager from '../services/SoundManager';

const LIBRARY_ROOMS = [
  { id: 'library', label: 'Main Lobby', description: 'Anxiety, Depression, Stress, Emotions' },
  { id: 'library-recovery', label: 'Recovery', description: 'ADHD, Trauma, Grief, Burnout' },
  { id: 'library-balance', label: 'Finding Balance', description: 'Anger, Impulses, Self, Accountability' },
  { id: 'library-connection', label: 'Connection', description: 'Attachment, Boundaries, Loneliness' },
];

const LibraryNav = ({ currentRoom }) => {
  const router = useRouter();

  const handleRoomPress = (roomId) => {
    if (roomId !== currentRoom) {
      SoundManager.play('nextPage');
      router.push(`/homestead/explore/map/${roomId}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>~ SECTIONS ~</Text>
      </View>

      {/* Room list */}
      <View style={styles.roomList}>
        {LIBRARY_ROOMS.map((room, index) => {
          const isCurrent = room.id === currentRoom;
          return (
            <Pressable
              key={room.id}
              style={[
                styles.roomEntry,
                isCurrent && styles.roomEntryCurrent,
              ]}
              onPress={() => handleRoomPress(room.id)}
              disabled={isCurrent}
            >
              <View style={styles.roomHeader}>
                <Text style={[styles.roomNumber, isCurrent && styles.textCurrent]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={[styles.roomLabel, isCurrent && styles.textCurrent]}>
                  {room.label}
                </Text>
              </View>
              <Text style={[styles.roomDescription, isCurrent && styles.descriptionCurrent]}>
                {room.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: '-50%' }],
    width: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    borderStyle: 'dashed',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    userSelect: 'none',
    zIndex: 100,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92, 90, 88, 0.2)',
    marginBottom: 6,
  },
  headerText: {
    fontFamily: 'Comfortaa',
    fontSize: 11,
    color: '#5C5A58',
    letterSpacing: 3,
  },
  roomList: {
    gap: 2,
  },
  roomEntry: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  roomEntryCurrent: {
    backgroundColor: 'rgba(179, 230, 255, 0.35)',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  roomNumber: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: 'rgba(92, 90, 88, 0.4)',
    width: 18,
  },
  roomLabel: {
    fontFamily: 'SuperStitch',
    fontSize: 15,
    color: '#403F3E',
    opacity: 0.8,
  },
  textCurrent: {
    color: '#2a7d9c',
  },
  roomDescription: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: 'rgba(92, 90, 88, 0.6)',
    marginLeft: 26,
  },
  descriptionCurrent: {
    color: 'rgba(42, 125, 156, 0.7)',
  },
});

export default LibraryNav;
