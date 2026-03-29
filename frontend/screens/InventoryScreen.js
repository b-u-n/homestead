import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Scroll from '../components/Scroll';
import { observer } from 'mobx-react-lite';
import InventoryStore from '../stores/InventoryStore';
import ErrorStore from '../stores/ErrorStore';
import FontSettingsStore from '../stores/FontSettingsStore';
import MinkyPanel from '../components/MinkyPanel';
import WoolButton from '../components/WoolButton';
import FlowEngine from '../components/FlowEngine';
import { pixelSketchFlow } from '../flows/pixelSketchFlow';
import { PixelThumbnail } from '../components/PixelEditor';
import SessionStore from '../stores/SessionStore';
import WebSocketService from '../services/websocket';

const SketchItem = observer(({ item, onOpen, onSubmit }) => (
  <TouchableOpacity
    style={styles.itemSlot}
    onPress={() => onOpen(item)}
    activeOpacity={0.7}
  >
    <MinkyPanel overlayColor="rgba(112, 68, 199, 0.15)" padding={4} borderRadius={8}>
      <View style={styles.sketchItemInner}>
        {item.data?.pixels ? (
          <PixelThumbnail
            pixels={item.data.pixels}
            width={item.data.width || 32}
            height={item.data.height || 32}
            size={56}
          />
        ) : (
          <View style={styles.emptySketchPlaceholder}>
            <Text style={styles.placeholderText}>New</Text>
          </View>
        )}
      </View>
    </MinkyPanel>
    <Text style={[styles.itemName, { fontSize: FontSettingsStore.getScaledFontSize(10) }]} numberOfLines={1}>
      {item.title || 'Sketch'}
    </Text>
    {onSubmit && item.data?.pixels && (
      <TouchableOpacity onPress={() => onSubmit(item)} style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Shop</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
));

const InventoryScreen = observer(({ navigation }) => {
  const [sketchFlowOpen, setSketchFlowOpen] = useState(false);
  const [activeSketchId, setActiveSketchId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!InventoryStore.loaded) {
      loadItems();
    }
  }, []);

  const loadItems = async () => {
    setLoading(true);
    await InventoryStore.loadFromServer();
    setLoading(false);
  };

  const handleCreateSketch = async () => {
    try {
      const item = await InventoryStore.createPixelSketch('New Sketch');
      setActiveSketchId(item._id);
      setSketchFlowOpen(true);
    } catch (err) {
      ErrorStore.addError(err.message || 'Failed to create sketch');
    }
  };

  const handleOpenSketch = (item) => {
    setActiveSketchId(item._id);
    setSketchFlowOpen(true);
  };

  const handleDeleteSketch = async (itemId) => {
    try {
      await InventoryStore.deleteItem(itemId);
    } catch (err) {
      ErrorStore.addError(err.message || 'Failed to delete sketch');
    }
  };

  const handleSubmitToShop = async (item, visibility = 'public') => {
    try {
      const data = await WebSocketService.emit('knapsack:items:submitToShop', {
        sessionId: SessionStore.sessionId,
        itemId: item._id,
        visibility,
      });
      ErrorStore.addError(data?.message || 'Submitted for review!');
    } catch (err) {
      ErrorStore.addError(err.message || 'Failed to submit');
    }
  };

  const sketches = InventoryStore.sketches;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: FontSettingsStore.getScaledFontSize(20) }]}>
          Knapsack
        </Text>
        <Text style={[styles.subtitle, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
          {InventoryStore.itemCount} item{InventoryStore.itemCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* New Sketch button */}
      <View style={styles.actionBar}>
        <WoolButton
          variant="purple"
          size="small"
          onPress={handleCreateSketch}
        >
          New Pixel Sketch
        </WoolButton>
      </View>

      {/* Items grid */}
      <Scroll style={styles.inventoryContainer} contentContainerStyle={styles.inventoryContent}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : InventoryStore.isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎒</Text>
            <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
              Your knapsack is empty
            </Text>
            <Text style={[styles.emptySubtext, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
              Create a pixel sketch to get started!
            </Text>
          </View>
        ) : (
          <View style={styles.inventoryGrid}>
            {sketches.map((item) => (
              <SketchItem
                key={item._id}
                item={item}
                onOpen={handleOpenSketch}
                onSubmit={handleSubmitToShop}
              />
            ))}
          </View>
        )}
      </Scroll>

      {/* Sketch editor flow */}
      <FlowEngine
        flowDefinition={pixelSketchFlow}
        visible={sketchFlowOpen}
        onClose={() => {
          setSketchFlowOpen(false);
          setActiveSketchId(null);
        }}
        initialContext={{
          sessionId: SessionStore.sessionId,
          itemId: activeSketchId
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontFamily: 'ChubbyTrail',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  subtitle: {
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionBar: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inventoryContainer: {
    flex: 1,
  },
  inventoryContent: {
    padding: 16,
  },
  loadingText: {
    fontFamily: 'Comfortaa',
    fontSize: 13,
    color: '#5C5A58',
    textAlign: 'center',
    padding: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemSlot: {
    width: 80,
    alignItems: 'center',
    gap: 4,
  },
  sketchItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  emptySketchPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: 'rgba(112, 68, 199, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'Comfortaa',
    fontSize: 10,
    color: '#7044C7',
  },
  itemName: {
    fontFamily: 'Comfortaa',
    color: '#454342',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontFamily: 'Comfortaa',
    color: '#5C5A58',
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptySubtext: {
    fontFamily: 'Comfortaa',
    color: '#999',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  submitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(112, 68, 199, 0.2)',
    marginTop: 2,
  },
  submitBtnText: {
    fontFamily: 'Comfortaa',
    fontSize: 9,
    color: '#7044C7',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default InventoryScreen;
