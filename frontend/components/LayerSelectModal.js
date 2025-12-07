import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import WoolButton from './WoolButton';
import WebSocketService from '../services/websocket';
import LayerStore from '../stores/LayerStore';

const LayerSelectModal = observer(({ visible, onClose, onLayerSelected }) => {
  const [layers, setLayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningLayerId, setJoiningLayerId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      loadLayers();
    }
  }, [visible]);

  const loadLayers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const layersList = await WebSocketService.listLayers();
      setLayers(layersList);
      LayerStore.setLayers(layersList);
    } catch (err) {
      console.error('Failed to load layers:', err);
      setError('Failed to load layers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLayer = async (layerId) => {
    if (joiningLayerId) return;

    setJoiningLayerId(layerId);
    setError(null);
    try {
      const layer = await WebSocketService.joinLayer(layerId);
      LayerStore.setCurrentLayer(layer);
      onLayerSelected?.(layer);
      onClose();
    } catch (err) {
      console.error('Failed to join layer:', err);
      setError(err.message || 'Failed to join layer');
    } finally {
      setJoiningLayerId(null);
    }
  };

  const getPlayerCountText = (count) => {
    if (count === 0) return 'Empty';
    if (count === 1) return '1 player';
    return `${count} players`;
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Select Layer"
      zIndex={5000}
      showClose={false}
    >
      <View style={styles.container}>
        <Text style={styles.description}>
          Choose a layer to join. Players on different layers cannot see each other.
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DE86DF" />
            <Text style={styles.loadingText}>Loading layers...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <WoolButton
              title="Retry"
              onPress={loadLayers}
              variant="secondary"
              style={styles.retryButton}
            />
          </View>
        ) : (
          <View style={styles.layerList}>
            {layers.map((layer) => (
              <WoolButton
                key={layer._id}
                title={joiningLayerId === layer._id ? "Joining..." : `${layer.name} (${getPlayerCountText(layer.playerCount)})`}
                onPress={() => handleSelectLayer(layer._id)}
                variant="secondary"
                disabled={joiningLayerId !== null}
                style={styles.layerButton}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  description: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#403F3E',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#403F3E',
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Comfortaa',
    fontSize: 14,
    color: '#C04040',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    minWidth: 100,
  },
  layerList: {
    gap: 10,
  },
  layerButton: {
    marginVertical: 5,
  },
});

export default LayerSelectModal;
