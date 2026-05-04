import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import StitchedBorder from '../StitchedBorder';
import FreeTextShortInput from './FreeTextShortInput';

/**
 * support-network-map-canvas — horizontal "rings as columns" map.
 * Spec: ../_meta-canonical/support-network-map-canvas.json
 *
 * Self is anchored on the left. Each ring becomes a vertical column to the right —
 * Personal closest, Professional further out, Community furthest. Tap a node to expand
 * its detail card inline directly below the map.
 */
const RING_TAXONOMIES = {
  'personal-professional-community': [
    { id: 'personal', label: 'Personal', color: 'rgba(160, 200, 140, 0.45)' },
    { id: 'professional', label: 'Professional', color: 'rgba(135, 180, 210, 0.45)' },
    { id: 'community', label: 'Community', color: 'rgba(112, 68, 199, 0.4)' },
  ],
  'category-open-ended': [
    { id: 'inner', label: 'Closest', color: 'rgba(160, 200, 140, 0.45)' },
    { id: 'middle', label: 'Mid', color: 'rgba(135, 180, 210, 0.45)' },
    { id: 'outer', label: 'Outer', color: 'rgba(112, 68, 199, 0.4)' },
  ],
};

const SupportNetworkMapCanvas = observer(({
  ringTaxonomy = 'personal-professional-community',
  nodesArray,
  value,
  currentValue,
  selfNodeLabel = 'You',
  preMapPreWork,
  cognitiveOverlayEnabled = false,
  interactable = true,
  onNodeAdded,
  onNodeOpened,
  onNodeUpdated,
  onNodeDeleted,
  onMapExported,
  onPreMapGateCompleted,
  onMapSaved,
  onValueChanged,
}) => {
  // Resolve external nodes source: explicit `nodesArray` wins, then v2 `value`/`currentValue`.
  const externalNodes = Array.isArray(nodesArray)
    ? nodesArray
    : (Array.isArray(value) ? value : (Array.isArray(currentValue) ? currentValue : null));
  // Seed internal node graph from external value so resume restores cleanly.
  const [internalNodes, setInternalNodes] = useState(() => externalNodes ? [...externalNodes] : []);
  // If the external value array reference changes (e.g. parent injects), adopt it.
  React.useEffect(() => {
    if (externalNodes && externalNodes !== internalNodes) {
      setInternalNodes(externalNodes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalNodes]);
  const nodes = internalNodes;

  const [openNodeId, setOpenNodeId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [preMapDone, setPreMapDone] = useState(!preMapPreWork);
  const [showAddForm, setShowAddForm] = useState(false);

  // New-supporter form state
  const [newName, setNewName] = useState('');
  const [newRing, setNewRing] = useState('personal');
  const [newTel, setNewTel] = useState('');
  const [newSms, setNewSms] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newWhen, setNewWhen] = useState('');

  const rings = RING_TAXONOMIES[ringTaxonomy] || RING_TAXONOMIES['personal-professional-community'];

  // Mutate the persisted node graph + emit auto-save value (R4).
  const commitNodes = (next) => {
    if (!interactable) return;
    setInternalNodes(next);
    onValueChanged && onValueChanged(next);
  };

  const byRing = {};
  rings.forEach(r => { byRing[r.id] = []; });
  nodes.forEach(n => {
    const ringId = n.ring_id || n.ringId || rings[0].id;
    if (!byRing[ringId]) byRing[ringId] = [];
    byRing[ringId].push(n);
  });

  if (preMapPreWork && !preMapDone) {
    return (
      <MinkyPanel borderRadius={14} padding={18} paddingTop={18} overlayColor="rgba(220, 165, 75, 0.25)">
        <Text style={[styles.preMapTitle, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
          Before mapping…
        </Text>
        <Text style={[styles.preMapBody, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {preMapPreWork}
        </Text>
        <Pressable
          onPress={() => { if (!interactable) return; setPreMapDone(true); onPreMapGateCompleted && onPreMapGateCompleted(); }}
          style={styles.preMapBtn}
          hitSlop={8}
        >
          <StitchedBorder borderRadius={10} style={styles.preMapBtnInner}>
            <Text style={[styles.preMapBtnText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
              I'm ready
            </Text>
          </StitchedBorder>
        </Pressable>
      </MinkyPanel>
    );
  }

  const openNode = nodes.find(n => n.id === openNodeId);
  const detail = openNode?.detail_payload || openNode?.detailPayload || {};
  const callTel = detail.tel || openNode?.tel;
  const textSms = detail.sms || openNode?.sms;
  const emailAddr = detail.email || openNode?.email;
  const externalUrl = detail.url || openNode?.url;

  // Responsive layout — narrow viewports stack vertically (no horizontal scroll).
  const { width: screenWidth } = useWindowDimensions();
  const stacked = screenWidth < 640;

  return (
    <View style={styles.wrap}>
      <View style={[styles.canvas, stacked && styles.canvasStacked]}>
          {/* Self column on the left — same style as persona-picker circular avatars */}
          <View style={[styles.selfColumn, stacked && styles.selfColumnStacked]}>
            <MinkyPanel
              padding={12}
              overlayColor="rgba(135, 180, 210, 0.55)"
              borderColor="rgba(92, 90, 88, 0.55)"
              shape="circular"
              size={84}
            >
              <Text
                style={[styles.selfText, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}
                numberOfLines={1}
              >
                {selfNodeLabel}
              </Text>
            </MinkyPanel>
            <Text style={[styles.selfCaption, { fontSize: FontSettingsStore.getScaledFontSize(10) }]}>
              YOU
            </Text>
          </View>

          {/* One column per ring */}
          {rings.map((ring) => {
            const ringNodes = byRing[ring.id] || [];
            return (
              <View key={ring.id} style={[styles.ringColumn, stacked && styles.ringColumnStacked]}>
                <View style={[styles.ringHeader, { backgroundColor: ring.color }]}>
                  <Text style={[styles.ringHeaderText, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                    {ring.label.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.ringBody}>
                  {ringNodes.length === 0 ? (
                    <Pressable
                      onPress={() => { if (!interactable) return; setNewRing(ring.id); setShowAddForm(true); }}
                      style={styles.emptySlot}
                      hitSlop={4}
                    >
                      <Text style={[styles.emptySlotText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                        + add to {ring.label}
                      </Text>
                    </Pressable>
                  ) : (
                    ringNodes.map(node => {
                      const isOpen = node.id === openNodeId;
                      return (
                        <Pressable
                          key={node.id}
                          onPress={() => {
                            if (!interactable) return;
                            setOpenNodeId(node.id);
                            setEditing(false);
                            setEditFields({});
                            onNodeOpened && onNodeOpened(node);
                          }}
                          style={styles.nodeBtn}
                          hitSlop={4}
                        >
                          <StitchedBorder
                            borderRadius={12}
                            borderWidth={2}
                            borderColor={isOpen ? '#7044C7' : 'rgba(92, 90, 88, 0.55)'}
                            style={[
                              styles.nodeInner,
                              { backgroundColor: isOpen ? 'rgba(135, 180, 210, 0.55)' : 'rgba(255, 255, 255, 0.5)' },
                            ]}
                          >
                            <View style={styles.nodeAvatar}>
                              <Text style={styles.nodeAvatarText}>{node.avatar || node.label?.[0] || '·'}</Text>
                            </View>
                            <Text
                              style={[styles.nodeLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}
                              numberOfLines={1}
                            >
                              {node.label}
                            </Text>
                          </StitchedBorder>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>
            );
          })}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => { if (!interactable) return; setShowAddForm(s => !s); }}
          style={styles.actionBtn}
          hitSlop={6}
        >
          <StitchedBorder borderRadius={10} style={styles.actionBtnInner}>
            <Text style={[styles.actionBtnText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
              {showAddForm ? '− Close form' : '+ Add supporter'}
            </Text>
          </StitchedBorder>
        </Pressable>
        <Pressable
          onPress={() => { if (!interactable) return; onMapSaved && onMapSaved(); onMapExported && onMapExported({ form: 'image-screenshot' }); }}
          style={styles.actionBtn}
          hitSlop={6}
        >
          <StitchedBorder borderRadius={10} style={styles.actionBtnInner}>
            <Text style={[styles.actionBtnText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
              Save map
            </Text>
          </StitchedBorder>
        </Pressable>
      </View>

      {openNode ? (
        <MinkyPanel borderRadius={12} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
          <View style={styles.detailHeader}>
            {editing ? (
              <FreeTextShortInput
                value={editFields.label ?? openNode.label}
                placeholder="Name"
                onChange={(v) => setEditFields(f => ({ ...f, label: v }))}
                onCommit={(v) => setEditFields(f => ({ ...f, label: v }))}
              />
            ) : (
              <Text style={[styles.detailLabel, { fontSize: FontSettingsStore.getScaledFontSize(15) }]}>
                {openNode.label}
              </Text>
            )}
            <Pressable onPress={() => { setOpenNodeId(null); setEditing(false); setEditFields({}); }} hitSlop={10} style={styles.detailCloseBtn}>
              <Text style={styles.detailCloseGlyph}>✕</Text>
            </Pressable>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <FormFieldRow label="When">
                <FreeTextShortInput
                  value={editFields.when ?? detail.when ?? ''}
                  placeholder="e.g. Sun 4pm"
                  onChange={(v) => setEditFields(f => ({ ...f, when: v }))}
                  onCommit={(v) => setEditFields(f => ({ ...f, when: v }))}
                />
              </FormFieldRow>
              <FormFieldRow label="Phone">
                <FreeTextShortInput
                  value={editFields.tel ?? detail.tel ?? ''}
                  placeholder="+1 555 123 4567"
                  onChange={(v) => setEditFields(f => ({ ...f, tel: v }))}
                  onCommit={(v) => setEditFields(f => ({ ...f, tel: v }))}
                />
              </FormFieldRow>
              <FormFieldRow label="Text">
                <FreeTextShortInput
                  value={editFields.sms ?? detail.sms ?? ''}
                  placeholder="SMS number"
                  onChange={(v) => setEditFields(f => ({ ...f, sms: v }))}
                  onCommit={(v) => setEditFields(f => ({ ...f, sms: v }))}
                />
              </FormFieldRow>
              <FormFieldRow label="Email">
                <FreeTextShortInput
                  value={editFields.email ?? detail.email ?? ''}
                  placeholder="name@example.com"
                  onChange={(v) => setEditFields(f => ({ ...f, email: v }))}
                  onCommit={(v) => setEditFields(f => ({ ...f, email: v }))}
                />
              </FormFieldRow>
              <FormFieldRow label="Script">
                <FreeTextShortInput
                  value={editFields.script ?? detail.script ?? ''}
                  placeholder="What you'd like to say"
                  onChange={(v) => setEditFields(f => ({ ...f, script: v }))}
                  onCommit={(v) => setEditFields(f => ({ ...f, script: v }))}
                />
              </FormFieldRow>
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => {
                    if (!interactable) return;
                    const { label, ...rest } = editFields;
                    const patch = {
                      ...(label !== undefined ? { label } : {}),
                      detail_payload: { ...detail, ...rest },
                    };
                    const nextNodes = nodes.map(n => n.id === openNode.id ? { ...n, ...patch } : n);
                    commitNodes(nextNodes);
                    onNodeUpdated && onNodeUpdated(openNode.id, patch);
                    setEditing(false);
                    setEditFields({});
                  }}
                  hitSlop={6}
                >
                  <MinkyPanel borderRadius={20} padding={10} paddingTop={10} overlayColor="rgba(135, 180, 210, 0.65)">
                    <Text style={[detailActionStyles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                      ✓  Save
                    </Text>
                  </MinkyPanel>
                </Pressable>
                <Pressable
                  onPress={() => { if (!interactable) return; setEditing(false); setEditFields({}); }}
                  hitSlop={6}
                >
                  <MinkyPanel borderRadius={20} padding={10} paddingTop={10} overlayColor="rgba(255, 255, 255, 0.55)">
                    <Text style={[detailActionStyles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                      Cancel
                    </Text>
                  </MinkyPanel>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!interactable) return;
                    const nextNodes = nodes.filter(n => n.id !== openNode.id);
                    commitNodes(nextNodes);
                    onNodeDeleted && onNodeDeleted(openNode.id);
                    setOpenNodeId(null);
                    setEditing(false);
                    setEditFields({});
                  }}
                  hitSlop={6}
                >
                  <MinkyPanel borderRadius={20} padding={10} paddingTop={10} overlayColor="rgba(220, 130, 130, 0.45)">
                    <Text style={[detailActionStyles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                      🗑  Delete
                    </Text>
                  </MinkyPanel>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {detail.script ? (
                <Text style={[styles.detailScript, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                  "{detail.script}"
                </Text>
              ) : null}
              {detail.when ? (
                <Text style={[styles.detailMeta, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                  When: {detail.when}
                </Text>
              ) : null}
              {(callTel || textSms || emailAddr || externalUrl) ? (
                <View style={styles.detailActions}>
                  {callTel ? (
                    <DetailActionBtn
                      glyph="📞"
                      label={`Call ${callTel}`}
                      onPress={() => Linking.openURL(`tel:${callTel.replace(/\s/g, '')}`).catch(() => {})}
                    />
                  ) : null}
                  {textSms ? (
                    <DetailActionBtn
                      glyph="💬"
                      label={detail.sms_label || `Text ${textSms}`}
                      onPress={() => Linking.openURL(`sms:${textSms.replace(/\s/g, '')}`).catch(() => {})}
                    />
                  ) : null}
                  {emailAddr ? (
                    <DetailActionBtn
                      glyph="✉"
                      label="Email"
                      onPress={() => Linking.openURL(`mailto:${emailAddr}`).catch(() => {})}
                    />
                  ) : null}
                  {externalUrl ? (
                    <DetailActionBtn
                      glyph="↗"
                      label="Open link"
                      onPress={() => Linking.openURL(externalUrl).catch(() => {})}
                    />
                  ) : null}
                </View>
              ) : null}
              <View style={styles.detailActions}>
                <DetailActionBtn glyph="✎" label="Edit" onPress={() => setEditing(true)} />
              </View>
            </>
          )}
        </MinkyPanel>
      ) : null}

      {showAddForm ? (
        <MinkyPanel borderRadius={12} padding={16} paddingTop={16} overlayColor="rgba(160, 200, 140, 0.3)">
          <Text style={[styles.formTitle, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
            Add a supporter
          </Text>
          <FormFieldRow label="Name">
            <FreeTextShortInput
              value={newName}
              placeholder="e.g. Mom, Dr. K, Group"
              onChange={setNewName}
              onCommit={setNewName}
            />
          </FormFieldRow>
          <FormFieldRow label="Ring">
            <View style={styles.ringPickerRow}>
              {rings.map(r => {
                const sel = newRing === r.id;
                return (
                  <Pressable key={r.id} onPress={() => setNewRing(r.id)} hitSlop={4} style={styles.ringPickerCell}>
                    <MinkyPanel
                      borderRadius={20}
                      padding={8}
                      paddingTop={8}
                      overlayColor={sel ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
                      borderColor={sel ? 'rgba(92, 90, 88, 0.55)' : undefined}
                    >
                      <Text style={[styles.ringPickerLabel, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}>
                        {r.label}
                      </Text>
                    </MinkyPanel>
                  </Pressable>
                );
              })}
            </View>
          </FormFieldRow>
          <FormFieldRow label="Phone">
            <FreeTextShortInput
              value={newTel}
              placeholder="+1 555 123 4567"
              onChange={setNewTel}
              onCommit={setNewTel}
            />
          </FormFieldRow>
          <FormFieldRow label="Text">
            <FreeTextShortInput
              value={newSms}
              placeholder="SMS number"
              onChange={setNewSms}
              onCommit={setNewSms}
            />
          </FormFieldRow>
          <FormFieldRow label="Email">
            <FreeTextShortInput
              value={newEmail}
              placeholder="name@example.com"
              onChange={setNewEmail}
              onCommit={setNewEmail}
            />
          </FormFieldRow>
          <FormFieldRow label="When">
            <FreeTextShortInput
              value={newWhen}
              placeholder="e.g. Sun 4pm"
              onChange={setNewWhen}
              onCommit={setNewWhen}
            />
          </FormFieldRow>
          <View style={styles.editActions}>
            <Pressable
              onPress={() => {
                if (!interactable) return;
                if (!newName.trim()) return;
                const newNode = {
                  id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  ring_id: newRing,
                  label: newName.trim(),
                  avatar: newName.trim()[0].toUpperCase(),
                  detail_payload: {
                    ...(newTel ? { tel: newTel } : {}),
                    ...(newSms ? { sms: newSms } : {}),
                    ...(newEmail ? { email: newEmail } : {}),
                    ...(newWhen ? { when: newWhen } : {}),
                  },
                };
                commitNodes([...nodes, newNode]);
                onNodeAdded && onNodeAdded(newNode);
                setNewName(''); setNewTel(''); setNewSms(''); setNewEmail(''); setNewWhen('');
                setShowAddForm(false);
              }}
              hitSlop={6}
              disabled={!newName.trim()}
            >
              <MinkyPanel borderRadius={20} padding={10} paddingTop={10} overlayColor={newName.trim() ? 'rgba(135, 180, 210, 0.65)' : 'rgba(255, 255, 255, 0.4)'}>
                <Text style={[detailActionStyles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                  ✓  Add to {rings.find(r => r.id === newRing)?.label}
                </Text>
              </MinkyPanel>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!interactable) return;
                setNewName(''); setNewTel(''); setNewSms(''); setNewEmail(''); setNewWhen('');
                setShowAddForm(false);
              }}
              hitSlop={6}
            >
              <MinkyPanel borderRadius={20} padding={10} paddingTop={10} overlayColor="rgba(255, 255, 255, 0.55)">
                <Text style={[detailActionStyles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                  Cancel
                </Text>
              </MinkyPanel>
            </Pressable>
          </View>
        </MinkyPanel>
      ) : null}
    </View>
  );
});

const FormFieldRow = ({ label, children }) => (
  <View style={styles.formRow}>
    <Text style={[styles.formLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
      {label}
    </Text>
    {children}
  </View>
);

// Same look as the crisis banner's Call / Text pills — MinkyPanel pill with translucent
// white overlay, dark text, content emboss. Bigger and more prominent than a plain button.
const DetailActionBtn = ({ glyph, label, onPress }) => (
  <Pressable onPress={onPress} hitSlop={6}>
    <MinkyPanel borderRadius={24} padding={12} paddingTop={12} overlayColor="rgba(255, 255, 255, 0.55)">
      <Text style={[detailActionStyles.btnLabel, { fontSize: FontSettingsStore.getScaledFontSize(14) }]} numberOfLines={1}>
        {glyph}  {label}
      </Text>
    </MinkyPanel>
  </Pressable>
);

const detailActionStyles = StyleSheet.create({
  btnLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  canvasScroll: { paddingVertical: 4, flexGrow: 1, justifyContent: 'center' },
  canvas: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
  },
  canvasStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },

  selfColumn: { alignItems: 'center', gap: 8, paddingTop: 36 },
  selfColumnStacked: { paddingTop: 0, paddingBottom: 4 },
  selfText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    minWidth: 32,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  selfCaption: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  ringColumn: { minWidth: 140, gap: 8 },
  ringColumnStacked: { width: '100%', minWidth: 0 },
  ringHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ringHeaderText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ringBody: { gap: 6 },
  nodeBtn: { },
  nodeInner: {
    flex: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 60,
  },
  nodeAvatar: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(112, 68, 199, 0.35)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(92, 90, 88, 0.45)',
  },
  nodeAvatarText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    fontSize: 16,
    color: '#2D2C2B',
  },
  nodeLabel: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptySlot: {
    minHeight: 60,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 90, 88, 0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptySlotText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  formTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  formRow: { gap: 4, marginBottom: 10 },
  formLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#454342',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ringPickerRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ringPickerCell: { },
  ringPickerLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  editForm: { gap: 6, marginTop: 10 },
  editActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },

  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  actionBtn: { },
  actionBtnInner: {
    flex: 0,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    minHeight: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  preMapTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  preMapBody: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    marginTop: 6,
    lineHeight: 19,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  preMapBtn: { alignSelf: 'flex-end', marginTop: 10 },
  preMapBtnInner: {
    flex: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  preMapBtnText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  detailLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  detailCloseBtn: {
    minWidth: 36, minHeight: 36,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  detailCloseGlyph: { fontSize: 14, fontWeight: '700', color: 'rgba(69, 67, 66, 0.85)' },
  detailScript: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#454342',
    fontStyle: 'italic',
    marginTop: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  detailMeta: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    marginTop: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default SupportNetworkMapCanvas;
