import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DayStop } from '@loopin/shared';

import { buildDemoPlannerState, generateItinerary, type MobilePlannerState } from '../api/trip-planner-client';
import { ItineraryDaySection } from '../components/itinerary-day-section';
import { StopDetailSheet } from '../components/stop-detail-sheet';
import { TripSummaryCard } from '../components/trip-summary-card';

export function TripPlannerScreen() {
  const [selectedStop, setSelectedStop] = useState<DayStop | null>(null);
  const [state, setState] = useState<MobilePlannerState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    buildDemoPlannerState().then((nextState) => {
      if (mounted) {
        setState(nextState);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleGenerate() {
    if (!state) {
      return;
    }

    setLoading(true);
    const nextState = await generateItinerary(state.trip);
    setState(nextState);
    setLoading(false);
  }

  if (loading && !state) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#125CFF" size="large" />
      </View>
    );
  }

  if (!state) {
    return null;
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Tokyo Trip</Text>
        <TripSummaryCard onGenerate={handleGenerate} trip={state.trip} />

        <View style={styles.todayBlock}>
          <Text style={styles.todayLabel}>Today&apos;s plan</Text>
          {state.itinerary.dayPlans.map((dayPlan) => (
            <ItineraryDaySection key={dayPlan.dayIndex} dayPlan={dayPlan} onSelectStop={setSelectedStop} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        {['Trips', 'Explore', 'Now', 'Social', 'Profile'].map((label) => (
          <Text key={label} style={label === 'Trips' ? styles.tabActive : styles.tab}>
            {label}
          </Text>
        ))}
      </View>

      <StopDetailSheet onClose={() => setSelectedStop(null)} stop={selectedStop} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    color: '#14213D',
    fontSize: 34,
    fontWeight: '800',
  },
  root: {
    backgroundColor: '#FAF5ED',
    flex: 1,
  },
  tab: {
    color: '#5D6474',
    fontSize: 13,
    fontWeight: '600',
  },
  tabActive: {
    color: '#125CFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: '#FFFDF9',
    borderTopColor: '#E6DCCD',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 18,
    paddingTop: 12,
  },
  todayBlock: {
    gap: 16,
  },
  todayLabel: {
    color: '#14213D',
    fontSize: 18,
    fontWeight: '700',
  },
});
