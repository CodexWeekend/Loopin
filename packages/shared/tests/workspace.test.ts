import { describe, expect, test } from 'vitest';

import { createTripDraft, tripBudgetBands } from '../src/index';

describe('shared scaffold', () => {
  test('creates a bootstrap trip draft with a valid budget band', () => {
    const trip = createTripDraft('tokyo');

    expect(trip.citySlug).toBe('tokyo');
    expect(tripBudgetBands).toContain(trip.budget);
  });
});
