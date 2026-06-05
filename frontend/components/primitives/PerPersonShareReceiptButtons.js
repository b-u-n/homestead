import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import OverlayStore from '../../stores/OverlayStore';

/**
 * PerPersonShareReceiptButtons — for activities that build a customized
 * artifact per named person (the supporter caregiver guide is the canonical
 * one). Renders one button per person whose `nameBind` resolved to a
 * non-empty string. Tapping a button opens ReceiptPopup with that person's
 * sections assembled.
 *
 * The actual bind resolution happens in ComponentStep so the component itself
 * is a simple presentational layer over `resolvedPersons`:
 *
 *   resolvedPersons: [
 *     { name: "Jamie", sections: [
 *         { heading: "What would help from you", body: "…" },
 *         { heading: "A small note", body: "…" }
 *       ] }
 *   ]
 *
 * Authoring shape (in activity JSON):
 *   {
 *     "ref": "PerPersonShareReceiptButtons",
 *     "props": {
 *       "buttonLabelTemplate": "Open the page for {name}",
 *       "popupTitleTemplate": "For {name}",
 *       "persons": [
 *         { "nameBind": "person_1_name", "sections": [
 *           { "heading": "What would help from you", "bind": "person_1_needs" },
 *           …
 *         ] }
 *       ]
 *     }
 *   }
 *
 * Renderer-injected props consumed (see activities/v2/_SCHEMA.md):
 *   - `resolvedPersons`: ComponentStep walks the `persons` directive, looks
 *     up each `nameBind` and each section's `bind` across all step responses,
 *     and assembles a flat `{ name, sections: [{ heading, body }] }[]` array.
 *     Persons with empty names are filtered out before render.
 */
const PerPersonShareReceiptButtons = observer(({
  resolvedPersons = [],
  buttonLabelTemplate = 'Share with {name}',
  popupTitleTemplate = 'For {name}',
}) => {
  const people = resolvedPersons.filter(p => p && typeof p.name === 'string' && p.name.trim());

  if (people.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { fontSize: FontSettingsStore.getScaledFontSize(11) }]}>
          Name someone earlier and a share button per person will show up here.
        </Text>
      </View>
    );
  }

  // The popup itself is mounted once at the app root (ReceiptPopupOverlay) and
  // reads from OverlayStore. We just open it with the right content.
  const openFor = (person) => OverlayStore.openReceipt({
    title: popupTitleTemplate.replace('{name}', person.name),
    sections: person.sections || [],
  });

  return (
    <View style={styles.wrapper}>
      {people.map((person, idx) => (
        <Pressable key={idx} onPress={() => openFor(person)}>
          <MinkyPanel
            borderRadius={8}
            padding={10}
            paddingTop={10}
            overlayColor="rgba(135, 180, 210, 0.45)"
          >
            <Text
              style={[styles.btnText, { fontSize: FontSettingsStore.getScaledFontSize(12) }]}
            >
              {buttonLabelTemplate.replace('{name}', person.name)}
            </Text>
          </MinkyPanel>
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  btnText: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    color: '#2D2C2B',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  empty: { padding: 8 },
  emptyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '500',
    color: '#5C5A58',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default PerPersonShareReceiptButtons;
