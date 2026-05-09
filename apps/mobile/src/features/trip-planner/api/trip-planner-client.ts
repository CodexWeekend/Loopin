import { createInitialItinerary, createTripRecord } from '@loopin/core';
import type { CreateTripInput, Place, Trip } from '@loopin/shared';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

const demoPlacesByCity: Record<string, Place[]> = {
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

export type MobilePlannerState = {
  itinerary: ReturnType<typeof createInitialItinerary>;
  trip: Trip;
};

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/trips`, {
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (response.ok) {
      const payload = (await response.json()) as { trip: Trip };
      return payload.trip;
    }
  }

  return createTripRecord(input, 'trip-mobile-preview');
}

export async function generateItinerary(trip: Trip): Promise<MobilePlannerState> {
  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/api/v1/trips/${trip.id}/itinerary/generate`, {
      method: 'POST',
    });

    if (response.ok) {
      const payload = (await response.json()) as { itinerary: ReturnType<typeof createInitialItinerary>; trip: Trip };
      return payload;
    }
  }

  return {
    itinerary: createInitialItinerary({
      places: demoPlacesByCity[trip.citySlug] ?? demoPlacesByCity.tokyo,
      trip,
    }),
    trip,
  };
}

export async function buildDemoPlannerState(): Promise<MobilePlannerState> {
  const trip = await createTrip({
    citySlug: 'tokyo',
    endDate: '2026-10-02',
    partySize: 2,
    preferences: {
      budget: 'medium',
      hiddenGemPreference: 'mixed',
      interests: ['food', 'culture', 'nature'],
      pace: 'balanced',
    },
    startDate: '2026-10-01',
  });

  return generateItinerary(trip);
}
