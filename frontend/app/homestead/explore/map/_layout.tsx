import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../../../services/websocket';
import LayerStore from '../../../../stores/LayerStore';

const MapLayout = observer(() => {
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const initConnection = async () => {
      // Connect websocket when entering map (handles page refresh)
      if (!WebSocketService.socket) {
        WebSocketService.connect();
      }

      // Wait for socket to be ready
      const waitForSocket = () => {
        return new Promise<void>((resolve) => {
          if (WebSocketService.socket?.connected) {
            resolve();
          } else {
            const checkInterval = setInterval(() => {
              if (WebSocketService.socket?.connected) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
            // Timeout after 5 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              resolve();
            }, 5000);
          }
        });
      };

      await waitForSocket();
      setIsConnecting(false);

      // Auto-join layer if not already in one
      if (!LayerStore.hasSelectedLayer) {
        try {
          const currentLayer = await WebSocketService.getCurrentLayer();
          if (currentLayer) {
            LayerStore.setCurrentLayer(currentLayer);
          } else {
            // No current layer — auto-join Hopeful (default)
            const layers = await WebSocketService.emit('layers:list');
            const hopeful = layers?.find((l: any) => l.name === 'Hopeful') || layers?.[0];
            if (hopeful) {
              const joined = await WebSocketService.joinLayer(hopeful._id);
              LayerStore.setCurrentLayer(joined);
            }
          }
        } catch (err) {
          console.error('Failed to auto-join layer:', err);
        }
      }
    };

    initConnection();
  }, []);

  // Show loading while connecting
  if (isConnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DE86DF" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontFamily: 'Comfortaa',
    fontSize: 16,
    color: '#403F3E',
    marginTop: 10,
  },
});

export default MapLayout;
