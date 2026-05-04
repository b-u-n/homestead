import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MapCanvas from '../../../../components/MapCanvas';
import RoomEditor from '../../../../components/RoomEditor';

export default function MapLocation() {
  const params = useLocalSearchParams();
  const { location, flow, dropId, ...flowParams } = params;

  // Handle different types of location parameter
  let locationStr = 'town-square';

  if (Array.isArray(location)) {
    locationStr = location[0];
  } else if (typeof location === 'object' && location !== null) {
    locationStr = location.pathname || location.path || location.name || 'town-square';
  } else if (typeof location === 'string') {
    locationStr = location;
  }

  // Pass flow query params to MapCanvas for deep-linking
  const initialFlow = typeof flow === 'string' ? flow : undefined;
  const initialDropId = typeof dropId === 'string' ? dropId : undefined;

  return (
    <View style={{ flex: 1 }}>
      <MapCanvas location={locationStr} initialFlow={initialFlow} initialDropId={initialDropId} initialFlowParams={flowParams} />
      <RoomEditor location={locationStr} />
    </View>
  );
}
