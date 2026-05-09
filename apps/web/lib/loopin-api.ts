import type {
  City,
  Connection,
  Dish,
  NearMeSuggestion,
  Place,
  QuickAction,
  TravelerPresence,
  Trip,
  User,
  VisibilitySettings,
} from '@/lib/types';

export interface PlacePresenceSummary {
  count: number;
  place: Place;
  travelers: User[];
}

export interface LoopinAppState {
  cities: City[];
  connections: Connection[];
  currentTrip: Trip | null;
  currentUser: User | null;
  dishes: Dish[];
  nearbySuggestions: NearMeSuggestion[];
  placePresence: PlacePresenceSummary[];
  places: Place[];
  quickActions: QuickAction[];
  travelers: TravelerPresence[];
  trips: Trip[];
}

export type LoopinAction =
  | {
      trip?: {
        cityId: string;
        endDate: string;
        id?: string;
        partySize: number;
        preferences: Trip['preferences'];
        startDate: string;
      };
      type: 'create-trip';
    }
  | {
      placeId: string;
      tripId: string;
      type: 'add-stop';
      targetDay: number;
    }
  | {
      stopId: string;
      tripId: string;
      type: 'remove-stop';
    }
  | {
      newPlaceId: string;
      stopId: string;
      tripId: string;
      type: 'swap-stop';
    }
  | {
      stopId: string;
      tripId: string;
      type: 'skip-stop';
    }
  | {
      tripId: string;
      type: 'regenerate-trip';
    }
  | {
      tripId: string;
      type: 'set-active-trip';
    }
  | {
      email: string;
      role: 'editor' | 'viewer';
      tripId: string;
      type: 'invite-collaborator';
    }
  | {
      tripId: string;
      type: 'remove-collaborator';
      userId: string;
    }
  | {
      isPublic: boolean;
      tripId: string;
      type: 'update-trip-visibility';
    }
  | {
      targetUserId: string;
      type: 'connect-traveler';
    }
  | {
      category: 'activity' | 'food' | 'general' | 'nightlife';
      date?: string;
      description: string;
      maxGroupSize?: number;
      type: 'create-intent';
    }
  | {
      profile: {
        firstName?: string;
        interests?: User['interests'];
        lastName?: string;
        visibility?: Partial<VisibilitySettings>;
      };
      type: 'update-profile';
    };

export async function fetchLoopinAppState(tripId?: string): Promise<LoopinAppState> {
  const search = tripId ? `?tripId=${encodeURIComponent(tripId)}` : '';
  const response = await fetch(`/api/app-state${search}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    throw new Error(payload?.error?.message ?? 'Failed to load Loopin app state');
  }

  const payload = (await response.json()) as { state: LoopinAppState };
  return payload.state;
}

export async function runLoopinAction(action: LoopinAction): Promise<LoopinAppState> {
  const response = await fetch('/api/app-action', {
    body: JSON.stringify(action),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    throw new Error(payload?.error?.message ?? 'Failed to apply Loopin action');
  }

  const payload = (await response.json()) as { state: LoopinAppState };
  return payload.state;
}
