import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal as RNModal, ScrollView } from 'react-native';
import Scroll from '../components/Scroll';
import WoolButton from '../components/WoolButton'; //activities-demo-temp
import FlowEngine from '../components/FlowEngine'; //activities-demo-temp
import WorkbookActivityDrop from '../components/drops/WorkbookActivity'; //activities-demo-temp
import WorkbookResumePickerDrop from '../components/drops/WorkbookResumePicker'; //activities-demo-temp
import WebSocketService from '../services/websocket'; //activities-demo-temp
import domain from '../utils/domain'; //activities-demo-temp
import MinkyPanel from '../components/MinkyPanel'; //activities-demo-temp
import FontSettingsStore from '../stores/FontSettingsStore';
import PrimitiveFrame from '../components/primitives/PrimitiveFrame';

import StaticTextContentBlock from '../components/primitives/StaticTextContentBlock';
import FreeTextShortInput from '../components/primitives/FreeTextShortInput';
import FreeTextMultilineArea from '../components/primitives/FreeTextMultilineArea';
import NumericRatingSlider from '../components/primitives/NumericRatingSlider';
import BinaryStateToggle from '../components/primitives/BinaryStateToggle';
import OptionSelectDropdown from '../components/primitives/OptionSelectDropdown';

import ButtonPrimarySaveCta from '../components/primitives/ButtonPrimarySaveCta';
import ButtonSecondaryAction from '../components/primitives/ButtonSecondaryAction';
import ButtonAddNewItem from '../components/primitives/ButtonAddNewItem';
import ButtonExportShareAction from '../components/primitives/ButtonExportShareAction';

import ChipValueBadgeReadonly from '../components/primitives/ChipValueBadgeReadonly';
import ChipMultiSelectTagGroup from '../components/primitives/ChipMultiSelectTagGroup';
import ChipSuggestionOrAction from '../components/primitives/ChipSuggestionOrAction';

import ModeToggle from '../components/primitives/ModeToggle';
import ProgressCounterOrBar from '../components/primitives/ProgressCounterOrBar';
import StickyTopBannerChrome from '../components/primitives/StickyTopBannerChrome';
import CollapsibleSection from '../components/primitives/CollapsibleSection';
import SummaryOutputCard from '../components/primitives/SummaryOutputCard';
import HistorySavedEntryCard from '../components/primitives/HistorySavedEntryCard';

import LayoutSplitScreenTwoPane from '../components/primitives/LayoutSplitScreenTwoPane';
import LayoutQuadrantOrGridCells from '../components/primitives/LayoutQuadrantOrGridCells';
import ModalOverlayOrBottomSheet from '../components/primitives/ModalOverlayOrBottomSheet';
import PageableHistoryCarousel from '../components/primitives/PageableHistoryCarousel';

import QuickMoodMicroWidget from '../components/primitives/QuickMoodMicroWidget';
import PersonaPicker from '../components/primitives/PersonaPicker';
import PlatformWriteThroughHook from '../components/primitives/PlatformWriteThroughHook';

import DecorativeIllustrationOrBackdrop from '../components/primitives/DecorativeIllustrationOrBackdrop';
import BackFillAffordance from '../components/primitives/BackFillAffordance';
import DataComparisonTable from '../components/primitives/DataComparisonTable';
import ChartTrendLineOrBar from '../components/primitives/ChartTrendLineOrBar';
import DraggableOrSwipeableCard from '../components/primitives/DraggableOrSwipeableCard';
import TimerCountdownOrSession from '../components/primitives/TimerCountdownOrSession';
import BreathPacerAnimation from '../components/primitives/BreathPacerAnimation';
import BodySilhouetteWithZones from '../components/primitives/BodySilhouetteWithZones';
import DiagramCanvasWithNodesAndEdges from '../components/primitives/DiagramCanvasWithNodesAndEdges';
import SupportNetworkMapCanvas from '../components/primitives/SupportNetworkMapCanvas';

import MoodStore from '../stores/MoodStore';
import HopeChestStore from '../stores/HopeChestStore';
import PersonaStore from '../stores/PersonaStore';
import HistoryStore from '../stores/HistoryStore';
import { observer } from 'mobx-react-lite';
import { getCrisisLifeline } from '../utils/crisisLifelines';

const SectionHeading = ({ children }) => (
  <Text
    style={[
      styles.sectionHeading,
      { fontSize: FontSettingsStore.getScaledFontSize(20) },
    ]}
  >
    {children}
  </Text>
);

const VariantRow = ({ children }) => (
  <View style={styles.variantRow}>{children}</View>
);

// ---------- Self-contained interactive demo wrappers (local state) ----------

const ShortInputDemo = ({ placeholder, suggestionChips }) => {
  const [v, setV] = useState('');
  return (
    <FreeTextShortInput
      value={v}
      placeholder={placeholder}
      suggestionChips={suggestionChips}
      onChange={setV}
      onCommit={setV}
    />
  );
};

const MultilineDemo = (props) => {
  const [v, setV] = useState('');
  return <FreeTextMultilineArea {...props} value={v} onChange={setV} onCommit={setV} />;
};

const SliderDemo = ({ initial = 0, ...rest }) => {
  const [v, setV] = useState(initial);
  return <NumericRatingSlider {...rest} currentValue={v} onValueChanged={setV} onValueCommitted={setV} />;
};

const ToggleDemo = ({ initial = false, ...rest }) => {
  const [v, setV] = useState(initial);
  return <BinaryStateToggle {...rest} currentState={v} onToggle={setV} />;
};

const DropdownDemo = ({ initial, ...rest }) => {
  const [v, setV] = useState(initial);
  return <OptionSelectDropdown {...rest} currentValue={v} onValueChanged={setV} />;
};

const ChipMultiSelectDemo = ({ initial = [], ...rest }) => {
  const [sel, setSel] = useState(initial);
  return <ChipMultiSelectTagGroup {...rest} currentSelection={sel} onSelectionChanged={setSel} />;
};

const ModeToggleDemo = ({ initial, ...rest }) => {
  const [m, setM] = useState(initial);
  return <ModeToggle {...rest} currentMode={m} onModeChanged={setM} onFilterChanged={setM} onSortChanged={setM} onPreferenceChanged={setM} />;
};

const CollapsibleDemo = (props) => <CollapsibleSection {...props} />;

const ModalDemo = ({ overlayKind, dismissMode = 'tap-outside', triggerLabel = 'Open', body, autoDismissSeconds }) => {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <View style={{ alignSelf: 'flex-start' }}>
        <Pressable
          onPress={() => setOpen(true)}
          style={{
            paddingVertical: 12, paddingHorizontal: 18,
            borderRadius: 10, minHeight: 44,
            borderWidth: 2, borderStyle: 'dashed',
            borderColor: 'rgba(92, 90, 88, 0.55)',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{
            fontFamily: 'Comfortaa', fontWeight: '700', color: '#7044C7', fontSize: 14,
          }}>
            {triggerLabel}
          </Text>
        </Pressable>
      </View>
      <ModalOverlayOrBottomSheet
        open={open}
        overlayKind={overlayKind}
        dismissMode={dismissMode}
        autoDismissSeconds={autoDismissSeconds}
        title={overlayKind !== 'feedback-toast' ? `${overlayKind} demo` : undefined}
        bodySlot={body}
        onDismissed={() => setOpen(false)}
      />
    </View>
  );
};

const SwipeCardDemo = () => {
  const [log, setLog] = useState(null);
  return (
    <View style={{ gap: 6 }}>
      <DraggableOrSwipeableCard
        itemId="card1"
        primaryText="Notice three things you can see right now."
        primitiveKind="display-card"
        gesturePrimary="swipe-left-right-binary"
        leftBucketLabel="Skip"
        rightBucketLabel="Try"
        onSwipeLeft={() => setLog('skipped')}
        onSwipeRight={() => setLog('kept')}
      />
      {log ? <Text style={{ fontFamily: 'Comfortaa', color: '#7044C7', fontSize: 11 }}>last action: {log}</Text> : null}
    </View>
  );
};

const QuickMoodDemo = (props) => <QuickMoodMicroWidget {...props} />;

const PERSONA_LIST = [
  { id: 'warm', label: 'Warm', description: 'Soft and validating' },
  { id: 'neutral', label: 'Neutral', description: 'Balanced' },
  { id: 'brisk', label: 'Brisk', description: 'Direct' },
  { id: 'playful', label: 'Playful', description: 'Light and curious' },
  { id: 'clinical', label: 'Clinical', description: 'Evidence-focused' },
];
const PersonaDemo = ({ presentation }) => {
  const [id, setId] = useState('neutral');
  return (
    <PersonaPicker
      presentation={presentation}
      personas={PERSONA_LIST}
      currentPersonaId={id}
      onPersonaChange={setId}
    />
  );
};

const WriteThroughDemo = ({ destination, confirmationMode, label }) => {
  const [trigger, setTrigger] = useState(0);
  return (
    <View style={{ gap: 6 }}>
      <Text
        onPress={() => setTrigger(t => t + 1)}
        style={{
          fontFamily: 'Comfortaa', fontWeight: '700', color: '#7044C7', fontSize: 13,
          paddingVertical: 6, paddingHorizontal: 10,
          backgroundColor: 'rgba(112, 68, 199, 0.15)', borderRadius: 8,
          alignSelf: 'flex-start',
        }}
      >
        {label}
      </Text>
      <PlatformWriteThroughHook
        destination={destination}
        confirmationMode={confirmationMode}
        payload={destination === 'hope-chest' ? 'I helped a friend today.' : undefined}
        sourcePrototypeId="components-showcase"
        triggerKey={trigger}
      />
    </View>
  );
};

const SupportNetworkMapDemo = () => {
  const lifeline = getCrisisLifeline();
  const [nodes, setNodes] = useState([
    { id: 'mom', ring_id: 'personal', label: 'Mom', avatar: 'M', detail_payload: { script: 'Hi Mom, do you have a minute?', when: 'Sun 4pm', tel: '+15551234567' } },
    { id: 'sis', ring_id: 'personal', label: 'Sis', avatar: 'S', detail_payload: { tel: '+15557654321' } },
    { id: 'dr', ring_id: 'professional', label: 'Dr. K', avatar: 'K', detail_payload: { tel: '+15559876543', email: 'office@example.com', when: 'Mon 10am' } },
    { id: 'meet', ring_id: 'community', label: 'Support group', avatar: 'G', detail_payload: { url: 'https://example.com/group', when: 'Tue 7pm' } },
    {
      id: 'crisis',
      ring_id: 'community',
      label: lifeline.name,
      avatar: '☎',
      detail_payload: {
        tel: lifeline.tel,
        sms: lifeline.sms,
        sms_label: lifeline.sms_label,
        url: lifeline.url,
        script: lifeline.fallback
          ? 'Tap “Open link” to find a hotline in your region.'
          : `Free, confidential, 24/7 — ${lifeline.code}`,
      },
    },
  ]);
  const [savedAt, setSavedAt] = useState(null);

  const handleAdd = (payload = {}) => {
    const id = `new-${Date.now()}`;
    setNodes(prev => [...prev, {
      id,
      ring_id: payload.ring_id || 'community',
      label: payload.label || 'New person',
      avatar: payload.avatar || '·',
      detail_payload: payload.detail_payload || {},
    }]);
  };

  const handleUpdate = (nodeId, fields) => {
    setNodes(prev => prev.map(n => n.id === nodeId
      ? { ...n, ...fields, ...(fields.detail_payload ? { detail_payload: fields.detail_payload } : {}) }
      : n
    ));
  };

  const handleDelete = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
  };

  return (
    <View style={{ gap: 8 }}>
      <SupportNetworkMapCanvas
        ringTaxonomy="personal-professional-community"
        selfNodeLabel="Me"
        nodesArray={nodes}
        onNodeAdded={handleAdd}
        onNodeUpdated={handleUpdate}
        onNodeDeleted={handleDelete}
        onMapSaved={() => setSavedAt(new Date().toLocaleTimeString())}
      />
      {savedAt ? (
        <Text style={{ fontFamily: 'Comfortaa', fontWeight: '600', color: '#7044C7', fontSize: 11, textAlign: 'center' }}>
          ✓ map saved at {savedAt}
        </Text>
      ) : null}
    </View>
  );
};

const PlatformWritesPanel = observer(() => (
  <View style={{ gap: 8 }}>
    <Text style={{ fontFamily: 'Comfortaa', fontWeight: '700', color: '#454342', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}>
      Recent platform writes
    </Text>
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: 'Comfortaa', fontWeight: '600', color: '#2D2C2B', fontSize: 12 }}>
        Mood store: {MoodStore.entries.length} entries
        {MoodStore.entries.length ? ` · latest: ${MoodStore.entries[0]?.moodValue}/10` : ''}
      </Text>
      <Text style={{ fontFamily: 'Comfortaa', fontWeight: '600', color: '#2D2C2B', fontSize: 12 }}>
        Hope chest: {HopeChestStore.entries.length} entries
        {HopeChestStore.entries.length ? ` · latest: "${(HopeChestStore.entries[0]?.content || '').slice(0, 40)}"` : ''}
      </Text>
      <Text style={{ fontFamily: 'Comfortaa', fontWeight: '600', color: '#2D2C2B', fontSize: 12 }}>
        Persona: {PersonaStore.currentPersonaId}
      </Text>
      <Text style={{ fontFamily: 'Comfortaa', fontWeight: '600', color: '#2D2C2B', fontSize: 12 }}>
        History: {HistoryStore.entries.length} entries
      </Text>
    </View>
  </View>
));

// ---------- Activities section ---------- //activities-demo-temp
//activities-demo-temp — entire block below (BOOKSHELF_IDS, activityShowcaseFlow,
//ActivityLauncher, ActivitiesSection) is scaffolding for the activities-demo page.

const BOOKSHELF_IDS = [ //activities-demo-temp
  'anxiety', 'depression', 'sleep', 'relationships',
  'stress', 'self-compassion', 'crisis', 'daily-wellness',
];

// Mirrors the real workbookFlow's resume-picker → activity sequence so the
// demo surfaces past instances (in-progress + completed) on the shared demo
// account. The picker auto-skips when there's nothing to resume.
const activityShowcaseFlow = {
  name: 'activityShowcase',
  title: 'Activity',
  startAt: 'workbook:resume-picker',
  drops: {
    'workbook:resume-picker': {
      component: WorkbookResumePickerDrop,
      input: {},
      next: [
        {
          when: (output) => output.action === 'resume' || output.action === 'startFresh',
          goto: 'workbook:activity',
        },
      ],
    },
    'workbook:activity': {
      component: WorkbookActivityDrop,
      input: {},
      next: [],
    },
  },
};

// Matches the per-activity row format used by WorkbookLanding (the activities
// modal): Pressable -> MinkyPanel -> emoji + title + stitched checkbox.
const ActivityLauncher = ({ activity, onLaunch }) => (
  <View style={{ marginBottom: 8 }}>
    <Pressable onPress={() => onLaunch(activity)}>
      <MinkyPanel
        borderRadius={8}
        padding={12}
        paddingTop={12}
        overlayColor="rgba(112, 68, 199, 0.2)"
      >
        <View style={styles.activityRow}>
          <Text style={styles.activityEmoji}>{activity.emoji || '📝'}</Text>
          <Text
            style={[
              styles.activityTitle,
              {
                fontSize: FontSettingsStore.getScaledFontSize(14),
                color: FontSettingsStore.getFontColor('#2D2C2B'),
              },
            ]}
            numberOfLines={2}
          >
            {activity.title}
          </Text>
          <View style={styles.activityCheckbox} />
        </View>
      </MinkyPanel>
    </Pressable>
  </View>
);

const ActivitiesSection = ({ onLaunch }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  // Demo session id is held in component state — never written to
  // SessionStore — so other parts of the app keep using the real session.
  const [demoSessionId, setDemoSessionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${domain()}/api/accounts/ensure-demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data?.sessionId && !cancelled) setDemoSessionId(data.sessionId);
      } catch (err) {
        console.error('Failed to ensure demo session:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // The activities-demo page is a standalone route that doesn't go through
    // Onboarding/TownMap, so the singleton socket may not be connected yet.
    // Kick off connect() if no socket exists, then poll for connected state.
    if (!WebSocketService.socket) {
      WebSocketService.connect();
    }
    const waitForSocket = async () => {
      for (let i = 0; i < 50; i++) {
        if (cancelled) return false;
        if (WebSocketService.socket?.connected) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      return !!WebSocketService.socket?.connected;
    };
    const load = async () => {
      const ready = await waitForSocket();
      if (cancelled) return;
      if (!ready) {
        setLoading(false);
        return;
      }
      try {
        // No sessionId — the backend's beta gate only fires when sessionId
        // is provided, so omitting it returns the full activity catalog
        // even before the demo-session round-trip has finished. Launching
        // an activity still uses demoSessionId once it's ready.
        // Per-call timeout guards against a single hung emit holding the
        // whole page in "Loading…" forever.
        const withTimeout = (p, ms, label) => Promise.race([
          p,
          new Promise(resolve => setTimeout(() => {
            console.warn(`[activities-demo] workbook:load ${label} timed out after ${ms}ms`);
            resolve(null);
          }, ms)),
        ]);
        const results = await Promise.all(
          BOOKSHELF_IDS.map(bookshelfId =>
            withTimeout(
              WebSocketService.emit('workbook:load', { bookshelfId })
                .catch(err => {
                  console.warn(`[activities-demo] workbook:load ${bookshelfId} rejected:`, err?.message);
                  return null;
                }),
              5000,
              bookshelfId
            )
          )
        );
        console.log('[activities-demo] workbook:load results:', results);
        if (cancelled) return;
        const merged = [];
        const seen = new Set();
        results.forEach((r, i) => {
          const list = r?.workbook?.activities || [];
          list.forEach(a => {
            if (!a?.activityId || seen.has(a.activityId)) return;
            seen.add(a.activityId);
            merged.push({ ...a, bookshelfId: BOOKSHELF_IDS[i] });
          });
        });
        setActivities(merged);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [demoSessionId]);

  if (loading) {
    return (
      <Text style={styles.bodyText}>Loading activities…</Text>
    );
  }
  if (!activities.length) {
    return (
      <Text style={styles.bodyText}>
        No activities found. (Seed may not have been run.)
      </Text>
    );
  }
  return (
    <View>
      {activities.map(a => (
        <ActivityLauncher
          key={a.activityId}
          activity={a}
          onLaunch={(act) => onLaunch?.(act, demoSessionId)}
        />
      ))}
    </View>
  );
};
// end activities-demo-temp block

// activities-demo-temp — fetches a keyed text blob from /api/demo-text/:key.
const fetchDemoText = async (key) => {
  try {
    const res = await fetch(`${domain()}/api/demo-text/${key}`);
    const data = await res.json();
    if (data?.success) return data.content;
  } catch (err) {
    console.error('Error fetching demo text', key, err);
  }
  return null;
};

// activities-demo-temp — multi-paragraph copy pulled from the `text`
// collection by key. The DB is the sole source of truth.
const DemoCopy = ({ textKey }) => {
  const [content, setContent] = useState('');
  useEffect(() => {
    let cancelled = false;
    fetchDemoText(textKey).then(c => {
      if (!cancelled && c) setContent(c);
    });
    return () => { cancelled = true; };
  }, [textKey]);
  if (!content) return null;
  const paragraphs = content.split(/\n\s*\n/);
  return (
    <View style={{ gap: 10 }}>
      {paragraphs.map((p, i) => (
        <Text key={i} style={styles.bodyText}>{p.trim()}</Text>
      ))}
    </View>
  );
};

// activities-demo-temp — button + modal that lazily fetches a named text blob
// from the `text` collection. Uses RNModal directly so it portals above page
// content (the wrapped primitive modal sits behind transformed parents on
// web). Generic over textKey/title/buttonLabel so the demo page can surface
// multiple pipeline docs (instructions / combine / prototypes).
const DemoDocButton = ({ textKey, title, buttonLabel, emoji = '📄' }) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(null);
  useEffect(() => {
    if (!open || content) return;
    let cancelled = false;
    fetchDemoText(textKey).then(c => { if (!cancelled) setContent(c); });
    return () => { cancelled = true; };
  }, [open, content, textKey]);
  return (
    <View style={{ marginBottom: 8, width: '100%' }}>
      <Pressable onPress={() => setOpen(true)}>
        <MinkyPanel
          borderRadius={8}
          padding={12}
          paddingTop={12}
          overlayColor="rgba(112, 68, 199, 0.2)"
        >
          <View style={styles.activityRow}>
            <Text style={styles.activityEmoji}>{emoji}</Text>
            <Text
              style={[
                styles.activityTitle,
                {
                  fontSize: FontSettingsStore.getScaledFontSize(14),
                  color: FontSettingsStore.getFontColor('#2D2C2B'),
                },
              ]}
              numberOfLines={2}
            >
              {buttonLabel}
            </Text>
            <View style={styles.activityCheckbox} />
          </View>
        </MinkyPanel>
      </Pressable>
      <RNModal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.instructionsScrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.instructionsCard} onPress={() => {}}>
            <View style={styles.instructionsHeader}>
              <Text style={styles.instructionsTitle}>{title}</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.instructionsClose}>
                <Text style={styles.instructionsCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.instructionsBody}>
              <Text style={styles.instructionsContent}>
                {content || 'Loading…'}
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </RNModal>
    </View>
  );
};

// ---------- Main screen ----------

export default function ComponentShowcaseScreen() {
  const [componentsOpen, setComponentsOpen] = useState(false); //activities-demo-temp
  // activities-demo-temp — single FlowEngine rendered at the top level (outside
  // the page Scroll). Inline-per-button rendering inside the ScrollView caused
  // the absolutely-positioned activity modal to get clipped/buried so clicks
  // appeared to do nothing. Pattern matches MapCanvas's flow wrappers.
  const [activeActivity, setActiveActivity] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const handleLaunchActivity = (activity, sessionId) => {
    setActiveActivity(activity);
    setActiveSessionId(sessionId);
  };
  return (
    <View style={styles.container}>
      <Scroll contentContainerStyle={styles.scrollContent}>
        <View style={styles.inner}>
          <Text
            style={[
              styles.pageTitle,
              { fontSize: FontSettingsStore.getScaledFontSize(26) },
            ]}
          >
            Components & activities — demo
          </Text>

          {/* activities-demo-temp — intro copy + instructions popup, both
              pulled from the `text` collection on the backend. */}
          <DemoCopy textKey="intro" />
          <View>
            <DemoDocButton
              textKey="instructions"
              title="INSTRUCTIONS.md"
              buttonLabel="Read INSTRUCTIONS.md"
            />
            <DemoDocButton
              textKey="combine"
              title="COMBINE.md"
              buttonLabel="Read COMBINE.md"
            />
            <DemoDocButton
              textKey="prototypes"
              title="PROTOTYPES.md"
              buttonLabel="Read PROTOTYPES.md"
            />
            <DemoDocButton
              textKey="activity"
              title="ACTIVITY.json"
              buttonLabel="Read ACTIVITY.json"
            />
            <DemoDocButton
              textKey="component"
              title="COMPONENT.json"
              buttonLabel="Read COMPONENT.json"
            />
            <DemoDocButton
              textKey="activity-output"
              title="ACTIVITY-OUTPUT.json"
              buttonLabel="Read ACTIVITY-OUTPUT.json"
            />
          </View>

          {/* activities-demo-temp — disclaimer above the components catalog */}
          <Text style={[styles.bodyText, { fontStyle: 'italic' }]}>
            Be mindful that this component showcase is comprised of design / UI
            representations and does not represent end-to-end functionality.
            Fully functioning activities are available below the component list.
          </Text>

          {/* activities-demo-temp — collapsible wrapper around the original showcase */}
          <CollapsibleSection
            headerTitle="Component catalog"
            badge={componentsOpen ? 'tap to hide' : 'tap to expand'}
            initialState="collapsed"
            onExpanded={() => setComponentsOpen(true)}
            onCollapsed={() => setComponentsOpen(false)}
            bodySlotContent={
              <View style={styles.inner}>
                {/* ============== Atomic form controls ============== */}
                <SectionHeading>Atomic form controls</SectionHeading>

          <PrimitiveFrame
            metaId="static-text-content-block"
            description="Read-only text block: titles, prose, lists, callouts, dividers, ghost placeholders."
          >
            <VariantRow>
              <StaticTextContentBlock blockRole="step-title" text="How are you doing today?" />
            </VariantRow>
            <VariantRow>
              <StaticTextContentBlock
                blockRole="rich-text-prose"
                text="Take a moment to notice your breath. There's no right or wrong way to feel — this is just data."
              />
            </VariantRow>
            <VariantRow>
              <StaticTextContentBlock
                blockRole="bulleted-list"
                items={[
                  'Notice five things you can see',
                  'Notice four things you can hear',
                  'Notice three things you can feel',
                ]}
              />
            </VariantRow>
            <VariantRow>
              <StaticTextContentBlock
                blockRole="highlighted-callout"
                text="If you're in immediate danger, please reach out for support."
                iconGlyph="ⓘ"
              />
            </VariantRow>
            <VariantRow>
              <StaticTextContentBlock blockRole="section-divider" />
            </VariantRow>
            <VariantRow>
              <StaticTextContentBlock
                blockRole="ghost-placeholder"
                text="Your reframe will appear here…"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="free-text-short-input"
            description="Single-line input with optional suggestion chips."
          >
            <VariantRow>
              <ShortInputDemo placeholder="What is one small win today?" />
            </VariantRow>
            <VariantRow>
              <ShortInputDemo
                placeholder="Add a tag…"
                suggestionChips={['gratitude', 'rest', 'connection', 'movement']}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="free-text-multiline-area"
            description="Multiline textarea + structured action-plan editor variants."
          >
            <VariantRow>
              <MultilineDemo
                promptText="What's on your mind right now?"
                placeholder="Take your time…"
                size="medium"
              />
            </VariantRow>
            <VariantRow>
              <MultilineDemo
                promptText="Try one of these to get going:"
                placeholder="Start writing here…"
                starterPromptChips={['I noticed…', 'I felt…', 'What helped…']}
                size="medium"
              />
            </VariantRow>
            <VariantRow>
              <MultilineDemo
                anchorLabel="ACTION PLAN"
                subFields={[
                  { id: 'who', label: 'Who', placeholder: '…' },
                  { id: 'what', label: 'What', placeholder: '…' },
                  { id: 'when', label: 'When', placeholder: '…' },
                ]}
                commitmentLabel="Add to active goals"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="numeric-rating-slider"
            description="Pill row for small ranges, continuous slider for larger ones."
          >
            <VariantRow>
              <SliderDemo
                initial={5}
                scaleMin={0}
                scaleMax={10}
                stepSize={1}
                labelCopy="How intense?"
                emojiAnchors={{ low: '🙂', high: '😣' }}
              />
            </VariantRow>
            <VariantRow>
              <SliderDemo
                initial={42}
                scaleMin={0}
                scaleMax={100}
                stepSize={1}
                dimensionLabel="difficulty"
                colorTheme="blue"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="binary-state-toggle"
            description="On/off flag rendered as heart icon, large mark-done button, or inline flag toggle."
          >
            <VariantRow>
              <ToggleDemo
                presentation="heart-favorite-icon"
                placement="per-card corner (heart, star, watering-can)"
              />
            </VariantRow>
            <VariantRow>
              <ToggleDemo
                presentation="mark-done"
                placement="large section-filling button"
                label="Mark step done"
              />
            </VariantRow>
            <VariantRow>
              <ToggleDemo
                presentation="flag-toggle"
                placement="inline in form (per-criterion row)"
                label="Flag this for follow-up"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="option-select-dropdown"
            description="Single-select dropdown or multi-select segmented control."
          >
            <VariantRow>
              <DropdownDemo
                presentation="dropdown"
                label="Pick a category"
                options={[
                  { id: 'work', label: 'Work' },
                  { id: 'family', label: 'Family' },
                  { id: 'health', label: 'Health' },
                  { id: 'rest', label: 'Rest' },
                ]}
              />
            </VariantRow>
            <VariantRow>
              <DropdownDemo
                presentation="segmented-control"
                allowMultiSelect
                initial={[]}
                label="Pick all that apply"
                options={[
                  { id: 'a', label: 'Mind' },
                  { id: 'b', label: 'Body' },
                  { id: 'c', label: 'Social' },
                  { id: 'd', label: 'Spirit' },
                ]}
              />
            </VariantRow>
          </PrimitiveFrame>

          {/* ============== Buttons ============== */}
          <SectionHeading>Buttons</SectionHeading>

          <PrimitiveFrame
            metaId="button-primary-save-cta"
            description="Primary commit/save action — purple wool button."
          >
            <VariantRow>
              <ButtonPrimarySaveCta label="Save plan" />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="button-secondary-action"
            description="Cancel, navigation back/next, launcher entry — non-primary roles."
          >
            <VariantRow>
              <ButtonSecondaryAction role="cancel-dismiss" label="Cancel" />
            </VariantRow>
            <VariantRow>
              <ButtonSecondaryAction role="wizard-nav-back-next" label="Next" />
            </VariantRow>
            <VariantRow>
              <ButtonSecondaryAction role="launcher-entry-point" label="Start grounding" />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="button-add-new-item"
            description="'+' / 'Add' affordance: inline button, FAB, or icon-only."
          >
            <VariantRow>
              <ButtonAddNewItem rendering="inline_text_button" label="Add row" />
            </VariantRow>
            <VariantRow>
              <ButtonAddNewItem rendering="FAB" />
            </VariantRow>
            <VariantRow>
              <ButtonAddNewItem rendering="plus_icon" />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="button-export-share-action"
            description="Export / share / print artifact, single-format or multi-target bar."
          >
            <VariantRow>
              <ButtonExportShareAction outputFormat="pdf" />
            </VariantRow>
            <VariantRow>
              <ButtonExportShareAction bundling="multi-target-action-bar" />
            </VariantRow>
          </PrimitiveFrame>

          {/* ============== Chips & badges ============== */}
          <SectionHeading>Chips & badges</SectionHeading>

          <PrimitiveFrame
            metaId="chip-value-badge-readonly"
            description="Read-only display chip: category, numeric delta, placed-card mini-surrogate."
          >
            <VariantRow>
              <ChipValueBadgeReadonly role="category-metadata" value="Category A" />
            </VariantRow>
            <VariantRow>
              <View style={styles.inlineRow}>
                <ChipValueBadgeReadonly role="derived-numeric-delta" value={3} palette="delta-sign green/red/gray" />
                <ChipValueBadgeReadonly role="derived-numeric-delta" value={-2} palette="delta-sign green/red/gray" />
                <ChipValueBadgeReadonly role="derived-numeric-delta" value={0} palette="delta-sign green/red/gray" />
              </View>
            </VariantRow>
            <VariantRow>
              <ChipValueBadgeReadonly
                role="placed-card-mini-surrogate"
                value="Walk in park"
                durationLabel="30 min"
                postRating={8}
                completionState="completed"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="chip-multi-select-tag-group"
            description="Selectable chips or vertical checkbox list with description rows."
          >
            <VariantRow>
              <ChipMultiSelectDemo
                rendering="chip-strip"
                guidingQuestionText="Which feelings show up?"
                presetChips={['anxious', 'tired', 'hopeful', 'frustrated', 'calm', 'focused']}
              />
            </VariantRow>
            <VariantRow>
              <ChipMultiSelectDemo
                rendering="checkbox-list-vertical"
                rowFormat="name-plus-short-description"
                presetChips={[
                  { id: 'a', label: 'Body scan', short_description: 'Notice sensations without judgment' },
                  { id: 'b', label: 'Breathing', short_description: 'Slow, intentional breaths' },
                ]}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="chip-suggestion-or-action"
            description="Tap-to-insert payload chip, or tap-to-fire action (e.g. dial crisis line)."
          >
            <VariantRow>
              <ChipSuggestionOrAction
                role="suggestion-tap-to-insert"
                label="I'm noticing…"
                payload="I'm noticing"
              />
            </VariantRow>
            <VariantRow>
              <ChipSuggestionOrAction
                role="link-action-fire"
                actionType="tel-dial"
                label="988 Crisis Lifeline"
                payload="988"
              />
            </VariantRow>
          </PrimitiveFrame>

          {/* ============== Chrome / layout ============== */}
          <SectionHeading>Chrome / layout</SectionHeading>

          <PrimitiveFrame
            metaId="sticky-top-banner-chrome"
            description="Top-of-surface chrome: header, intro card, tips strip, crisis banner, scope nav."
          >
            <VariantRow>
              <StickyTopBannerChrome
                role="header-activity-framing"
                titleOrLabel="GAD-7 Anxiety Scale"
                framingCopy="Over the last 2 weeks, how often have you been bothered by these things?"
              />
            </VariantRow>
            <VariantRow>
              <StickyTopBannerChrome
                role="intro-framing-card"
                titleOrLabel="Grounding exercise"
                framingCopy="A short pause to settle into the present."
                beginButtonLabel="Begin"
              />
            </VariantRow>
            <VariantRow>
              <StickyTopBannerChrome
                role="dismissable-tips-strip"
                tipsList={['Tip 1: There are no wrong answers.', 'Tip 2: You can pause any time.']}
              />
            </VariantRow>
            <VariantRow>
              <StickyTopBannerChrome role="crisis-lifeline-988-banner" />
            </VariantRow>
            <VariantRow>
              <StickyTopBannerChrome
                role="scope-date-range-header"
                scopeLabel="This week"
                scopeNavigationControls={{ canPrev: true, canNext: true }}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="mode-toggle"
            description="Two-position visual/conv mode switch + segmented filter buckets."
          >
            <VariantRow>
              <ModeToggleDemo
                axis="visual<->conversational (platform-#4)"
                presentation="mode-switch-toggle"
                initial="visual"
                availableOptions={[
                  { id: 'visual', label: 'Visual' },
                  { id: 'conv', label: 'Chat' },
                ]}
              />
            </VariantRow>
            <VariantRow>
              <ModeToggleDemo
                axis="filter-bucket"
                presentation="segmented-toggle"
                initial="all"
                availableOptions={[
                  { id: 'all', label: 'All', count: 24 },
                  { id: 'priority', label: 'Priority', count: 6 },
                  { id: 'flagged', label: 'Flagged', count: 2 },
                ]}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="progress-counter-or-bar"
            description="Wizard bar, cumulative gauge, dots, streak, checklist rail."
          >
            <VariantRow>
              <ProgressCounterOrBar kind="wizard-step-bar" currentValue={3} segmentCount={7} />
            </VariantRow>
            <VariantRow>
              <ProgressCounterOrBar
                kind="cumulative-toward-target-bar"
                currentValue={42}
                totalOrTarget={150}
                unitLabel="min"
              />
            </VariantRow>
            <VariantRow>
              <ProgressCounterOrBar kind="inline-step-dots" currentValue={2} totalOrTarget={5} />
            </VariantRow>
            <VariantRow>
              <ProgressCounterOrBar kind="streak-non-punitive" currentValue={4} />
            </VariantRow>
            <VariantRow>
              <ProgressCounterOrBar
                kind="checklist-rail-sidebar"
                itemList={[
                  { id: 1, label: 'Grounding' },
                  { id: 2, label: 'Reframe' },
                  { id: 3, label: 'Plan' },
                ]}
                completionMarks={[1]}
              />
            </VariantRow>
          </PrimitiveFrame>

          {/* ============== Output / display ============== */}
          <SectionHeading>Output / display</SectionHeading>

          <PrimitiveFrame
            metaId="collapsible-section"
            description="Header + body that toggles open/closed; accordion or reference-panel variants."
          >
            <VariantRow>
              <CollapsibleDemo
                variant="accordion-section (mutual-exclusion)"
                headerTitle="What is this?"
                initialState="collapsed"
                bodySlotContent={
                  <StaticTextContentBlock
                    blockRole="rich-text-prose"
                    text="A grounding technique uses your senses to anchor you in the present moment."
                  />
                }
              />
            </VariantRow>
            <VariantRow>
              <CollapsibleDemo
                variant="reference-panel (default-collapsed)"
                headerTitle="References"
                badge="3 references"
                initialState="collapsed"
                bodySlotContent={
                  <StaticTextContentBlock
                    blockRole="bulleted-list"
                    items={['Spitzer et al., 2006', 'Beck, 1979', 'Hayes, 2004']}
                  />
                }
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="summary-output-card"
            description="Post-flow summary: assessment results, compiled artifact, empty-state."
          >
            <VariantRow>
              <SummaryOutputCard
                kind="assessment-results-panel"
                computedScore={11}
                severityBand="Moderate anxiety"
                interpretationCopy="Your symptoms are showing up regularly. A conversation with a clinician can help you build a plan."
                ctaLabel="Continue"
              />
            </VariantRow>
            <VariantRow>
              <SummaryOutputCard
                kind="compiled-plan-artifact-card"
                title="Your reframe"
                sections={[
                  { label: 'SITUATION', value: 'Hard call with mom about the holidays.' },
                  { label: 'THOUGHT', value: 'I always disappoint her.' },
                  { label: 'REFRAME', value: "I made one choice she didn't love. That isn't the same as always disappointing her." },
                ]}
                tapToEditJumpback
                closingPromptText="What surprised you?"
              />
            </VariantRow>
            <VariantRow>
              <SummaryOutputCard
                kind="empty-state-non-punitive"
                title={"Nothing yet — and that's okay."}
                resumeAvailable
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="history-saved-entry-card"
            description="Atomic per-entry card consumed by the history carousel."
          >
            <VariantRow>
              <HistorySavedEntryCard
                artifactDomain="thought-reframe"
                optionalTitleOrTheme="Hard call with mom"
                optionalSummaryFields={[
                  { label: 'TRIGGER', value: 'Long phone call about holidays.' },
                  { label: 'NEW THOUGHT', value: 'One choice ≠ always disappointing.' },
                ]}
                optionalMoodRating={7}
                supportsShareExport
                supportsEditOrBackfill
                supportsRestoreOrBranch
                savedAtTimestamp={new Date()}
                onCardTap={() => alert('Card tapped — would open detail.')}
                onShare={() => alert('Share invoked.')}
                onExport={() => alert('Export to PDF.')}
                onEditOrBackfill={() => alert('Edit / back-fill flow.')}
                onRestoreOrBranch={() => alert('Restore previous version.')}
              />
            </VariantRow>
          </PrimitiveFrame>

          {/* ============== Layout containers ============== */}
          <SectionHeading>Layout containers</SectionHeading>

          <PrimitiveFrame
            metaId="layout-split-screen-two-pane"
            description="Two-pane side-by-side or top-bottom layout with named slots."
          >
            <VariantRow>
              <LayoutSplitScreenTwoPane
                splitOrientation="vertical-50-50"
                paneRelationship="healthy-vs-unhealthy"
                colorCoded
                paneALabel="HEALTHY"
                paneBLabel="UNHEALTHY"
                paneASlot={
                  <StaticTextContentBlock blockRole="rich-text-prose" text="Walk · call a friend · journal" />
                }
                paneBSlot={
                  <StaticTextContentBlock blockRole="rich-text-prose" text="Doomscroll · skip meals · isolate" />
                }
              />
            </VariantRow>
            <VariantRow>
              <LayoutSplitScreenTwoPane
                splitOrientation="horizontal-top-bottom"
                paneRelationship="before-vs-after"
                colorCoded
                paneALabel="BEFORE"
                paneBLabel="AFTER"
                dividerTreatment="section-divider"
                paneASlot={<StaticTextContentBlock blockRole="rich-text-prose" text="I'll definitely fail this." />}
                paneBSlot={<StaticTextContentBlock blockRole="rich-text-prose" text="It might be hard, but I can try." />}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="layout-quadrant-or-grid-cells"
            description="Fixed N×M grid (2×2 quadrants, 3-col kanban, calendar grid)."
          >
            <VariantRow>
              <LayoutQuadrantOrGridCells
                gridDimensions="2x2"
                cellRole="static-named-slot"
                rowAxisLabels={['HIGH ENERGY', 'LOW ENERGY']}
                columnAxisLabels={['FUN', 'MASTERY']}
                cellPayloads={[
                  { row: 0, col: 0, label: 'Bike ride', content: <StaticTextContentBlock blockRole="rich-text-prose" text="Saturday morning" /> },
                  { row: 0, col: 1, label: 'Project work' },
                  { row: 1, col: 0, label: 'Music & tea' },
                  { row: 1, col: 1, label: 'Email triage' },
                ]}
              />
            </VariantRow>
            <VariantRow>
              <LayoutQuadrantOrGridCells
                gridDimensions="3-column-kanban"
                cellRole="drop-target"
                columnAxisLabels={['TODO', 'DOING', 'DONE']}
                cellPayloads={[
                  { row: 0, col: 0, label: 'Reach out to mom' },
                  { row: 0, col: 1, label: 'Walk' },
                  { row: 0, col: 2, label: 'Hydrate' },
                ]}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="modal-overlay-or-bottom-sheet"
            description="Transient overlay surface — bottom sheet, centered modal, toast, side drawer."
          >
            <VariantRow>
              <ModalDemo
                overlayKind="centered-modal"
                dismissMode="explicit-close-button"
                triggerLabel="Open centered modal"
                body={<StaticTextContentBlock blockRole="rich-text-prose" text="Modal body content goes here." />}
              />
            </VariantRow>
            <VariantRow>
              <ModalDemo
                overlayKind="bottom-sheet"
                dismissMode="tap-outside"
                triggerLabel="Open bottom sheet"
                body={<StaticTextContentBlock blockRole="rich-text-prose" text="Sheet body — slide-up overlay anchored to bottom." />}
              />
            </VariantRow>
            <VariantRow>
              <ModalDemo
                overlayKind="feedback-toast"
                triggerLabel="Show toast (3s)"
                autoDismissSeconds={3}
                body="Saved ✓"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="pageable-history-carousel"
            description="Swipe-paged or scroll-strip surface that hosts history-saved-entry-card. Use ‹ › arrows or swipe."
          >
            <VariantRow>
              <PageableHistoryCarousel
                navigationMode="swipe-paged-horizontal"
                cardsArray={[
                  { id: 1, artifactDomain: 'thought-reframe', optionalTitleOrTheme: 'Hard call with mom', optionalMoodRating: 7, savedAtTimestamp: new Date(), optionalSummaryFields: [{ label: 'NEW THOUGHT', value: 'One choice ≠ always disappointing.' }] },
                  { id: 2, artifactDomain: 'gratitude-entry', optionalTitleOrTheme: 'Sunlight', optionalMoodRating: 8, savedAtTimestamp: new Date(Date.now() - 86400000), optionalSummaryFields: [{ label: 'NOTICED', value: 'Light coming through the kitchen window' }] },
                  { id: 3, artifactDomain: 'safety-plan-revision', optionalTitleOrTheme: 'Updated coping list', optionalMoodRating: 5, savedAtTimestamp: new Date(Date.now() - 2 * 86400000), optionalSummaryFields: [{ label: 'CHANGE', value: 'Added breathwork before bed' }] },
                  { id: 4, artifactDomain: 'body-scan-session', optionalTitleOrTheme: 'Morning scan', optionalMoodRating: 6, savedAtTimestamp: new Date(Date.now() - 3 * 86400000), optionalSummaryFields: [{ label: 'NOTICED', value: 'Tightness in jaw, soft belly' }] },
                  { id: 5, artifactDomain: 'self-compassion-letter', optionalTitleOrTheme: 'Letter to younger me', optionalMoodRating: 7, savedAtTimestamp: new Date(Date.now() - 5 * 86400000), optionalSummaryFields: [{ label: 'KEY LINE', value: 'You did the best you could with what you had.' }] },
                ]}
              />
            </VariantRow>
          </PrimitiveFrame>

          {/* ============== Platform-store-dependent (Wave 5) ============== */}
          <SectionHeading>Platform-store-dependent</SectionHeading>

          <PrimitiveFrame
            metaId="quick-mood-micro-widget"
            description="Platform #8 mood capture (1–10). Writes to MoodStore on commit."
          >
            <VariantRow>
              <QuickMoodDemo
                uiSubform="horizontal-slider"
                promptText="How are you feeling right now?"
                sourceActivityId="components-showcase"
                sourceSaveEvent="post-section"
              />
            </VariantRow>
            <VariantRow>
              <QuickMoodDemo
                uiSubform="emoji-scale"
                promptText="Pick the emoji that fits."
                sourceActivityId="components-showcase"
              />
            </VariantRow>
            <VariantRow>
              <QuickMoodDemo
                uiSubform="emoji-anchored-slider"
                promptText="Mood right now"
                lowAnchorEmoji="😔"
                highAnchorEmoji="😊"
                sourceActivityId="components-showcase"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="persona-picker"
            description="Platform #5 chrome dropdown to swap conversational persona."
          >
            <VariantRow>
              <PersonaDemo presentation="dropdown" />
            </VariantRow>
            <VariantRow>
              <PersonaDemo presentation="avatar-list" />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="platform-write-through-hook"
            description="Silent write-through to hope-chest / safety-plan + celebratory animation variant."
          >
            <VariantRow>
              <WriteThroughDemo
                destination="hope-chest"
                confirmationMode="soft-confirm-toast"
                label="Save to hope chest"
              />
            </VariantRow>
            <VariantRow>
              <WriteThroughDemo
                destination="completion-celebration-animation"
                confirmationMode="celebratory-burst-animation"
                label="Trigger celebration"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="(live readout)"
            description="Recent writes from the platform stores — verifies WebSocket round-trip."
          >
            <VariantRow>
              <PlatformWritesPanel />
            </VariantRow>
          </PrimitiveFrame>

          {/* ============== Specialty / heavy (Wave 6) ============== */}
          <SectionHeading>Specialty / heavy</SectionHeading>

          <PrimitiveFrame
            metaId="decorative-illustration-or-backdrop"
            description="Non-interactive decorative asset — backdrop, central icon, animated layer."
          >
            <VariantRow>
              <DecorativeIllustrationOrBackdrop assetRole="central-anchor-icon" metaphorFamily="lotus-zen" animation="pulse" size={80} />
            </VariantRow>
            <VariantRow>
              <DecorativeIllustrationOrBackdrop assetRole="full-screen-backdrop" metaphorFamily="nature-landscape" animation="drift" size={48} />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="back-fill-affordance"
            description="Tappable empty slot OR referent-date picker for retroactive logging."
          >
            <VariantRow>
              <BackFillAffordance shape="tap-target / empty-slot affordance" cellLabel="Mar 12" />
            </VariantRow>
            <VariantRow>
              <BackFillAffordance shape="referent-date picker inside entry form/modal" />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="data-comparison-table"
            description="Multi-column tabular surface, one row per record."
          >
            <VariantRow>
              <DataComparisonTable
                tableKind="comparison-multi-attr"
                rowInteraction="expandable"
                columnDefinitions={[
                  { key: 'name', label: 'Strategy', flex: 2 },
                  { key: 'cost', label: 'Effort' },
                  { key: 'fit', label: 'Fit' },
                ]}
                rows={[
                  { id: 1, cells: { name: 'Walk outside', cost: 'Low', fit: 'High' }, expandedPayload: <StaticTextContentBlock blockRole="rich-text-prose" text="Best when stuck or restless." /> },
                  { id: 2, cells: { name: 'Call a friend', cost: 'Medium', fit: 'Medium' }, expandedPayload: <StaticTextContentBlock blockRole="rich-text-prose" text="Better with someone you trust." /> },
                  { id: 3, cells: { name: 'Journaling', cost: 'Low', fit: 'Variable' } },
                ]}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="chart-trend-line-or-bar"
            description="Bar / line / sparkline / heatmap data viz."
          >
            <VariantRow>
              <ChartTrendLineOrBar
                chartKind="bar"
                dataset={[
                  { x: 0, y: 4 }, { x: 1, y: 6 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 8 }, { x: 5, y: 6 }, { x: 6, y: 9 },
                ]}
                xAxisConfig={{ tickLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] }}
                yAxisConfig={{ min: 0, max: 10 }}
                referenceBand={{ yMin: 7, yMax: 10, label: 'Goal zone' }}
              />
            </VariantRow>
            <VariantRow>
              <ChartTrendLineOrBar
                chartKind="line"
                dataset={[
                  { x: 0, y: 3 }, { x: 1, y: 5 }, { x: 2, y: 4 }, { x: 3, y: 6 }, { x: 4, y: 7 }, { x: 5, y: 6 },
                ]}
                yAxisConfig={{ min: 0, max: 10 }}
              />
            </VariantRow>
            <VariantRow>
              <ChartTrendLineOrBar
                chartKind="heatmap-cell-grid"
                dataset={[
                  ...[0,1,2,3,4,5,6].flatMap(c => [0,1,2].map(r => ({ row: r, col: c, y: Math.round(Math.random()*10) })))
                ]}
                rowHeaderLabels={['Mood', 'Sleep', 'Energy']}
                columnHeaderLabels={['M','T','W','T','F','S','S']}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="draggable-or-swipeable-card"
            description="Drag/swipe gesture-driven card. Try swiping the card or tapping the buttons."
          >
            <VariantRow>
              <SwipeCardDemo />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="timer-countdown-or-session"
            description="Countdown ring or digit timer with phase support."
          >
            <VariantRow>
              <TimerCountdownOrSession timerKind="countdown-ring" durationSeconds={30} />
            </VariantRow>
            <VariantRow>
              <TimerCountdownOrSession timerKind="countdown-digits" durationSeconds={60} />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="breath-pacer-animation"
            description="Animated breathing pacer — circle (4-7-8) or square (box-breathing)."
          >
            <VariantRow>
              <BreathPacerAnimation pacerShape="circle-orb" phaseCount="4-phase-box" />
            </VariantRow>
            <VariantRow>
              <BreathPacerAnimation pacerShape="square-box-breathing" phaseCount="4-phase-box" />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="body-silhouette-with-zones"
            description="Anatomical body canvas with tappable regions — body scan / emotion-body mapping. Tap any zone."
          >
            <VariantRow>
              <BodySilhouetteWithZones
                regionTaxonomy="head-to-toe-classic"
                interactionMode="tap-to-toggle"
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="diagram-canvas-with-nodes-and-edges"
            description="Conceptual diagram — tap any node to focus it; connected edges light up."
          >
            <VariantRow>
              <DiagramCanvasWithNodesAndEdges
                canvasTopology="flowchart-dag"
                nodes={[
                  { id: 'sit', label: 'Situation', position: { x: 18, y: 22 } },
                  { id: 'thought', label: 'Thought', position: { x: 82, y: 22 } },
                  { id: 'feel', label: 'Feeling', position: { x: 82, y: 78 } },
                  { id: 'beh', label: 'Behavior', position: { x: 18, y: 78 } },
                ]}
                edges={[
                  { from: 'sit', to: 'thought', kind: 'directional-arrow' },
                  { from: 'thought', to: 'feel', kind: 'directional-arrow' },
                  { from: 'feel', to: 'beh', kind: 'directional-arrow' },
                  { from: 'beh', to: 'sit', kind: 'directional-arrow' },
                ]}
              />
            </VariantRow>
          </PrimitiveFrame>

          <PrimitiveFrame
            metaId="support-network-map-canvas"
            description="Horizontal rings-as-columns map: self on the left + supporter nodes per ring. Tap a node to see details and contact actions. Crisis line auto-selects per country."
          >
            <VariantRow>
              <SupportNetworkMapDemo />
            </VariantRow>
          </PrimitiveFrame>

              </View>
            }
          />

          {/* activities-demo-temp — outro + activity buttons */}
          <SectionHeading>Activities</SectionHeading>
          <DemoCopy textKey="bottom" />
          <ActivitiesSection onLaunch={handleLaunchActivity} />
          {/* end activities-demo-temp */}

          <View style={{ height: 60 }} />
        </View>
      </Scroll>
      {/* activities-demo-temp — top-level FlowEngine, outside Scroll, so the
          modal isn't clipped by ancestor overflow/mask. */}
      <FlowEngine
        flowDefinition={{ ...activityShowcaseFlow, title: activeActivity?.title || 'Activity' }}
        visible={!!activeActivity}
        onClose={() => setActiveActivity(null)}
        initialContext={{
          sessionId: activeSessionId,
          flowParams: activeActivity
            ? { bookshelfId: activeActivity.bookshelfId, title: activeActivity.title }
            : {},
        }}
        initialParams={
          activeActivity
            ? { activityId: activeActivity.activityId, bookshelfId: activeActivity.bookshelfId }
            : {}
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D8',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  inner: {
    gap: 24,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  pageTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    paddingVertical: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sectionHeading: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    paddingTop: 8,
    paddingBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  variantRow: {
    width: '100%',
  },
  // activities-demo-temp
  instructionsScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  // activities-demo-temp
  instructionsCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: '#F5E6D8',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(112, 68, 199, 0.3)',
  },
  // activities-demo-temp
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(112, 68, 199, 0.2)',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  // activities-demo-temp
  instructionsTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    fontSize: 16,
  },
  // activities-demo-temp
  instructionsClose: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // activities-demo-temp
  instructionsCloseText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#7044C7',
    fontSize: 18,
  },
  // activities-demo-temp
  instructionsBody: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  // activities-demo-temp
  instructionsContent: {
    fontFamily: 'Comfortaa',
    color: '#2D2C2B',
    fontSize: 13,
    lineHeight: 20,
  },
  // activities-demo-temp
  bodyText: {
    fontFamily: 'Comfortaa',
    color: '#2D2C2B',
    fontSize: 14,
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  // activities-demo-temp — mirrors WorkbookLanding row format
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityTitle: {
    flex: 1,
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  activityCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 90, 88, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
