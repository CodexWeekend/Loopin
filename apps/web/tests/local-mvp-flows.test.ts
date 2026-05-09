import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
  __resetLocalDbForTests,
  addTripStop,
  createConnection,
  createIntent,
  createTrip,
  ensureDemoData,
  getAppBootstrapState,
  swapTripStop,
  updateConnection,
  updateProfile,
  upsertUser,
} from '../lib/local-db';

let tempDbDir = '';

beforeEach(() => {
  tempDbDir = mkdtempSync(join(tmpdir(), 'loopin-web-'));
  process.env.LOOPIN_LOCAL_DB_PATH = join(tempDbDir, 'loopin.test.sqlite');
  __resetLocalDbForTests();
});

afterEach(() => {
  __resetLocalDbForTests();
  delete process.env.LOOPIN_LOCAL_DB_PATH;
  rmSync(tempDbDir, { force: true, recursive: true });
});

describe('local MVP flows', () => {
  test('supports bootstrap, trip planning, and social mutations', () => {
    ensureDemoData();

    const user = upsertUser({
      email: 'flowtest@loopin.local',
      firstName: 'Flow',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=flowtest',
      lastName: 'Test',
      name: 'Flow Test',
      provider: 'credentials',
    });

    const before = getAppBootstrapState(user.id);
    expect(before.trips.length).toBe(0);

    const createdTrip = createTrip(user.id, {
      cityId: 'tokyo',
      endDate: '2026-06-03',
      generateItinerary: true,
      isPublic: false,
      partySize: 2,
      preferences: {
        budget: 'mid',
        dailyBudget: 120,
        hiddenGemPreference: 'mixed',
        interests: ['food', 'culture'],
        pace: 'balanced',
      },
      startDate: '2026-06-01',
      status: 'planned',
    });

    expect(createdTrip.days.length).toBe(3);

    const targetDay = createdTrip.days[0]!;
    addTripStop(user.id, createdTrip.id, {
      dayId: targetDay.id,
      isBookmarked: false,
      placeId: 'bakery-sasaki',
    });

    const refreshedTrip = getAppBootstrapState(user.id).trips.find((trip) => trip.id === createdTrip.id)!;
    expect(refreshedTrip.days[0]!.stops.some((stop) => stop.place.id === 'bakery-sasaki')).toBe(true);

    const firstStopId = refreshedTrip.days[0]!.stops[0]!.id;
    swapTripStop(user.id, refreshedTrip.id, firstStopId, { placeId: 'senso-ji' });

    createIntent(user.id, {
      category: 'food',
      cityId: 'tokyo',
      date: '2026-06-02',
      description: 'Testing food crawl intent',
      maxGroupSize: 3,
      plannedPlaceIds: ['senso-ji'],
      tripId: refreshedTrip.id,
    });

    const connections = createConnection(user.id, {
      targetUserId: 'user-2',
      tripId: refreshedTrip.id,
    });

    updateConnection(user.id, {
      connectionId: connections[0]!.id,
      status: 'accepted',
    });

    updateProfile(user.id, {
      allowMessages: true,
      interests: ['food', 'culture', 'art'],
      showInCityLobby: true,
      showPlannedPlaces: true,
    });

    const after = getAppBootstrapState(user.id);
    const activeTrip = after.activeTrip;

    expect(after.trips.length).toBe(before.trips.length + 1);
    expect(activeTrip?.id).toBe(createdTrip.id);
    expect(activeTrip?.days[0]?.stops[0]?.place.id).toBe('senso-ji');
    expect(after.user?.interests).toEqual(['food', 'culture', 'art']);
    expect(after.social.intents.length).toBeGreaterThan(0);
    expect(after.social.connections.some((item) => item.status === 'accepted')).toBe(true);
    expect(after.nearby.suggestions.length).toBeGreaterThan(0);
  });
});
