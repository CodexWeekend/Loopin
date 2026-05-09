import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayStop } from '@loopin/shared';

type StopDetailSheetProps = {
  onClose: () => void;
  stop: DayStop | null;
};

export function StopDetailSheet({ onClose, stop }: StopDetailSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={Boolean(stop)}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.label}>Selected stop</Text>
          <Text style={styles.title}>{stop?.placeName}</Text>
          <Text style={styles.meta}>
            {stop?.visitDurationMinutes ?? 0} min visit • ${stop?.estimatedCost ?? 0}
          </Text>
          <Pressable onPress={onClose} style={styles.button}>
            <Text style={styles.buttonLabel}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(20, 33, 61, 0.25)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#125CFF',
    borderRadius: 16,
    marginTop: 20,
    paddingVertical: 14,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    color: '#5D6474',
    fontSize: 13,
  },
  meta: {
    color: '#5D6474',
    fontSize: 15,
    marginTop: 8,
  },
  sheet: {
    backgroundColor: '#FFFDF9',
    borderRadius: 28,
    padding: 20,
  },
  title: {
    color: '#14213D',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 10,
  },
});
