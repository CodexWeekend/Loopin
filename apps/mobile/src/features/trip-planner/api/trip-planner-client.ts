import { createInitialItinerary, createTripRecord } from '@loopin/core';
import { getCityDiscoveryView, type CreateTripInput, type Trip } from '@loopin/shared';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

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
      places: getCityDiscoveryView(trip.citySlug)?.places ?? getCityDiscoveryView('tokyo')?.places ?? [],
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
