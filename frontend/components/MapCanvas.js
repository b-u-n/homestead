import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import inventoryStore from '../stores/InventoryStore';
import profileStore from '../stores/ProfileStore';
import UserStatus from './UserStatus';
import VaporwaveButton from './VaporwaveButton';
// Import sections
import townSquare from '../locations/sections/town-square';
import marketplace from '../locations/sections/marketplace';
import playerHousing from '../locations/sections/player-housing';
import forest from '../locations/sections/forest';
import garden from '../locations/sections/garden';

// Import rooms
import library from '../locations/rooms/library';
import coffeeShop from '../locations/rooms/coffee-shop';

// Import images
const knapsackImage = require('../assets/images/knapsack.png');

// Location lookup object (includes both sections and rooms)
const LOCATIONS = {
  // Sections
  'town-square': townSquare,
  'marketplace': marketplace,
  'player-housing': playerHousing,
  'forest': forest,
  'garden': garden,
  // Rooms
  'library': library,
  'coffee-shop': coffeeShop,
};

const MapCanvas = ({ location }) => {
  const canvasRef = useRef(null);
  const router = useRouter();
  const [roomData, setRoomData] = useState(null);
  const [hoveredObject, setHoveredObject] = useState(null);

  // Load location data (section or room)
  useEffect(() => {
    const loadLocation = () => {
      const locationFn = LOCATIONS[location];

      if (locationFn) {
        // Call location function with canvas dimensions
        const width = Platform.OS === 'web' ? window.innerWidth : 800;
        const height = Platform.OS === 'web' ? window.innerHeight : 600;
        const locationData = typeof locationFn === 'function' ? locationFn(width, height) : locationFn;

        setRoomData(locationData);

        // Save to localStorage - ensure location is a string
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined' && typeof location === 'string') {
          localStorage.setItem('lastMapLocation', location);
        }
      } else {
        console.error(`Failed to load location: ${location}`);
        // Fallback to town square if location doesn't exist
        if (location !== 'town-square') {
          router.replace('/homestead/explore/map/town-square');
        }
      }
    };

    loadLocation();
  }, [location]);

  // Draw canvas
  useEffect(() => {
    if (roomData && Platform.OS === 'web') {
      drawCanvas();
    }
  }, [roomData, hoveredObject]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas (make transparent)
    ctx.clearRect(0, 0, width, height);

    if (!roomData) return;

    // Helper function to draw a button/entity
    const drawButton = (obj) => {
      const isHovered = hoveredObject === obj.id;

      // Draw button background
      ctx.fillStyle = isHovered ? 'rgba(179, 230, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

      // Draw dashed border
      ctx.strokeStyle = 'rgba(92, 90, 88, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      ctx.setLineDash([]);

      // Draw label
      ctx.fillStyle = '#403F3E';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(obj.label, obj.x + obj.width / 2, obj.y + obj.height / 2 + 5);
    };

    // Draw back button (for rooms)
    if (roomData.backButton) {
      drawButton(roomData.backButton);
    }

    // Draw navigation buttons (section-to-section)
    if (roomData.navigation) {
      roomData.navigation.forEach(drawButton);
    }

    // Draw doors (room entrances in sections)
    if (roomData.doors) {
      roomData.doors.forEach(drawButton);
    }

    // Draw entities (interactive objects)
    if (roomData.entities) {
      roomData.entities.forEach(drawButton);
    }
  };

  const handleCanvasClick = (event) => {
    if (!roomData || Platform.OS !== 'web') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Collect all clickable objects
    const allObjects = [
      roomData.backButton,
      ...(roomData.navigation || []),
      ...(roomData.doors || []),
      ...(roomData.entities || [])
    ].filter(Boolean);

    // Check if click is on an object
    for (const obj of allObjects) {
      if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
        if (obj.navigateTo) {
          // Ensure navigateTo is a string and use replace for client-side navigation
          const navPath = typeof obj.navigateTo === 'string' ? obj.navigateTo : obj.navigateTo.pathname || obj.navigateTo.path;
          if (navPath) {
            router.replace(navPath);
          }
        } else if (obj.description) {
          alert(obj.description); // TODO: Replace with modal
        }
        break;
      }
    }
  };

  const handleCanvasMouseMove = (event) => {
    if (!roomData || Platform.OS !== 'web') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let foundHover = null;

    // Collect all hoverable objects
    const allObjects = [
      roomData.backButton,
      ...(roomData.navigation || []),
      ...(roomData.doors || []),
      ...(roomData.entities || [])
    ].filter(Boolean);

    // Check if mouse is over an object
    for (const obj of allObjects) {
      if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
        foundHover = obj.id;
        canvas.style.cursor = 'pointer';
        break;
      }
    }

    if (!foundHover) {
      canvas.style.cursor = 'default';
    }

    if (foundHover !== hoveredObject) {
      setHoveredObject(foundHover);
    }
  };

  const handleKnapsackClick = () => {
    inventoryStore.toggleInventory();
  };

  const handleSaveClick = () => {
    // TODO: Implement actual save functionality
    // For now, just log that save was clicked
    console.log('Save clicked - saving profile and inventory data');
    alert('Game saved!');
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <style>{`
          button:hover {
            transform: scale(1.06) !important;
          }
        `}</style>
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          style={{ display: 'block', background: 'transparent' }}
        />
        {roomData && (
          <View style={styles.titleOverlay}>
            <Text style={styles.roomTitle}>{roomData.name}</Text>
          </View>
        )}
        <UserStatus />
        <View style={styles.saveButtonContainer}>
          <VaporwaveButton
            title="Save"
            onPress={handleSaveClick}
            variant="primary"
            style={styles.saveButton}
          />
        </View>
        {inventoryStore.isOpen && (
          <View style={styles.inventoryPanel}>
            <View style={styles.inventoryHeader}>
              <Text style={styles.inventoryTitle}>Knapsack</Text>
              <button onClick={() => inventoryStore.closeInventory()} style={styles.closeButton}>
                ✕
              </button>
            </View>
            <View style={styles.inventoryGrid}>
              {inventoryStore.items.map((item, index) => (
                <View key={item.uniqueId || `${item.itemId}-${index}`} style={styles.inventorySlot}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.quantity > 1 && (
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  )}
                </View>
              ))}
              {/* Empty slots */}
              {Array.from({ length: inventoryStore.maxSlots - inventoryStore.items.length }).map((_, index) => (
                <View key={`empty-${index}`} style={[styles.inventorySlot, styles.emptySlot]} />
              ))}
            </View>
          </View>
        )}
        <View style={styles.knapsackContainer}>
          <button onClick={handleKnapsackClick} style={styles.knapsackButton}>
            <img
              src={typeof knapsackImage === 'string' ? knapsackImage : knapsackImage.default || knapsackImage.uri || knapsackImage}
              alt="Knapsack"
              style={{ width: 72, height: 72, display: 'block' }}
            />
          </button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Map canvas is only available on web</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  titleOverlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  roomTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#5C5A58',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  saveButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 30,
    zIndex: 100,
  },
  saveButton: {
    minWidth: 120,
  },
  knapsackContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  knapsackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '3px solid rgba(92, 90, 88, 0.55)',
    borderRadius: 12,
    padding: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryPanel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '3px solid rgba(92, 90, 88, 0.55)',
    borderRadius: 12,
    padding: 20,
    minWidth: 500,
    maxWidth: 600,
    maxHeight: '80%',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(92, 90, 88, 0.3)',
  },
  inventoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5C5A58',
  },
  closeButton: {
    fontSize: 24,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#5C5A58',
    cursor: 'pointer',
    padding: 5,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inventorySlot: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(222, 134, 223, 0.15)',
    border: '2px dashed rgba(92, 90, 88, 0.35)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  emptySlot: {
    backgroundColor: 'rgba(92, 90, 88, 0.05)',
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 10,
    color: '#5C5A58',
    textAlign: 'center',
    fontWeight: '600',
  },
  itemQuantity: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5C5A58',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  message: {
    fontSize: 16,
    color: '#5C5A58',
  },
});

export default observer(MapCanvas);
