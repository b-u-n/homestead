import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { NavigationContainer, useNavigation, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import UsernameCreationScreen from './screens/UsernameCreationScreen';
import AvatarGenerationScreen from './screens/AvatarGenerationScreen';
import TownMapScreen from './screens/TownMapScreen';
import RoomScreen from './screens/RoomScreen';
import InventoryScreen from './screens/InventoryScreen';
import DebugScreen from './screens/DebugScreen';
import CanvasScreen from './screens/CanvasScreen';
import ErrorContainer from './components/ErrorContainer';
import SessionStore from './stores/SessionStore';
import { Colors } from './constants/colors';

const Stack = createStackNavigator();

const DebugButton = () => {
  const navigation = useNavigation();
  
  // Hide debug button for now
  return null;
  
  return (
    <TouchableOpacity 
      style={styles.debugButton}
      onPress={() => navigation.navigate('Debug')}
    >
      <Text style={styles.debugText}>🐛</Text>
    </TouchableOpacity>
  );
};

export default function App() {
  useEffect(() => {
    // Initialize session when app starts
    SessionStore.initSession();
  }, []);

  const onStateChange = (state) => {
    if (state) {
      const currentRoute = state.routes[state.index];
      if (currentRoute) {
        SessionStore.updateLastScreen(currentRoute.name);
      }
    }
  };

  return (
    <NavigationContainer onStateChange={onStateChange}>
      <Stack.Navigator 
        initialRouteName="Landing"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background.primary,
            borderBottomWidth: 2,
            borderBottomColor: Colors.vaporwave.cyan,
            shadowColor: Colors.vaporwave.pink,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
          headerTintColor: Colors.vaporwave.cyan,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 20,
            color: Colors.text.primary,
            textShadowColor: Colors.vaporwave.purple,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          },
          headerBackTitleStyle: {
            color: Colors.vaporwave.cyan,
            fontWeight: '600',
          },
          cardStyle: {
            backgroundColor: Colors.background.primary,
          },
        }}
      >
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="UsernameCreation" 
          component={UsernameCreationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AvatarGeneration" 
          component={AvatarGenerationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TownMap" 
          component={TownMapScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Room" 
          component={RoomScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Inventory" 
          component={InventoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Debug" 
          component={DebugScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Canvas" 
          component={CanvasScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <DebugButton />
      <ErrorContainer />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  debugText: {
    fontSize: 20,
  },
  appScrollView: {
    flex: 1,
  },
});