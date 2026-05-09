import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';

import { TripPlannerScreen } from './src/features/trip-planner/screens/trip-planner-screen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF5ED' }}>
      <StatusBar barStyle="dark-content" />
      <TripPlannerScreen />
    </SafeAreaView>
  );
}
