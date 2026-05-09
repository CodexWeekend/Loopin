import { cities } from '@/lib/sample-data';
import type { LoopinAction, LoopinAppState, PlacePresenceSummary } from '@/lib/loopin-api';
import {
  addTripStop,
  createConnection,
  createIntent,
  createTrip,
  getAppBootstrapState,
  getTripById,
  regenerateTripItinerary,
  removeTripStop,
  skipTripStop,
  swapTripStop,
  updateConnection,
  updatePresence,
  updateProfile,
  updateTrip,
} from '@/lib/local-db';
import type { Connection, TravelerPresence, User } from '@/lib/types';

function mapPlacePresence(
  travelers: TravelerPresence[],
  placePresence: Array<{
    count: number;
    place: PlacePresenceSummary['place'];
    travelerIds: string[];
  }>,
): PlacePresenceSummary[] {
  return placePresence.map((entry) => ({
    count: entry.count,
    place: entry.place,
    travelers: entry.travelerIds
      .map((travelerId) => travelers.find((traveler) => traveler.user.id === travelerId)?.user)
      .filter(Boolean) as User[],
  }));
}

function mapConnections(
  connections: Array<
    Connection & {
      otherUser: User;
    }
  >,
): Connection[] {
  return connections.map(({ createdAt, id, status, tripContext, users }) => ({
    createdAt,
    id,
    status,
    tripContext,
    users,
  }));
}

function toLoopinAppState(
  userId: string,
  preferredTripId?: string,
): LoopinAppState {
  const bootstrap = getAppBootstrapState(userId);
  const preferredTrip = preferredTripId
    ? bootstrap.trips.find((trip) => trip.id === preferredTripId) ??
      tryGetTrip(preferredTripId, userId)
    : null;
  const currentTrip = preferredTrip ?? bootstrap.activeTrip ?? bootstrap.trips[0] ?? null;
  const cityId = currentTrip?.destination.id ?? bootstrap.discovery.city.id;
  const stableBootstrap = cityId === bootstrap.discovery.city.id ? bootstrap : getAppBootstrapState(userId, cityId);

  return {
    cities,
    connections: mapConnections(stableBootstrap.social.connections),
    currentTrip,
    currentUser: stableBootstrap.user,
    dishes: stableBootstrap.discovery.dishes,
    nearbySuggestions: stableBootstrap.nearby.suggestions,
    placePresence: mapPlacePresence(
      stableBootstrap.social.travelers,
      stableBootstrap.social.placePresence,
    ),
    places: stableBootstrap.discovery.places,
    quickActions: stableBootstrap.nearby.quickActions,
    travelers: stableBootstrap.social.travelers,
    trips: stableBootstrap.trips,
  };
}

function tryGetTrip(tripId: string, userId: string) {
  try {
    return getTripById(tripId, userId);
  } catch {
    return null;
  }
}

export function getLoopinAppState(userId: string, tripId?: string) {
  return toLoopinAppState(userId, tripId);
}

export function applyLoopinAction(userId: string, action: LoopinAction) {
  let selectedTripId: string | undefined;

  switch (action.type) {
    case 'create-trip':
      if (action.trip) {
        selectedTripId = createTrip(userId, {
          cityId: action.trip.cityId,
          endDate: action.trip.endDate,
          generateItinerary: true,
          isPublic: false,
          partySize: action.trip.partySize,
          preferences: action.trip.preferences,
          startDate: action.trip.startDate,
          status: 'planned',
        }).id;
      }
      break;
    case 'add-stop':
      selectedTripId = addTripStop(userId, action.tripId, {
        day: action.targetDay,
        isBookmarked: false,
        placeId: action.placeId,
      }).id;
      break;
    case 'remove-stop':
      selectedTripId = removeTripStop(userId, action.tripId, action.stopId).id;
      break;
    case 'swap-stop':
      selectedTripId = swapTripStop(userId, action.tripId, action.stopId, {
        placeId: action.newPlaceId,
      }).trip.id;
      break;
    case 'skip-stop':
      selectedTripId = skipTripStop(userId, action.tripId, action.stopId, {}).trip.id;
      break;
    case 'regenerate-trip':
      selectedTripId = regenerateTripItinerary(action.tripId, userId).id;
      break;
    case 'set-active-trip':
      selectedTripId = action.tripId;
      break;
    case 'invite-collaborator':
      selectedTripId = action.tripId;
      break;
    case 'update-trip-visibility':
      selectedTripId = updateTrip(userId, action.tripId, {
        isPublic: action.isPublic,
      }).id;
      break;
    case 'connect-traveler': {
      const connections = createConnection(userId, {
        targetUserId: action.targetUserId,
      });
      const pendingConnection = connections.find(
        (connection) =>
          connection.status === 'pending' &&
          connection.users.includes(action.targetUserId),
      );

      if (pendingConnection) {
        updateConnection(userId, {
          connectionId: pendingConnection.id,
          status: 'accepted',
        });
      }
      break;
    }
    case 'create-intent': {
      const bootstrap = getAppBootstrapState(userId);
      const trip = bootstrap.activeTrip ?? bootstrap.trips[0] ?? null;
      const cityId = trip?.destination.id ?? 'tokyo';

      createIntent(userId, {
        category: action.category,
        cityId,
        date: action.date,
        description: action.description,
        maxGroupSize: action.maxGroupSize,
        plannedPlaceIds:
          trip?.days.flatMap((day) => day.stops.map((stop) => stop.place.id)).slice(0, 3) ?? [],
        tripId: trip?.id,
      });
      selectedTripId = trip?.id;
      break;
    }
    case 'update-profile': {
      updateProfile(userId, {
        allowMessages: action.profile.visibility?.allowMessages,
        firstName: action.profile.firstName,
        interests: action.profile.interests,
        lastName: action.profile.lastName,
        showInCityLobby: action.profile.visibility?.showInCityLobby,
        showPlannedPlaces: action.profile.visibility?.showPlannedPlaces,
      });

      const bootstrap = getAppBootstrapState(userId);
      const trip = bootstrap.activeTrip ?? bootstrap.trips[0] ?? null;

      if (trip && action.profile.visibility) {
        updatePresence(userId, {
          cityId: trip.destination.id,
          plannedPlaceIds: action.profile.visibility.showPlannedPlaces
            ? trip.days.flatMap((day) => day.stops.map((stop) => stop.place.id))
            : [],
          showInCityLobby: action.profile.visibility.showInCityLobby ?? false,
          showPlannedPlaces: action.profile.visibility.showPlannedPlaces ?? false,
          tripId: trip.id,
          visibility:
            action.profile.visibility.showInCityLobby === false
              ? 'private'
              : 'public',
        });
        selectedTripId = trip.id;
      }
      break;
    }
    default:
      break;
  }

  return toLoopinAppState(userId, selectedTripId);
}
