import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../../../services/websocket';
import LayerStore from '../../../../stores/LayerStore';
import LayerSelectModal from '../../../../components/LayerSelectModal';

const MapLayout = observer(() => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [showLayerModal, setShowLayerModal] = useState(false);

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

      // Check if user needs to select a layer
      if (!LayerStore.hasSelectedLayer) {
        // Try to restore from saved layer
        try {
          const currentLayer = await WebSocketService.getCurrentLayer();
          if (currentLayer) {
            LayerStore.setCurrentLayer(currentLayer);
          } else {
            // No current layer, show selection modal
            setShowLayerModal(true);
          }
        } catch (err) {
          console.error('Failed to get current layer:', err);
          setShowLayerModal(true);
        }
      }
    };

    initConnection();
  }, []);

  const handleLayerSelected = (layer: any) => {
    setShowLayerModal(false);
  };

  // Show loading while connecting
  if (isConnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DE86DF" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }

  // Show layer selection if no layer selected
  if (showLayerModal || !LayerStore.hasSelectedLayer) {
    return (
      <View style={styles.container}>
        <LayerSelectModal
          visible={true}
          onClose={() => {
            // If they close without selecting, use default
            const defaultLayer = LayerStore.getDefaultLayer();
            if (defaultLayer) {
              WebSocketService.joinLayer(defaultLayer._id).then((layer) => {
                LayerStore.setCurrentLayer(layer);
                setShowLayerModal(false);
              });
            }
          }}
          onLayerSelected={handleLayerSelected}
        />
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
