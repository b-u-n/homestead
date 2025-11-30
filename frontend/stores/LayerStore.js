import { makeAutoObservable, runInAction } from 'mobx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAYER_STORAGE_KEY = '@homestead:layer';

class LayerStore {
  currentLayer = null;
  layers = [];
  isLoading = false;
  hasSelectedLayer = false; // Track if user has selected a layer this session

  constructor() {
    makeAutoObservable(this);
    this.rehydrate();
  }

  setCurrentLayer(layer) {
    this.currentLayer = layer;
    this.hasSelectedLayer = true;
    this.persist();
  }

  setLayers(layers) {
    this.layers = layers;
  }

  setLoading(loading) {
    this.isLoading = loading;
  }

  clearLayer() {
    this.currentLayer = null;
    this.hasSelectedLayer = false;
    this.clearPersistedLayer();
  }

  /**
   * Get the default layer from the list
   */
  getDefaultLayer() {
    return this.layers.find(layer => layer.isDefault) || this.layers[0] || null;
  }

  /**
   * Persist layer selection to storage
   */
  async persist() {
    try {
      if (!this.currentLayer) return;

      const data = {
        layerId: this.currentLayer._id,
        layerName: this.currentLayer.name,
      };

      const jsonData = JSON.stringify(data);

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(LAYER_STORAGE_KEY, jsonData);
      } else if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(LAYER_STORAGE_KEY, jsonData);
      }
    } catch (error) {
      console.error('Error persisting layer:', error);
    }
  }

  /**
   * Rehydrate layer selection from storage
   */
  async rehydrate() {
    try {
      let data;

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(LAYER_STORAGE_KEY);
      } else if (Platform.OS !== 'web') {
        data = await AsyncStorage.getItem(LAYER_STORAGE_KEY);
      }

      if (data) {
        const parsed = JSON.parse(data);
        // Just store the ID for now - we'll fetch full layer data when connecting
        runInAction(() => {
          this.currentLayer = { _id: parsed.layerId, name: parsed.layerName };
        });
      }
    } catch (error) {
      console.error('Error rehydrating layer:', error);
    }
  }

  /**
   * Clear persisted layer data
   */
  async clearPersistedLayer() {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(LAYER_STORAGE_KEY);
      } else if (Platform.OS !== 'web') {
        await AsyncStorage.removeItem(LAYER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error clearing layer:', error);
    }
  }
}

export default new LayerStore();
