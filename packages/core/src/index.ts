import { estimateTravelMinutes } from '@loopin/geo';
import type { CreateTripInput, Itinerary, Place, Trip } from '@loopin/shared';

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
