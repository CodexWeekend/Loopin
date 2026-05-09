import { createInitialItinerary, createTripRecord } from '@loopin/core';
import type { Place, TripBudgetBand, TripInterest } from '@loopin/shared';

type PlannerInput = {
  budget: TripBudgetBand;
  citySlug: string;
  interests: TripInterest[];
};

export type PlannerPreview = ReturnType<typeof buildPlannerPreview>;

const seedPlacesByCity: Record<string, Place[]> = {
  tokyo: [
    {
      category: 'landmark',
      citySlug: 'tokyo',
      costLevel: 1,
      hiddennessLabel: 'Hidden',
      hiddennessScore: 0.72,
      id: 'tokyo-meiji-jingu',
      lat: 35.6764,
      lng: 139.6993,
      name: 'Meiji Jingu Shrine',
      popularityScore: 0.83,
      visitDurationMinutes: 90,
    },
    {
      category: 'food',
      citySlug: 'tokyo',
      costLevel: 1,
      hiddennessLabel: 'Balanced',
      hiddennessScore: 0.46,
      id: 'tokyo-onibus',
      lat: 35.6443,
      lng: 139.6985,
      name: 'ONIBUS Coffee Nakameguro',
      popularityScore: 0.7,
      visitDurationMinutes: 45,
    },
    {
      category: 'food',
      citySlug: 'tokyo',
      costLevel: 2,
      hiddennessLabel: 'Balanced',
      hiddennessScore: 0.31,
      id: 'tokyo-menya-musashi',
      lat: 35.6938,
      lng: 139.7004,
      name: 'Menya Musashi Shinjuku',
      popularityScore: 0.84,
      visitDurationMinutes: 60,
    },
    {
      category: 'viewpoint',
      citySlug: 'tokyo',
      costLevel: 1,
      hiddennessLabel: 'Hidden',
      hiddennessScore: 0.68,
      id: 'tokyo-21-design-sight',
      lat: 35.6654,
      lng: 139.7308,
      name: '21_21 DESIGN SIGHT',
      popularityScore: 0.63,
      visitDurationMinutes: 75,
    },
    {
      category: 'food',
      citySlug: 'tokyo',
      costLevel: 2,
      hiddennessLabel: 'Balanced',
      hiddennessScore: 0.4,
      id: 'tokyo-omoide-yokocho',
      lat: 35.6927,
      lng: 139.6995,
      name: 'Omoide Yokocho',
      popularityScore: 0.89,
      visitDurationMinutes: 90,
    },
    {
      category: 'park',
      citySlug: 'tokyo',
      costLevel: 1,
      hiddennessLabel: 'Hidden',
      hiddennessScore: 0.66,
      id: 'tokyo-shinjuku-gyoen',
      lat: 35.6852,
      lng: 139.7101,
      name: 'Shinjuku Gyoen National Garden',
      popularityScore: 0.79,
      visitDurationMinutes: 90,
    },
  ],
};

const stopCopy: Record<
  string,
  {
    detail: string;
    district: string;
    tag?: string;
  }
> = {
  'tokyo-21-design-sight': {
    detail: 'Design museum by Tadao Ando.',
    district: 'Roppongi, Tokyo',
  },
  'tokyo-meiji-jingu': {
    detail: 'Serene Shinto shrine surrounded by tall trees. A spiritual start to the day.',
    district: 'Shibuya, Tokyo',
  },
  'tokyo-menya-musashi': {
    detail: 'Legendary ramen spot since 1996.',
    district: 'Shinjuku, Tokyo',
  },
  'tokyo-omoide-yokocho': {
    detail: 'Nostalgic alley with tiny yakitori stalls.',
    district: 'Shinjuku, Tokyo',
    tag: 'Food & Drinks',
  },
  'tokyo-onibus': {
    detail: 'Small-batch coffee in a cozy riverside spot.',
    district: 'Meguro, Tokyo',
  },
  'tokyo-shinjuku-gyoen': {
    detail: 'Beautiful garden with seasonal blooms.',
    district: 'Shinjuku, Tokyo',
  },
};

const timelineTimes = [
  ['09:00', '11:00', '13:00', '15:30', '18:30'],
  ['08:30', '10:30', '13:00', '15:30', '18:00'],
] as const;

export function buildPlannerPreview(input: PlannerInput = {
  budget: 'medium',
  citySlug: 'tokyo',
  interests: ['food', 'culture', 'nature'],
}) {
  const trip = createTripRecord(
    {
      citySlug: input.citySlug,
      endDate: '2026-10-02',
      partySize: 2,
      preferences: {
        budget: input.budget,
        hiddenGemPreference: 'mixed',
        interests: input.interests,
        pace: 'balanced',
      },
      startDate: '2026-10-01',
    },
    'trip-web-preview',
  );

  const places = seedPlacesByCity[input.citySlug] ?? seedPlacesByCity.tokyo;
  const itinerary = createInitialItinerary({ places, trip });
  const selectedPlaceId = itinerary.dayPlans[0]?.stops[0]?.placeId ?? places[0]?.id ?? '';

  return {
    itinerary: {
      ...itinerary,
      dayPlans: itinerary.dayPlans.map((dayPlan, dayIndex) => ({
        ...dayPlan,
        stops: dayPlan.stops.map((stop, stopIndex) => ({
          ...stop,
          badge:
            stopCopy[stop.placeId]?.tag ??
            (places.find((place) => place.id === stop.placeId)?.hiddennessLabel === 'Hidden'
              ? 'Hidden gem'
              : undefined),
          description: stopCopy[stop.placeId]?.detail ?? '',
          distanceKm: (stopIndex * 1.1 + 0.3 + dayIndex).toFixed(1),
          timeLabel: timelineTimes[dayIndex]?.[stopIndex] ?? '17:00',
        })),
      })),
    },
    selectedPlaceId,
    smartSwap: {
      label: 'Swap ONIBUS Coffee Nakameguro with Bakery Sasaki',
      reason: 'Quieter spot nearby with incredible shokupan.',
      savedCost: 2,
      walkDeltaMinutes: 3,
    },
    trip,
  };
}
