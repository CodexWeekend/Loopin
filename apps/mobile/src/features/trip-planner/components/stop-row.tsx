import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayStop } from '@loopin/shared';

type StopRowProps = {
  onPress: () => void;
  stop: DayStop & { timeLabel?: string };
};

export function StopRow({ onPress, stop }: StopRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.time}>{stop.timeLabel ?? '09:00'}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{stop.placeName}</Text>
        <Text style={styles.meta}>
          {stop.travelMinutesFromPrevious} min transfer • ${stop.estimatedCost}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  meta: {
    color: '#5D6474',
    fontSize: 13,
  },
  row: {
    alignItems: 'center',
    borderTopColor: '#E6DCCD',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 14,
  },
  time: {
    color: '#14213D',
    fontSize: 16,
    fontWeight: '700',
    width: 64,
  },
  title: {
    color: '#14213D',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
});
