import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Trip } from '@loopin/shared';

type TripSummaryCardProps = {
  onGenerate: () => void;
  trip: Trip;
};

export function TripSummaryCard({ onGenerate, trip }: TripSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.tripTitle}>Tokyo Trip</Text>
      <Text style={styles.destination}>Tokyo, Japan</Text>
      <Text style={styles.dates}>
        {trip.startDate} to {trip.endDate}
      </Text>

      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>Party</Text>
          <Text style={styles.metaValue}>2 adults</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>Budget</Text>
          <Text style={styles.metaValue}>Medium</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>Interests</Text>
          <Text style={styles.metaValue}>Food, culture</Text>
        </View>
      </View>

      <Pressable onPress={onGenerate} style={styles.button}>
        <Text style={styles.buttonLabel}>Generate itinerary</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#125CFF',
    borderRadius: 16,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFDF9',
    borderColor: '#E6DCCD',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  dates: {
    color: '#5D6474',
    fontSize: 15,
    marginTop: 6,
  },
  destination: {
    color: '#14213D',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  metaLabel: {
    color: '#5D6474',
    fontSize: 12,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metaValue: {
    color: '#14213D',
    fontSize: 15,
    fontWeight: '700',
  },
  tripTitle: {
    color: '#14213D',
    fontSize: 18,
    fontWeight: '700',
  },
});
