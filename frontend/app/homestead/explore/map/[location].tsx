import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import MapCanvas from '../../../../components/MapCanvas';

export default function MapLocation() {
  const params = useLocalSearchParams();
  const { location } = params;

  // Handle different types of location parameter
  let locationStr = 'town-square';

  if (Array.isArray(location)) {
    locationStr = location[0];
  } else if (typeof location === 'object' && location !== null) {
    // If it's an object, try common properties
    locationStr = location.pathname || location.path || location.name || 'town-square';
  } else if (typeof location === 'string') {
    locationStr = location;
  }

  return <MapCanvas location={locationStr} />;
}
