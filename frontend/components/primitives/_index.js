// Barrel export for primitives. Only exports what has been written so far.
// Add to this file as new waves land.

// Wave 1 — atomic form controls
export { default as StaticTextContentBlock } from './StaticTextContentBlock';
export { default as FreeTextShortInput } from './FreeTextShortInput';
export { default as FreeTextMultilineArea } from './FreeTextMultilineArea';
export { default as NumericRatingSlider } from './NumericRatingSlider';
export { default as BinaryStateToggle } from './BinaryStateToggle';
export { default as OptionSelectDropdown } from './OptionSelectDropdown';
export { default as Checkbox } from './Checkbox';

// Wave 2 — buttons & chips
export { default as ButtonPrimarySaveCta } from './ButtonPrimarySaveCta';
export { default as ButtonSecondaryAction } from './ButtonSecondaryAction';
export { default as ButtonAddNewItem } from './ButtonAddNewItem';
export { default as ButtonExportShareAction } from './ButtonExportShareAction';
export { default as ChipValueBadgeReadonly } from './ChipValueBadgeReadonly';
export { default as ChipMultiSelectTagGroup } from './ChipMultiSelectTagGroup';
export { default as ChipSuggestionOrAction } from './ChipSuggestionOrAction';

// Wave 3 — chrome / output
export { default as ModeToggle } from './ModeToggle';
export { default as ProgressCounterOrBar } from './ProgressCounterOrBar';
export { default as StickyTopBannerChrome } from './StickyTopBannerChrome';
export { default as CollapsibleSection } from './CollapsibleSection';
export { default as SummaryOutputCard } from './SummaryOutputCard';
export { default as HistorySavedEntryCard } from './HistorySavedEntryCard';

// Showcase wrapper
export { default as PrimitiveFrame } from './PrimitiveFrame';

// ReflectionPanel — score-keyed reflective prose. Given a set of scored items (e.g. from a
// questionnaire step) and a `reflections` map keyed by itemId → score → array of responses,
// renders one randomly-chosen warm response per item based on the user's score.
// Reflections content is fully per-activity (passed in the activity JSON), nothing hard-coded.
export { default as ReflectionPanel } from '../workbook/ReflectionPanel';

// JournalStep — long-form timed writing surface with optional word count + re-read mode.
// Useful as the closing step of an assessment / session for unstructured reflection.
export { default as JournalStep } from '../workbook/JournalStep';

// ReflectionFraming — the warm "stay with what came up" header that precedes the
// closing JournalStep on every save step. Rotates through 19 paired title+body
// variations on each mount.
export { default as ReflectionFraming } from '../workbook/ReflectionFraming';

// Wave 4 — layout containers
export { default as LayoutSplitScreenTwoPane } from './LayoutSplitScreenTwoPane';
export { default as LayoutQuadrantOrGridCells } from './LayoutQuadrantOrGridCells';
export { default as ModalOverlayOrBottomSheet } from './ModalOverlayOrBottomSheet';
export { default as PageableHistoryCarousel } from './PageableHistoryCarousel';

// Wave 5 — platform-store-dependent
export { default as QuickMoodMicroWidget } from './QuickMoodMicroWidget';
export { default as PersonaPicker } from './PersonaPicker';
export { default as PlatformWriteThroughHook } from './PlatformWriteThroughHook';

// Wave 6 — specialty / heavy
export { default as DecorativeIllustrationOrBackdrop } from './DecorativeIllustrationOrBackdrop';
export { default as BackFillAffordance } from './BackFillAffordance';
export { default as DataComparisonTable } from './DataComparisonTable';
export { default as ChartTrendLineOrBar } from './ChartTrendLineOrBar';
export { default as DraggableOrSwipeableCard } from './DraggableOrSwipeableCard';
export { default as TimerCountdownOrSession } from './TimerCountdownOrSession';
export { default as BreathPacerAnimation } from './BreathPacerAnimation';
export { default as BodySilhouetteWithZones } from './BodySilhouetteWithZones';
export { default as BodyScanSummary } from './BodyScanSummary';
export { default as DiagramCanvasWithNodesAndEdges } from './DiagramCanvasWithNodesAndEdges';
export { default as SupportNetworkMapCanvas } from './SupportNetworkMapCanvas';
