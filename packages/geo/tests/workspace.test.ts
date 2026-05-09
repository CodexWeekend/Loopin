import { describe, expect, test } from 'vitest';

import { haversineDistanceKm } from '../src/index';

describe('geo scaffold', () => {
  test('calculates a small but positive distance between nearby points', () => {
    const distance = haversineDistanceKm(
      { lat: 13.7563, lng: 100.5018 },
      { lat: 13.7367, lng: 100.5231 },
    );

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(5);
  });
});
