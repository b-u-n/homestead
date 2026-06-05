import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { observer } from 'mobx-react-lite';
import WebSocketService from '../../services/websocket';
import SessionStore from '../../stores/SessionStore';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

/**
 * WorkbookResumePicker — sits between WorkbookLanding and WorkbookActivity.
 * Renders, top to bottom: "Start fresh" → in-progress instances (newest first)
 * → completed instances (newest first). If there are zero existing instances
 * (neither in-progress nor completed), the picker auto-skips by emitting
 * onComplete({ action: 'startFresh' }) on mount.
 */
const formatRelative = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
};

const WorkbookResumePicker = observer(({
  input,
  context,
  onComplete,
  accumulatedData
}) => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  const landingData = accumulatedData?.['workbook:landing'];
  const activityId = landingData?.activityId || input?.activityId;
  const activityTitle = landingData?.activityTitle || input?.activityTitle || 'Activity';
  const bookshelfId = landingData?.bookshelfId || input?.bookshelfId;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!WebSocketService.socket || !activityId) {
        setLoading(false);
        return;
      }
      try {
        const data = await WebSocketService.emit('workbook:activity:list-instances', {
          sessionId: context?.sessionId ?? SessionStore.sessionId,
          activityId
        });
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setInstances(list);
        setLoading(false);
        // Auto-skip if no in-progress instances — go straight to a fresh run.
        if (list.length === 0) {
          onComplete({ action: 'startFresh', activityId, activityTitle, bookshelfId });
        }
      } catch (err) {
        console.error('Error listing instances:', err);
        if (!cancelled) {
          setLoading(false);
          onComplete({ action: 'startFresh', activityId, activityTitle, bookshelfId });
        }
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const handleResume = (instanceId) => {
    onComplete({ action: 'resume', activityId, activityTitle, bookshelfId, instanceId });
  };

  const handleStartFresh = () => {
    onComplete({ action: 'startFresh', activityId, activityTitle, bookshelfId });
  };

  // Inline-rename state: which instance is being edited and the draft text.
  // Saves on blur via workbook:activity:rename-instance; the local list is
  // updated optimistically so the new name lands before the round-trip.
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');

  const beginRename = (inst) => {
    setEditingId(inst.instanceId);
    setDraftName(inst.sessionName || '');
  };

  const commitRename = async () => {
    const id = editingId;
    const next = draftName.trim().slice(0, 80);
    setEditingId(null);
    if (!id) return;
    setInstances(prev => prev.map(i => i.instanceId === id ? { ...i, sessionName: next || null } : i));
    try {
      await WebSocketService.emit('workbook:activity:rename-instance', {
        sessionId: context?.sessionId ?? SessionStore.sessionId,
        instanceId: id,
        sessionName: next
      });
    } catch (err) {
      console.error('Error renaming instance:', err);
    }
  };

  if (loading || instances.length === 0) {
    // Either still fetching, or auto-skip already fired and the parent flow is
    // about to swap us out. Render a tiny loading panel.
    return (
      <View style={styles.container}>
        <MinkyPanel borderRadius={8} padding={20} paddingTop={20} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.loadingText, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
            Loading…
          </Text>
        </MinkyPanel>
      </View>
    );
  }

  const inProgress = instances.filter(i => i.status !== 'completed');
  const completed = instances.filter(i => i.status === 'completed');

  const renderInstanceRow = (inst, kind) => {
    const stepLabel = inst.totalSteps
      ? `Step ${Math.min(inst.stepsCompleted + 1, inst.totalSteps)} of ${inst.totalSteps}`
      : `${inst.stepsCompleted} step${inst.stepsCompleted === 1 ? '' : 's'} done`;
    const isCompleted = kind === 'completed';
    const isEditing = editingId === inst.instanceId;
    // Title: user-given name if set; otherwise the relative date the session
    // was started ("3d ago", "2h ago"). Step progress moves to the meta line.
    const fallbackLabel = formatRelative(inst.createdAt || inst.lastAccessedAt);
    const titleText = inst.sessionName || (isCompleted ? `Completed · ${fallbackLabel}` : `Started ${fallbackLabel}`);
    const metaText = isCompleted
      ? 'Tap to look back at what you wrote'
      : `${stepLabel} · last touched ${formatRelative(inst.lastAccessedAt)}`;
    return (
      <Pressable key={inst.instanceId} onPress={() => !isEditing && handleResume(inst.instanceId)}>
        <MinkyPanel
          borderRadius={8}
          padding={12}
          paddingTop={12}
          overlayColor={isCompleted ? 'rgba(160, 200, 140, 0.35)' : 'rgba(112, 68, 199, 0.2)'}
        >
          <View style={styles.row}>
            <View style={styles.rowText}>
              {isEditing ? (
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  onBlur={commitRename}
                  onSubmitEditing={commitRename}
                  autoFocus
                  maxLength={80}
                  placeholder="Name this session…"
                  placeholderTextColor="rgba(92, 90, 88, 0.55)"
                  style={[styles.rowTitle, styles.rowTitleInput, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}
                />
              ) : (
                <Text style={[styles.rowTitle, { fontSize: FontSettingsStore.getScaledFontSize(14) }]} numberOfLines={1}>
                  {titleText}
                </Text>
              )}
              <Text style={[styles.rowMeta, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                {metaText}
              </Text>
            </View>
            <Pressable
              onPress={(e) => { e.stopPropagation && e.stopPropagation(); beginRename(inst); }}
              hitSlop={8}
              style={styles.editButton}
            >
              <Text style={styles.editIcon}>✎</Text>
            </Pressable>
            <Text style={[styles.arrow, isCompleted && styles.arrowCompleted]}>{isCompleted ? '✓' : '›'}</Text>
          </View>
        </MinkyPanel>
      </Pressable>
    );
  };

  const subtitle = inProgress.length > 0
    ? `You have unfinished ${activityTitle.toLowerCase()} session${inProgress.length === 1 ? '' : 's'}. Start fresh, resume, or look back.`
    : `You've done this ${completed.length === 1 ? 'once' : `${completed.length} times`} before. Start fresh, or look back at past sessions.`;

  return (
    <View style={styles.container}>
      <Text style={[styles.subtitle, { fontSize: FontSettingsStore.getScaledFontSize(14), color: FontSettingsStore.getFontColor('#5C5A58') }]}>
        {subtitle}
      </Text>

      <ScrollBarView style={styles.list}>
        <View style={styles.listContent}>
          {/* 1. Start fresh — always on top */}
          <Pressable onPress={handleStartFresh}>
            <MinkyPanel borderRadius={8} padding={12} paddingTop={12} overlayColor="rgba(100, 130, 195, 0.25)">
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { fontSize: FontSettingsStore.getScaledFontSize(14) }]}>
                    Start fresh
                  </Text>
                  <Text style={[styles.rowMeta, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                    Begin a new session
                  </Text>
                </View>
                <Text style={styles.arrow}>+</Text>
              </View>
            </MinkyPanel>
          </Pressable>

          {/* 2. In-progress / resume */}
          {inProgress.length > 0 ? (
            <View style={styles.sectionGap}>
              <Text style={[styles.sectionLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                In progress
              </Text>
              {inProgress.map(inst => renderInstanceRow(inst, 'in-progress'))}
            </View>
          ) : null}

          {/* 3. Completed — below resumes */}
          {completed.length > 0 ? (
            <View style={styles.sectionGap}>
              <Text style={[styles.sectionLabel, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
                Completed
              </Text>
              {completed.map(inst => renderInstanceRow(inst, 'completed'))}
            </View>
          ) : null}
        </View>
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  subtitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  list: { flex: 1 },
  listContent: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  rowMeta: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  arrow: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    fontSize: 22,
    paddingHorizontal: 4,
  },
  rowTitleInput: {
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(112, 68, 199, 0.45)',
  },
  editButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editIcon: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    fontSize: 14,
    opacity: 0.7,
  },
  arrowCompleted: {
    color: '#5C8A4A',
    fontSize: 18,
  },
  sectionGap: {
    gap: 6,
    marginTop: 10,
  },
  sectionLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#5C5A58',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingLeft: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  loadingText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#5C5A58',
    textAlign: 'center',
  },
});

export default WorkbookResumePicker;
