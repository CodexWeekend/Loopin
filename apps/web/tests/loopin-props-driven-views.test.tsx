// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ExploreView } from '../components/loopin/explore-view';
import { NowView } from '../components/loopin/now-view';
import { TripWizard } from '../components/loopin/trip-wizard';
import type { City, DayPlan, Dish, NearMeSuggestion, Place, QuickAction } from '../lib/types';

const testCity: City = {
  id: 'seoul',
  name: 'Seoul',
  country: 'South Korea',
  countryCode: 'KR',
  image: 'https://example.com/seoul.jpg',
  description: 'A custom city for test coverage.',
  timezone: 'Asia/Seoul',
  currency: 'KRW',
  language: 'Korean',
  highlights: ['Street food', 'Design', 'Palaces'],
  neighborhoods: [
    {
      id: 'hongdae',
      name: 'Hongdae',
      description: 'Creative district',
      bestFor: ['Nightlife'],
      vibes: ['Energetic'],
      priceLevel: 2,
    },
  ],
};

const testPlace: Place = {
  id: 'custom-place',
  name: 'Custom Gallery',
  description: 'Caller-provided place content.',
  image: 'https://example.com/place.jpg',
  lat: 37.5665,
  lng: 126.978,
  category: 'museum',
  tags: ['Art'],
  costLevel: 2,
  estimatedCost: 12,
  typicalDuration: 75,
  hiddenness: 'hidden',
  popularityScore: 40,
  hiddenGemScore: 88,
  neighborhood: 'Hongdae',
};

const testDish: Dish = {
  id: 'tteokbokki',
  name: 'Tteokbokki',
  description: 'Spicy rice cakes.',
  image: 'https://example.com/dish.jpg',
  category: 'snack',
  cuisine: 'Korean',
  priceRange: '$6-10',
  bestPlaces: [testPlace],
};

const testCurrentDay: DayPlan = {
  id: 'day-1',
  day: 1,
  date: '2026-05-09',
  estimatedCost: 28,
  stops: [
    {
      id: 'stop-1',
      place: {
        ...testPlace,
        id: 'stop-place-1',
        name: 'Breakfast Stop',
        hiddenness: 'balanced',
      },
      startTime: '09:00',
      endTime: '10:00',
      order: 1,
      isBookmarked: false,
      travelFromPrevious: { distance: 0, duration: 0, mode: 'walk' },
    },
    {
      id: 'stop-2',
      place: {
        ...testPlace,
        id: 'stop-place-2',
        name: 'Lunch Stop',
        hiddenness: 'touristy',
      },
      startTime: '12:00',
      endTime: '13:00',
      order: 2,
      isBookmarked: false,
      travelFromPrevious: { distance: 1.2, duration: 8, mode: 'walk' },
    },
  ],
};

const testQuickActions: QuickAction[] = [
  {
    id: 'hidden-gems',
    label: 'Local favorites',
    icon: 'sparkles',
    filters: {},
  },
];

const testSuggestions: NearMeSuggestion[] = [
  {
    place: {
      ...testPlace,
      id: 'nearby-place',
      name: 'Late-night Studio Cafe',
      category: 'cafe',
    },
    distance: 0.4,
    matchScore: 93,
    reason: 'Quiet spot close to your current route.',
    estimatedArrival: '6 min walk',
    fitsTimeSlot: true,
  },
];

describe('Loopin reference views', () => {
  test('render caller-provided discovery, now, and wizard data', () => {
    render(
      <>
        <ExploreView
          city={testCity}
          places={[testPlace]}
          dishes={[testDish]}
        />
        <NowView
          cityName="Seoul"
          currentNeighborhoodLabel="Hongdae"
          currentDay={testCurrentDay}
          currentStopIndex={0}
          suggestions={testSuggestions}
          quickActions={testQuickActions}
        />
        <TripWizard
          open
          onClose={() => {}}
          onComplete={() => {}}
          cities={[testCity]}
        />
      </>,
    );

    expect(screen.getAllByText('Seoul').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Custom Gallery').length).toBeGreaterThan(0);
    expect(screen.getByText('Late-night Studio Cafe')).toBeDefined();
    expect(screen.getByText('Local favorites')).toBeDefined();
  });
});
