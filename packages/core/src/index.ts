import { estimateTravelMinutes } from '@loopin/geo';
import type {
  CityOverview,
  CityPlacesQuery,
  CreateTripInput,
  DiscoveryCity,
  DiscoveryNeighborhood,
  Itinerary,
  Place,
  Trip,
} from '@loopin/shared';

export type PlanningStage = 'bootstrap' | 'vertical-slice' | 'feature-complete';

export const planningStages: PlanningStage[] = [
  'bootstrap',
  'vertical-slice',
  'feature-complete',
];

export const latestCompletedStage: PlanningStage = 'bootstrap';

export function createTripRecord(input: CreateTripInput, id: string): Trip {
  return {
    ...input,
    id,
    status: 'draft',
  };
}

export function createInitialItinerary({
  places,
  trip,
}: {
  places: Pick<Place, 'costLevel' | 'id' | 'lat' | 'lng' | 'name' | 'visitDurationMinutes'>[];
  trip: Pick<Trip, 'endDate' | 'id' | 'startDate'>;
}): Itinerary {
  const tripDates = enumerateTripDates(trip.startDate, trip.endDate);
  const stopsPerDay = Math.max(1, Math.ceil(places.length / tripDates.length));

  const dayPlans = tripDates.map((date, index) => {
    const dayPlaces = places.slice(index * stopsPerDay, (index + 1) * stopsPerDay);

    return {
      date,
      dayIndex: index + 1,
      estimatedCost: dayPlaces.reduce((total, place) => total + place.costLevel * 15, 0),
      estimatedTravelMinutes: estimateTravelMinutesForDay(dayPlaces),
      stops: dayPlaces.map((place, placeIndex) => ({
        estimatedCost: place.costLevel * 15,
        placeId: place.id,
        placeName: place.name,
        sequence: placeIndex + 1,
        travelMinutesFromPrevious:
          placeIndex === 0
            ? 0
            : estimateTravelMinutes(dayPlaces[placeIndex - 1]!, place, 18),
        visitDurationMinutes: place.visitDurationMinutes,
      })),
    };
  });

  return {
    dayPlans,
    generatedAt: new Date().toISOString(),
    tripId: trip.id,
  };
}

export function buildCityOverview({
  city,
  neighborhoods,
  places,
}: {
  city: DiscoveryCity;
  neighborhoods: DiscoveryNeighborhood[];
  places: Array<Pick<Place, 'hiddennessLabel'>>;
}): CityOverview {
  return {
    city,
    hiddenGemCount: places.filter((place) => place.hiddennessLabel === 'Hidden').length,
    neighborhoods: neighborhoods.map((neighborhood) => ({
      budgetScore: neighborhood.budgetScore,
      name: neighborhood.name,
      slug: neighborhood.slug,
      strengths: neighborhood.strengthTags,
      summary: neighborhood.summary,
      walkabilityScore: neighborhood.walkabilityScore,
    })),
  };
}

export function filterCityPlaces({
  filters,
  places,
}: {
  filters: CityPlacesQuery;
  places: Place[];
}): Place[] {
  return places.filter((place) => {
    if (filters.category && place.category !== filters.category) {
      return false;
    }

    if (filters.hiddenness) {
      const normalizedHiddenness = place.hiddennessLabel.toLowerCase();

      if (normalizedHiddenness !== filters.hiddenness) {
        return false;
      }
    }

    if (filters.budget) {
      const maxCostLevel = budgetToMaxCostLevel(filters.budget);

      if (place.costLevel > maxCostLevel) {
        return false;
      }
    }

    return true;
  });
}

export function rankNearbyPlaces({
  category,
  minutesAvailable,
  origin,
  places,
}: {
  category?: Place['category'];
  minutesAvailable: number;
  origin: { lat: number; lng: number };
  places: Pick<
    Place,
    'category' | 'hiddennessLabel' | 'hiddennessScore' | 'id' | 'lat' | 'lng' | 'name' | 'popularityScore' | 'summary' | 'visitDurationMinutes'
  >[];
}): Array<
  Pick<Place, 'category' | 'id' | 'name' | 'summary'> & {
    score: number;
    travelMinutes: number;
  }
> {
  return places
    .filter((place) => !category || place.category === category)
    .map((place) => {
      const travelMinutes = estimateTravelMinutes(origin, place, 18);
      const fitsTimeWindow = place.visitDurationMinutes + travelMinutes <= minutesAvailable;
      const score =
        (fitsTimeWindow ? 30 : -30) +
        (place.hiddennessScore ?? 0) * 10 +
        (place.popularityScore ?? 0) * 5 -
        travelMinutes;

      return {
        category: place.category,
        id: place.id,
        name: place.name,
        score,
        summary: place.summary,
        travelMinutes,
      };
    })
    .sort((left, right) => right.score - left.score);
}

function enumerateTripDates(startDate: string, endDate: string): string[] {
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const dates: string[] = [];

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function estimateTravelMinutesForDay(
  places: Pick<Place, 'lat' | 'lng'>[],
): number {
  let totalMinutes = 0;

  for (let index = 1; index < places.length; index += 1) {
    totalMinutes += estimateTravelMinutes(places[index - 1]!, places[index]!, 18);
  }

  return totalMinutes;
}

function budgetToMaxCostLevel(budget: CityPlacesQuery['budget']): number {
  switch (budget) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
    default:
      return 3;
  }
}
