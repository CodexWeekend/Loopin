import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DayPlan } from '@loopin/shared';

import { StopRow } from './stop-row';

type ItineraryDaySectionProps = {
  dayPlan: DayPlan;
  onSelectStop: (stop: DayPlan['stops'][number]) => void;
};

export function ItineraryDaySection({ dayPlan, onSelectStop }: ItineraryDaySectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Day {dayPlan.dayIndex}</Text>
          <Text style={styles.subtitle}>{dayPlan.date}</Text>
        </View>
        <Text style={styles.cost}>${dayPlan.estimatedCost}</Text>
      </View>

      {dayPlan.stops.map((stop, index) => (
        <StopRow
          key={stop.placeId}
          onPress={() => onSelectStop(stop)}
          stop={{ ...stop, timeLabel: ['09:00', '11:30', '14:00'][index] ?? '17:00' }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF9',
    borderColor: '#E6DCCD',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  cost: {
    color: '#8D6700',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subtitle: {
    color: '#5D6474',
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: '#14213D',
    fontSize: 24,
    fontWeight: '800',
  },
});
