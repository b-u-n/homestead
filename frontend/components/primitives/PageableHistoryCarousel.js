import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import HistorySavedEntryCard from './HistorySavedEntryCard';

/**
 * pageable-history-carousel — swipeable/scrollable history surface.
 * Spec: ../_meta-canonical/pageable-history-carousel.json
 *
 * Renders cards via HistorySavedEntryCard by default; pass renderCard to override.
 */
const PageableHistoryCarousel = observer(({
  cardsArray = [],
  initialIndex = 0,
  navigationMode = 'swipe-paged-horizontal',
  pagerCapability = 'basic-pager',
  backfillableSlots,
  filterOrCardType,
  sortOrder,
  renderCard,
  emptyState,
  onPageChanged,
  onCardTapped,
  onBackfillStarted,
  onCardReopenedOrEdited,
  onScrollPositionChanged,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const scrollRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(Dimensions.get('window').width - 64);

  const cardRender = (card, i) => {
    if (renderCard) return renderCard(card, i);
    return (
      <HistorySavedEntryCard
        artifactDomain={card.artifactDomain}
        artifactSnapshot={card.artifactSnapshot}
        savedAtTimestamp={card.savedAtTimestamp || card.savedAt}
        referentDate={card.referentDate}
        optionalMoodRating={card.optionalMoodRating ?? card.moodRating}
        optionalTitleOrTheme={card.optionalTitleOrTheme || card.title}
        optionalSummaryFields={card.optionalSummaryFields || card.summaryFields}
        hasMoodRating={card.hasMoodRating ?? card.optionalMoodRating != null}
        supportsShareExport={card.supportsShareExport}
        supportsEditOrBackfill={card.supportsEditOrBackfill}
        supportsRestoreOrBranch={card.supportsRestoreOrBranch}
        onCardTap={() => onCardTapped && onCardTapped(card, i)}
        onEditOrBackfill={() => pagerCapability === 'reopen-edit-pager' ? (onCardReopenedOrEdited && onCardReopenedOrEdited(card, i)) : null}
      />
    );
  };

  // Empty
  if (!cardsArray.length && !backfillableSlots?.length) {
    return (
      <MinkyPanel borderRadius={12} padding={14} paddingTop={14} overlayColor="rgba(100, 130, 195, 0.25)">
        <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
          {emptyState || 'No entries yet — your history will land here.'}
        </Text>
      </MinkyPanel>
    );
  }

  // Library grid
  if (navigationMode === 'library-collection-grid') {
    return (
      <View style={styles.grid}>
        {cardsArray.map((card, i) => (
          <View key={card.id ?? i} style={styles.gridCell}>
            {cardRender(card, i)}
          </View>
        ))}
      </View>
    );
  }

  // Vertical scroll feed
  if (navigationMode === 'vertical-scroll-feed') {
    return (
      <View style={styles.feed}>
        {cardsArray.map((card, i) => (
          <View key={card.id ?? i} style={styles.feedRow}>
            {cardRender(card, i)}
          </View>
        ))}
      </View>
    );
  }

  // Horizontal scroll strip (free scroll, no snap)
  if (navigationMode === 'horizontal-scroll-strip') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => onScrollPositionChanged && onScrollPositionChanged(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        contentContainerStyle={styles.stripContainer}
      >
        {cardsArray.map((card, i) => (
          <View key={card.id ?? i} style={styles.stripCard}>
            {cardRender(card, i)}
          </View>
        ))}
      </ScrollView>
    );
  }

  // Default: swipe-paged-horizontal
  const handleMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / pageWidth);
    if (next !== index) {
      setIndex(next);
      onPageChanged && onPageChanged(next, cardsArray[next]);
    }
  };

  const goTo = (i) => {
    if (i < 0 || i >= cardsArray.length) return;
    scrollRef.current?.scrollTo({ x: i * pageWidth, animated: true });
    setIndex(i);
    onPageChanged && onPageChanged(i, cardsArray[i]);
  };

  return (
    <View
      style={styles.pagerWrap}
      onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {cardsArray.map((card, i) => (
          <View key={card.id ?? i} style={[styles.page, { width: pageWidth }]}>
            {cardRender(card, i)}
          </View>
        ))}
        {pagerCapability === 'backfill-capable-pager' && backfillableSlots?.length ? (
          backfillableSlots.map((slot, i) => (
            <View key={`bf-${i}`} style={[styles.page, { width: pageWidth }]}>
              <Pressable onPress={() => onBackfillStarted && onBackfillStarted(slot)}>
                <MinkyPanel borderRadius={12} padding={14} paddingTop={14} overlayColor="rgba(100, 130, 195, 0.25)">
                  <Text style={[styles.backfillText, { fontSize: FontSettingsStore.getScaledFontSize(13) }]}>
                    + Add an entry for {slot.label || slot.date}
                  </Text>
                </MinkyPanel>
              </Pressable>
            </View>
          ))
        ) : null}
      </ScrollView>
      <View style={styles.navRow}>
        <Pressable onPress={() => goTo(index - 1)} disabled={index === 0} hitSlop={8} style={styles.arrowBtn}>
          <Text style={[styles.arrow, index === 0 && styles.arrowDisabled]}>‹</Text>
        </Pressable>
        <View style={styles.dotRow}>
          {cardsArray.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={6} style={styles.dotHit}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => goTo(index + 1)} disabled={index >= cardsArray.length - 1} hitSlop={8} style={styles.arrowBtn}>
          <Text style={[styles.arrow, index >= cardsArray.length - 1 && styles.arrowDisabled]}>›</Text>
        </Pressable>
      </View>
      <Text style={styles.pageLabel}>
        {index + 1} of {cardsArray.length}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pagerWrap: { gap: 8 },
  page: { paddingHorizontal: 4 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  arrowBtn: {
    minWidth: 44, minHeight: 44,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  arrow: { fontSize: 28, color: '#7044C7', lineHeight: 30 },
  arrowDisabled: { color: 'rgba(112, 68, 199, 0.25)' },
  dotRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  dotHit: { padding: 4 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(100, 130, 195, 0.35)',
  },
  dotActive: { backgroundColor: '#7044C7', transform: [{ scale: 1.3 }] },
  pageLabel: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#454342',
    fontSize: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  feed: { gap: 10 },
  feedRow: {},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCell: { width: '48%', minWidth: 160 },
  stripContainer: { gap: 10, paddingHorizontal: 4 },
  stripCard: { width: 240 },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#454342',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  backfillText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    color: '#7044C7',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default PageableHistoryCarousel;
