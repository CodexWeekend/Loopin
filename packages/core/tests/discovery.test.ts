import { describe, expect, test } from 'vitest';

import * as core from '../src/index';

describe('discovery foundation', () => {
  test('builds a city overview with neighborhood summaries and hidden-gem counts', () => {
    expect(typeof (core as Record<string, unknown>).buildCityOverview).toBe('function');

    const overview = ((core as Record<string, unknown>).buildCityOverview as (value: unknown) => {
      hiddenGemCount: number;
      neighborhoods: Array<{ name: string; strengths: string[] }>;
    })({
      city: {
        countryCode: 'JP',
        name: 'Tokyo',
        slug: 'tokyo',
      },
      neighborhoods: [
        {
          budgetScore: 4,
          name: 'Shibuya',
          strengthTags: ['nightlife', 'food'],
          walkabilityScore: 5,
        },
        {
          budgetScore: 3,
          name: 'Meguro',
          strengthTags: ['cafes', 'local'],
          walkabilityScore: 4,
        },
      ],
      places: [
        {
          category: 'food',
          hiddennessLabel: 'Hidden',
          id: 'p1',
          name: 'Hidden Cafe',
        },
        {
          category: 'landmark',
          hiddennessLabel: 'Touristy',
          id: 'p2',
          name: 'Main Temple',
        },
      ],
    });

    expect(overview.hiddenGemCount).toBe(1);
    expect(overview.neighborhoods[0]?.name).toBe('Shibuya');
    expect(overview.neighborhoods[1]?.strengths).toContain('local');
  });
});
