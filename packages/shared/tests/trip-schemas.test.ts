import { describe, expect, test } from 'vitest';

import * as shared from '../src/index';

describe('shared trip schemas', () => {
  test('parses a valid trip creation input', () => {
    expect('createTripInputSchema' in shared).toBe(true);

    const parsed = (shared as Record<string, unknown>).createTripInputSchema;

    expect(
      (parsed as { safeParse: (value: unknown) => { success: boolean } }).safeParse({
        citySlug: 'tokyo',
        endDate: '2026-10-04',
        partySize: 2,
        preferences: {
          budget: 'medium',
          hiddenGemPreference: 'mixed',
          interests: ['food', 'culture'],
          pace: 'balanced',
        },
        startDate: '2026-10-01',
      }).success,
    ).toBe(true);
  });

  test('rejects an invalid hidden gem preference', () => {
    expect('createTripInputSchema' in shared).toBe(true);

    const parsed = (shared as Record<string, unknown>).createTripInputSchema;

    expect(
      (parsed as { safeParse: (value: unknown) => { success: boolean } }).safeParse({
        citySlug: 'tokyo',
        endDate: '2026-10-04',
        partySize: 2,
        preferences: {
          budget: 'medium',
          hiddenGemPreference: 'unknown-mode',
          interests: ['food', 'culture'],
          pace: 'balanced',
        },
        startDate: '2026-10-01',
      }).success,
    ).toBe(false);
  });
});
