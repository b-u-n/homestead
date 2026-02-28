import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, Image, Pressable } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import ErrorStore from '../../stores/ErrorStore';
import FormStore from '../../stores/FormStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import WoolButton from '../WoolButton';
import ScrollBarView from '../ScrollBarView';
import UXStore from '../../stores/UXStore';

const STORE_TYPES = [
  { value: 'map-sprite', label: 'Map Sprite' },
];

const ATTRIBUTION_LABELS = {
  'real-name': 'Real name & contact info',
  'username': 'Username',
  'none': 'No attribution',
};

const BazaarSubmit = observer(({
  input,
  context,
  accumulatedData,
  updateAccumulatedData,
  onComplete,
  onBack,
  canGoBack
}) => {
  const formKey = 'bazaar:newPost';
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [savedPreferences, setSavedPreferences] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Read selected platform asset from accumulatedData (set by asset catalog or asset picker)
  const platformAssetId = accumulatedData?.['drawingBoard:assetCatalog']?.platformAssetId ||
                           accumulatedData?.['drawingBoard:assetPicker']?.platformAssetId ||
                           null;
  const assetName = accumulatedData?.['drawingBoard:assetCatalog']?.assetName ||
                    accumulatedData?.['drawingBoard:assetPicker']?.assetName ||
                    null;

  const title = FormStore.getField(formKey, 'title') || '';
  const description = FormStore.getField(formKey, 'description') || '';
  const storeType = FormStore.getField(formKey, 'storeType') || 'map-sprite';
  const tags = FormStore.getField(formKey, 'tags') || '';
  const note = FormStore.getField(formKey, 'note') || '';

  const setField = (field, value) => FormStore.setField(formKey, field, value);

  // Web uses raw HTML inputs (textarea/input) because React Native Web's
  // TextInput has focus issues inside modals. See readme/TEXTBOX.md.
  const webInputStyle = {
    fontFamily: 'Comfortaa',
    fontSize: FontSettingsStore.getScaledFontSize(14),
    color: FontSettingsStore.getFontColor('#2D2C2B'),
    padding: 8,
    borderRadius: 6,
    border: '1px solid rgba(92, 90, 88, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    const fetchPreferences = async () => {
      try {
        if (!WebSocketService.socket) { setLoadingPrefs(false); return; }
        const result = await WebSocketService.emit('copyrightPreferences:get', {
          sessionId: SessionStore.sessionId
        });
        if (result?.preferences) {
          setSavedPreferences(result.preferences);
        }
      } catch (err) {
        // Non-critical
      } finally {
        setLoadingPrefs(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleImagePick = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      ErrorStore.addError('Image must be 5MB or less');
      return;
    }

    if (file.type !== 'image/png' && file.type !== 'image/gif') {
      ErrorStore.addError('Please select a PNG or GIF file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setImageData(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      ErrorStore.addError('Please enter a title');
      return;
    }
    if (!imageData) {
      ErrorStore.addError('Please select an image');
      return;
    }
    if (!WebSocketService.socket) {
      ErrorStore.addError('WebSocket not connected');
      return;
    }

    const formData = {
      sessionId: SessionStore.sessionId,
      title: title.trim(),
      description: description.trim(),
      storeType,
      mediaType: 'image',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      platformAssetId,
      content: imageData,
      note: note.trim() || undefined,
    };

    // If user has saved preferences, submit directly using them
    if (savedPreferences) {
      try {
        setSubmitting(true);
        const copyright = {
          ipConfirmed: true,
          authorizeAdvertising: savedPreferences.authorizeAdvertising || false,
          attribution: savedPreferences.attribution || 'username',
          realName: savedPreferences.attribution === 'real-name' ? savedPreferences.realName : undefined,
          contactInfo: savedPreferences.attribution === 'real-name' ? savedPreferences.contactInfo : undefined,
          attributionLink: savedPreferences.attributionLink || undefined,
        };
        const result = await WebSocketService.emit('bazaar:submission:create', {
          ...formData,
          copyright,
        });
        if (result) {
          FormStore.resetForm('bazaar:newPost');
          onComplete({ action: 'submitted' });
        }
      } catch (error) {
        ErrorStore.addError(error.message || 'Failed to submit');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // No saved preferences — route to copyright confirm drop
    onComplete({
      action: 'confirmCopyright',
      formData,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollBarView ref={scrollRef} style={styles.scrollContainer}>
        {/* Platform asset reference */}
        <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(112, 68, 199, 0.2)">
          {platformAssetId ? (
            <View style={styles.assetRefRow}>
              <Text style={[styles.assetRefText, {
                fontSize: FontSettingsStore.getScaledFontSize(13),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                Replacing: {assetName || platformAssetId}
              </Text>
              <View style={styles.assetRefButtons}>
                <WoolButton variant="secondary" size="small" onPress={() => onComplete({ action: 'replaceAsset' })}>
                  Change
                </WoolButton>
                <WoolButton variant="secondary" size="small" onPress={() => {
                  updateAccumulatedData({
                    'drawingBoard:assetCatalog': { ...accumulatedData?.['drawingBoard:assetCatalog'], platformAssetId: null, assetName: null },
                    'drawingBoard:assetPicker': { ...accumulatedData?.['drawingBoard:assetPicker'], platformAssetId: null, assetName: null },
                  });
                }}>
                  Clear
                </WoolButton>
              </View>
            </View>
          ) : (
            <View style={styles.assetRefRow}>
              <Text style={[styles.assetRefText, {
                fontSize: FontSettingsStore.getScaledFontSize(13),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                Proposing a replacement for an existing asset?
              </Text>
              <WoolButton variant="blue" size="small" onPress={() => onComplete({ action: 'replaceAsset' })}>
                Browse Assets
              </WoolButton>
            </View>
          )}
        </MinkyPanel>

        <View style={{ height: 12 }} />

        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          {/* Image picker */}
          <Text style={[styles.label, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Image *</Text>

          {imagePreview && (
            <img
              src={imagePreview}
              style={{
                alignSelf: 'center',
                maxWidth: '100%',
                maxHeight: 240,
                borderRadius: 10,
                border: '2px dashed rgba(112, 68, 199, 0.5)',
                marginBottom: 10,
                display: 'block',
              }}
            />
          )}

          <View style={styles.pickButtonRow}>
            <WoolButton variant="blue" size="small" onPress={handleImagePick}>
              {imagePreview ? 'Change Image' : 'Choose Image'}
            </WoolButton>
          </View>

          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          )}

          {/* Title */}
          <Text style={[styles.label, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Title *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Give your submission a title"
              maxLength={100}
              style={webInputStyle}
            />
          ) : (
            <TextInput
              style={[styles.input, {
                fontSize: FontSettingsStore.getScaledFontSize(14),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}
              placeholder="Give your submission a title"
              placeholderTextColor="rgba(92, 90, 88, 0.5)"
              value={title}
              onChangeText={(v) => setField('title', v)}
              maxLength={100}
            />
          )}

          {/* Description */}
          <Text style={[styles.label, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Description</Text>
          {Platform.OS === 'web' ? (
            <textarea
              value={description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Describe your submission"
              maxLength={2000}
              style={{ ...webInputStyle, minHeight: 80, resize: 'none' }}
            />
          ) : (
            <TextInput
              style={[styles.input, styles.textArea, {
                fontSize: FontSettingsStore.getScaledFontSize(14),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}
              placeholder="Describe your submission"
              placeholderTextColor="rgba(92, 90, 88, 0.5)"
              value={description}
              onChangeText={(v) => setField('description', v)}
              maxLength={2000}
              multiline
            />
          )}

          {/* Type picker */}
          <Text style={[styles.label, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Type</Text>
          <View style={styles.typePicker}>
            {STORE_TYPES.map(st => (
              <WoolButton
                key={st.value}
                variant="secondary"
                focused={storeType === st.value}
                size="small"
                onPress={() => setField('storeType', st.value)}
              >
                {st.label}
              </WoolButton>
            ))}
          </View>

          {/* Tags */}
          <Text style={[styles.label, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Tags (comma-separated)</Text>
          {Platform.OS === 'web' ? (
            <input
              type="text"
              value={tags}
              onChange={(e) => setField('tags', e.target.value)}
              placeholder="e.g. nature, cozy, spring"
              style={webInputStyle}
            />
          ) : (
            <TextInput
              style={[styles.input, {
                fontSize: FontSettingsStore.getScaledFontSize(14),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}
              placeholder="e.g. nature, cozy, spring"
              placeholderTextColor="rgba(92, 90, 88, 0.5)"
              value={tags}
              onChangeText={(v) => setField('tags', v)}
            />
          )}

          {/* Note */}
          <Text style={[styles.label, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>Note for reviewer</Text>
          {Platform.OS === 'web' ? (
            <input
              type="text"
              value={note}
              onChange={(e) => setField('note', e.target.value)}
              placeholder="Any context for the reviewer"
              maxLength={1000}
              style={webInputStyle}
            />
          ) : (
            <TextInput
              style={[styles.input, {
                fontSize: FontSettingsStore.getScaledFontSize(14),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}
              placeholder="Any context for the reviewer"
              placeholderTextColor="rgba(92, 90, 88, 0.5)"
              value={note}
              onChangeText={(v) => setField('note', v)}
              maxLength={1000}
            />
          )}

          {/* Submit */}
          <View style={styles.submitRow}>
            <WoolButton variant="purple" onPress={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </WoolButton>
          </View>
        </MinkyPanel>

        {/* Submission Preferences (shown when user has saved copyright prefs) */}
        {!loadingPrefs && savedPreferences && (
          <>
            <View style={{ height: 12 }} />
            <Pressable onPress={() => UXStore.requestModal('userSettings')}>
              <MinkyPanel borderRadius={8} padding={12} paddingTop={12}>
                <Text style={[styles.prefsTitle, {
                  fontSize: FontSettingsStore.getScaledFontSize(13),
                  color: FontSettingsStore.getFontColor('#2D2C2B')
                }]}>Submission Preferences</Text>
                <Text style={[styles.prefsDetail, {
                  fontSize: FontSettingsStore.getScaledFontSize(11),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  Attribution: {ATTRIBUTION_LABELS[savedPreferences.attribution] || 'Username'}
                  {savedPreferences.authorizeAdvertising ? '  •  Advertising authorized' : ''}
                </Text>
              </MinkyPanel>
            </Pressable>
          </>
        )}
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
  },
  assetRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  assetRefText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  assetRefButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.3)',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'Comfortaa',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickButtonRow: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  typePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  submitRow: {
    marginTop: 24,
    alignSelf: 'center',
  },
  prefsTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  prefsDetail: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default BazaarSubmit;
