// activities-beta — beta-only activity browser.
// Shares the ComponentShowcaseScreen implementation but passes
// `betaMode` so the workbook:load calls request `betaOnly: true`
// and the page renders only beta activities (no component catalog
// noise; same launcher + flow plumbing as activities-demo).
import React from 'react';
import ComponentShowcaseScreen from '../screens/ComponentShowcaseScreen';

export default function ActivitiesBeta() {
  return <ComponentShowcaseScreen betaMode />;
}
