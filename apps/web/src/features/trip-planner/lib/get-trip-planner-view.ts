import { createInitialItinerary, createTripRecord } from '@loopin/core';
import { getCityDiscoveryView, type TripBudgetBand, type TripInterest } from '@loopin/shared';

type PlannerInput = {
  budget: TripBudgetBand;
  citySlug: string;
  interests: TripInterest[];
};

export type PlannerPreview = ReturnType<typeof buildPlannerPreview>;

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

  const discoveryView = getCityDiscoveryView(input.citySlug) ?? getCityDiscoveryView('tokyo');
  const places = discoveryView?.places ?? [];
  const itinerary = createInitialItinerary({ places, trip });
  const selectedPlaceId = itinerary.dayPlans[0]?.stops[0]?.placeId ?? places[0]?.id ?? '';

  return {
    itinerary: {
      ...itinerary,
      dayPlans: itinerary.dayPlans.map((dayPlan, dayIndex) => ({
        ...dayPlan,
        stops: dayPlan.stops.map((stop, stopIndex) => ({
          ...stop,
          badge: getStopBadge(places.find((place) => place.id === stop.placeId)),
          description: places.find((place) => place.id === stop.placeId)?.summary ?? '',
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

function getStopBadge(place: { hiddennessLabel: string; tags: string[] } | undefined): string | undefined {
  if (!place) {
    return undefined;
  }

  if (place.tags.includes('nightlife')) {
    return 'Food & Drinks';
  }

  if (place.hiddennessLabel === 'Hidden') {
    return 'Hidden gem';
  }

  return undefined;
}
