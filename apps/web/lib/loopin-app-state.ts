import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
  cities,
  places,
  quickActions,
  sampleTrip,
  sampleUsers,
  tokyoDishes,
  tokyoTravelers,
} from '@/lib/sample-data';
import type { LoopinAction, LoopinAppState, PlacePresenceSummary } from '@/lib/loopin-api';
import type {
  Collaborator,
  Connection,
  DayPlan,
  DayStop,
  HiddenGemPreference,
  InterestType,
  NearMeSuggestion,
  Place,
  TravelIntent,
  TravelerPresence,
  Trip,
  User,
  VisibilitySettings,
} from '@/lib/types';

type DbUserRow = {
  allow_messages: number | null;
  avatar_url: null | string;
  country_code: null | string;
  created_at: string;
  email: string;
  first_name: null | string;
  id: string;
  image: null | string;
  interests: null | string;
  last_name: null | string;
  name: null | string;
  show_in_city_lobby: number | null;
  show_planned_places: number | null;
};

type DbTripRow = {
  budget: string;
  created_at: string;
  destination_city: string;
  destination_country: null | string;
  end_date: string;
  hidden_gem_preference: string;
  id: string;
  interests: string;
  is_public: number;
  pace: string;
  party_size: number;
  start_date: string;
  status: Trip['status'];
  updated_at: string;
  user_id: string;
};

type DbDayRow = {
  date: string;
  day_number: number;
  estimated_cost: number;
  id: string;
  notes: null | string;
};

type DbStopRow = {
  day_id: string;
  end_time: null | string;
  id: string;
  is_bookmarked: number | null;
  notes: null | string;
  order_index: number;
  place_id: string;
  place_name: string;
  start_time: string;
  travel_minutes: null | number;
  travel_mode: null | 'taxi' | 'transit' | 'walk';
};

type DbCollaboratorRow = {
  created_at: string;
  id: string;
  invite_email: null | string;
  role: Collaborator['role'];
  user_id: null | string;
};

type DbPresenceRow = {
  id: string;
  show_city_presence: number;
  show_place_presence: number;
  visible_from: string;
  visible_to: string;
};

type DbIntentRow = {
  category: TravelIntent['category'];
  created_at: string;
  description: string;
  id: string;
  title: string;
};

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:30', '18:30'];

function resolveWebRoot() {
  const cwd = process.cwd();

  if (existsSync(join(cwd, 'app')) && existsSync(join(cwd, 'package.json'))) {
    return cwd;
  }

  return join(cwd, 'apps', 'web');
}

const dbDirectory = join(resolveWebRoot(), 'data');
mkdirSync(dbDirectory, { recursive: true });
const database = new DatabaseSync(join(dbDirectory, 'loopin.sqlite'));

let initialized = false;

function ensureDatabase() {
  if (initialized) {
    return;
  }

  database.exec('PRAGMA foreign_keys = ON;');
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      image TEXT,
      provider TEXT NOT NULL DEFAULT 'credentials',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      first_name TEXT,
      last_name TEXT,
      avatar_url TEXT,
      travel_style TEXT,
      interests TEXT NOT NULL DEFAULT '',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      destination_city TEXT NOT NULL,
      destination_country TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      party_size INTEGER NOT NULL,
      budget TEXT NOT NULL,
      pace TEXT NOT NULL,
      hidden_gem_preference TEXT NOT NULL,
      interests TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_days (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      estimated_cost REAL NOT NULL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_stops (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      place_id TEXT NOT NULL,
      place_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      order_index INTEGER NOT NULL,
      travel_mode TEXT,
      travel_minutes INTEGER,
      notes TEXT,
      FOREIGN KEY(day_id) REFERENCES trip_days(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS presence_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      city_slug TEXT NOT NULL,
      visible_from TEXT NOT NULL,
      visible_to TEXT NOT NULL,
      show_city_presence INTEGER NOT NULL DEFAULT 1,
      show_place_presence INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS intent_records (
      id TEXT PRIMARY KEY,
      presence_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(presence_id) REFERENCES presence_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_collaborators (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT,
      invite_email TEXT,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS social_connections (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  safeExec('ALTER TABLE profiles ADD COLUMN show_in_city_lobby INTEGER NOT NULL DEFAULT 1;');
  safeExec('ALTER TABLE profiles ADD COLUMN show_planned_places INTEGER NOT NULL DEFAULT 0;');
  safeExec('ALTER TABLE profiles ADD COLUMN allow_messages INTEGER NOT NULL DEFAULT 1;');
  safeExec('ALTER TABLE profiles ADD COLUMN country_code TEXT;');
  safeExec('ALTER TABLE trip_stops ADD COLUMN is_bookmarked INTEGER NOT NULL DEFAULT 0;');

  initialized = true;
}

function safeExec(sql: string) {
  try {
    database.exec(sql);
  } catch {
    // Intentionally ignored for additive sqlite migrations.
  }
}

function serializeInterests(interests: InterestType[]) {
  return interests.join(',');
}

function parseInterests(serialized: null | string | undefined): InterestType[] {
  if (!serialized) {
    return [];
  }

  return serialized
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean) as InterestType[];
}

function sqlBool(value: null | number | undefined, fallback: boolean) {
  if (value === null || typeof value === 'undefined') {
    return fallback;
  }

  return value === 1;
}

function todayPlus(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function enumerateDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(b.lat - a.lat);
  const dLng = degreesToRadians(b.lng - a.lng);
  const lat1 = degreesToRadians(a.lat);
  const lat2 = degreesToRadians(b.lat);
  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function estimateTravelMinutes(a: Place, b: Place) {
  return Math.max(4, Math.round(distanceKm(a, b) * 6));
}

function resolveTravelMode(previous: null | Place, place: Place): "taxi" | "transit" | "walk" {
  if (!previous) {
    return "walk";
  }

  return distanceKm(previous, place) > 2 ? "transit" : "walk";
}

function getCityById(cityId: string) {
  return cities.find((city) => city.id === cityId) ?? cities[0]!;
}

function getCityByName(name: string) {
  return cities.find((city) => city.name === name) ?? cities[0]!;
}

function getPlaceById(placeId: string) {
  return places.find((place) => place.id === placeId) ?? null;
}

function buildVisibility(row: DbUserRow): VisibilitySettings {
  return {
    allowMessages: sqlBool(row.allow_messages, true),
    showInCityLobby: sqlBool(row.show_in_city_lobby, true),
    showPlannedPlaces: sqlBool(row.show_planned_places, false),
  };
}

function createFallbackUser(userId: string): User {
  const seed = sampleUsers[0]!;

  return {
    ...seed,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    createdAt: new Date(),
    email: `${userId}@loopin.local`,
    id: userId,
    name: 'Traveler',
  };
}

function buildUser(userId: string) {
  ensureDatabase();

  const row = database
    .prepare(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.image,
        u.created_at,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.interests,
        p.show_in_city_lobby,
        p.show_planned_places,
        p.allow_messages,
        p.country_code
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ?
    `)
    .get(userId) as DbUserRow | undefined;

  if (!row) {
    return createFallbackUser(userId);
  }

  const fallbackName = row.email.split('@')[0] ?? 'Traveler';
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();

  return {
    avatar: row.avatar_url ?? row.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    countryCode: row.country_code ?? undefined,
    createdAt: new Date(row.created_at),
    email: row.email,
    id: row.id,
    interests: parseInterests(row.interests),
    name: fullName || row.name || fallbackName,
    visibility: buildVisibility(row),
  } satisfies User;
}

function buildUserByEmail(email: string): User {
  const localPart = email.split('@')[0] ?? 'Traveler';
  const label = localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

  return {
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    createdAt: new Date(),
    email,
    id: `invite:${email}`,
    interests: [],
    name: label || 'Traveler',
    visibility: {
      allowMessages: false,
      showInCityLobby: false,
      showPlannedPlaces: false,
    },
  };
}

function ensureBootstrapState(userId: string) {
  ensureDatabase();

  const tripCountRow = database
    .prepare('SELECT COUNT(1) AS count FROM trips WHERE user_id = ?')
    .get(userId) as { count: number };

  if (tripCountRow.count === 0) {
    seedBootstrapTrip(userId);
  }
}

function seedBootstrapTrip(userId: string) {
  const currentUser = buildUser(userId);
  const baseTrip = sampleTrip;
  const startDate = toDateString(todayPlus(14));
  const endDate = toDateString(todayPlus(16));

  const trip: Trip = {
    ...baseTrip,
    collaborators: [
      {
        invitedAt: new Date(),
        role: 'owner',
        user: currentUser,
        userId: currentUser.id,
      },
    ],
    createdAt: new Date(),
    endDate,
    id: `trip-${userId}-bootstrap`,
    startDate,
    updatedAt: new Date(),
    days: baseTrip.days.map((dayPlan, index) => ({
      ...dayPlan,
      date: toDateString(todayPlus(14 + index)),
      id: `${baseTrip.id}-day-${index + 1}`,
      stops: dayPlan.stops.map((stop, stopIndex) => ({
        ...stop,
        id: `${baseTrip.id}-stop-${index + 1}-${stopIndex + 1}`,
      })),
    })),
  };

  persistTrip(userId, trip);
  upsertPresenceForTrip(userId, trip);
}

function persistTrip(userId: string, trip: Trip) {
  ensureDatabase();

  database.prepare('DELETE FROM trip_stops WHERE day_id IN (SELECT id FROM trip_days WHERE trip_id = ?)').run(trip.id);
  database.prepare('DELETE FROM trip_days WHERE trip_id = ?').run(trip.id);
  database.prepare('DELETE FROM trip_collaborators WHERE trip_id = ?').run(trip.id);

  database
    .prepare(`
      INSERT OR REPLACE INTO trips (
        id, user_id, destination_city, destination_country, start_date, end_date, party_size,
        budget, pace, hidden_gem_preference, interests, is_public, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      trip.id,
      userId,
      trip.destination.name,
      trip.destination.country,
      trip.startDate,
      trip.endDate,
      trip.partySize,
      trip.preferences.budget,
      trip.preferences.pace,
      trip.preferences.hiddenGemPreference,
      serializeInterests(trip.preferences.interests),
      trip.isPublic ? 1 : 0,
      trip.status,
      trip.createdAt.toISOString(),
      trip.updatedAt.toISOString(),
    );

  const dayInsert = database.prepare(`
    INSERT INTO trip_days (id, trip_id, day_number, date, estimated_cost, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const stopInsert = database.prepare(`
    INSERT INTO trip_stops (
      id, day_id, place_id, place_name, start_time, end_time, order_index,
      travel_mode, travel_minutes, notes, is_bookmarked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const collaboratorInsert = database.prepare(`
    INSERT INTO trip_collaborators (id, trip_id, user_id, invite_email, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  trip.days.forEach((dayPlan) => {
    dayInsert.run(
      dayPlan.id,
      trip.id,
      dayPlan.day,
      dayPlan.date,
      dayPlan.estimatedCost,
      dayPlan.notes ?? null,
    );

    dayPlan.stops.forEach((stop) => {
      stopInsert.run(
        stop.id,
        dayPlan.id,
        stop.place.id,
        stop.place.name,
        stop.startTime,
        stop.endTime || null,
        stop.order,
        stop.travelFromPrevious?.mode ?? 'walk',
        stop.travelFromPrevious?.duration ?? 0,
        stop.notes ?? null,
        stop.isBookmarked ? 1 : 0,
      );
    });
  });

  trip.collaborators.forEach((collaborator) => {
    collaboratorInsert.run(
      randomUUID(),
      trip.id,
      collaborator.userId.startsWith('invite:') ? null : collaborator.userId,
      collaborator.userId.startsWith('invite:') ? collaborator.user.email : null,
      collaborator.role,
      collaborator.invitedAt.toISOString(),
    );
  });
}

function loadTrips(userId: string) {
  ensureDatabase();

  const rows = database
    .prepare(`
      SELECT DISTINCT t.*
      FROM trips t
      LEFT JOIN trip_collaborators tc ON tc.trip_id = t.id
      WHERE t.user_id = ? OR tc.user_id = ?
      ORDER BY t.updated_at DESC
    `)
    .all(userId, userId) as DbTripRow[];

  return rows.map((row) => buildTrip(row)).filter(Boolean) as Trip[];
}

function buildTrip(row: DbTripRow): Trip | null {
  const destination = getCityByName(row.destination_city);
  const dayRows = database
    .prepare('SELECT id, day_number, date, estimated_cost, notes FROM trip_days WHERE trip_id = ? ORDER BY day_number ASC')
    .all(row.id) as DbDayRow[];
  const stopRows = database
    .prepare(`
      SELECT id, day_id, place_id, place_name, start_time, end_time, order_index, travel_mode, travel_minutes, notes, is_bookmarked
      FROM trip_stops
      WHERE day_id IN (SELECT id FROM trip_days WHERE trip_id = ?)
      ORDER BY day_id ASC, order_index ASC
    `)
    .all(row.id) as DbStopRow[];
  const collaboratorRows = database
    .prepare('SELECT id, trip_id, user_id, invite_email, role, created_at FROM trip_collaborators WHERE trip_id = ?')
    .all(row.id) as DbCollaboratorRow[];

  const owner = buildUser(row.user_id);
  const collaborators: Collaborator[] = collaboratorRows
    .map((collaboratorRow) => {
      const user = collaboratorRow.user_id
        ? buildUser(collaboratorRow.user_id)
        : collaboratorRow.invite_email
          ? buildUserByEmail(collaboratorRow.invite_email)
          : null;

      if (!user) {
        return null;
      }

      return {
        invitedAt: new Date(collaboratorRow.created_at),
        role: collaboratorRow.role,
        user,
        userId: user.id,
      } satisfies Collaborator;
    })
    .filter(Boolean) as Collaborator[];

  if (!collaborators.some((collaborator) => collaborator.userId === owner.id)) {
    collaborators.unshift({
      invitedAt: new Date(row.created_at),
      role: 'owner',
      user: owner,
      userId: owner.id,
    });
  }

  const days: DayPlan[] = dayRows.map((dayRow) => {
    const dayStops = stopRows
      .filter((stopRow) => stopRow.day_id === dayRow.id)
      .map((stopRow, index, stopCollection) => {
        const place = getPlaceById(stopRow.place_id);

        if (!place) {
          return null;
        }

        const previousPlace = index > 0 ? getPlaceById(stopCollection[index - 1]!.place_id) : null;
        const distance = previousPlace ? Math.round(distanceKm(previousPlace, place) * 10) / 10 : 0;

        return {
          endTime: stopRow.end_time ?? '',
          id: stopRow.id,
          isBookmarked: sqlBool(stopRow.is_bookmarked, false),
          notes: stopRow.notes ?? undefined,
          order: stopRow.order_index,
          place,
          startTime: stopRow.start_time,
          travelFromPrevious: {
            distance,
            duration: stopRow.travel_minutes ?? (previousPlace ? estimateTravelMinutes(previousPlace, place) : 0),
            mode: stopRow.travel_mode ?? 'walk',
          },
        } satisfies DayStop;
      })
      .filter(Boolean) as DayStop[];

    return {
      date: dayRow.date,
      day: dayRow.day_number,
      estimatedCost: dayRow.estimated_cost,
      id: dayRow.id,
      notes: dayRow.notes ?? undefined,
      stops: dayStops,
    } satisfies DayPlan;
  });

  return {
    collaborators,
    createdAt: new Date(row.created_at),
    days,
    destination,
    endDate: row.end_date,
    id: row.id,
    isPublic: row.is_public === 1,
    partySize: row.party_size,
    preferences: {
      budget: row.budget as Trip['preferences']['budget'],
      dailyBudget: budgetToDailyBudget(row.budget as Trip['preferences']['budget']),
      hiddenGemPreference: row.hidden_gem_preference as HiddenGemPreference,
      interests: parseInterests(row.interests),
      pace: row.pace as Trip['preferences']['pace'],
    },
    startDate: row.start_date,
    status: row.status,
    updatedAt: new Date(row.updated_at),
  } satisfies Trip;
}

function budgetToDailyBudget(budget: Trip['preferences']['budget']) {
  switch (budget) {
    case 'low':
      return 60;
    case 'high':
      return 220;
    case 'mid':
    default:
      return 120;
  }
}

function generateTripDays({
  cityId,
  preferences,
  startDate,
  endDate,
}: {
  cityId: string;
  endDate: string;
  preferences: Trip['preferences'];
  startDate: string;
}) {
  const city = getCityById(cityId);
  const tripDates = enumerateDates(startDate, endDate);
  const rankedPlaces = [...places]
    .filter((place) => {
      const sameCity = place.neighborhood ? city.neighborhoods.some((neighborhood) => neighborhood.name === place.neighborhood) : true;
      const matchesInterest = preferences.interests.length === 0
        ? true
        : preferences.interests.some((interest) => place.tags.includes(interest) || place.bestFor?.includes(interest));
      return sameCity && matchesInterest;
    })
    .sort((left, right) => {
      const leftScore = placeRankForPreference(left, preferences.hiddenGemPreference);
      const rightScore = placeRankForPreference(right, preferences.hiddenGemPreference);
      return rightScore - leftScore;
    });

  const selectedPlaces = (rankedPlaces.length > 0 ? rankedPlaces : places).slice(
    0,
    Math.max(tripDates.length * 3, tripDates.length),
  );
  const stopsPerDay = Math.max(1, Math.ceil(selectedPlaces.length / tripDates.length));

  return tripDates.map((date, dayIndex) => {
    const dayPlaces = selectedPlaces.slice(dayIndex * stopsPerDay, (dayIndex + 1) * stopsPerDay);
    const stops = dayPlaces.map((place, placeIndex) => {
      const previous = placeIndex === 0 ? null : dayPlaces[placeIndex - 1]!;

      return {
        endTime: '',
        id: randomUUID(),
        isBookmarked: false,
        order: placeIndex + 1,
        place,
        startTime: TIME_SLOTS[placeIndex] ?? TIME_SLOTS[TIME_SLOTS.length - 1]!,
        travelFromPrevious: {
          distance: previous ? Math.round(distanceKm(previous, place) * 10) / 10 : 0,
          duration: previous ? estimateTravelMinutes(previous, place) : 0,
          mode: resolveTravelMode(previous, place),
        },
      } satisfies DayStop;
    });

    return {
      date,
      day: dayIndex + 1,
      estimatedCost: stops.reduce((total, stop) => total + stop.place.estimatedCost, 0),
      id: randomUUID(),
      stops,
    } satisfies DayPlan;
  });
}

function placeRankForPreference(place: Place, preference: HiddenGemPreference) {
  switch (preference) {
    case 'local':
      return place.hiddenGemScore + (100 - place.popularityScore);
    case 'touristy':
      return place.popularityScore;
    case 'mixed':
    default:
      return place.hiddenGemScore + place.popularityScore;
  }
}

function createTripForUser(
  userId: string,
  draft: NonNullable<Extract<LoopinAction, { type: 'create-trip' }>['trip']>,
) {
  const city = getCityById(draft.cityId);
  const currentUser = buildUser(userId);
  const days = generateTripDays({
    cityId: city.id,
    endDate: draft.endDate,
    preferences: draft.preferences,
    startDate: draft.startDate,
  });
  const timestamp = new Date();

  const trip: Trip = {
    collaborators: [
      {
        invitedAt: timestamp,
        role: 'owner',
        user: currentUser,
        userId: currentUser.id,
      },
    ],
    createdAt: timestamp,
    days,
    destination: city,
    endDate: draft.endDate,
    id: draft.id ?? `trip-${Date.now()}`,
    isPublic: false,
    partySize: draft.partySize,
    preferences: {
      ...draft.preferences,
      dailyBudget:
        draft.preferences.dailyBudget ?? budgetToDailyBudget(draft.preferences.budget),
    },
    startDate: draft.startDate,
    status: 'planned',
    updatedAt: timestamp,
  };

  persistTrip(userId, trip);
  upsertPresenceForTrip(userId, trip);
  return trip.id;
}

function addStopToTrip(userId: string, tripId: string, placeId: string, targetDay: number) {
  const trip = loadTrips(userId).find((candidate) => candidate.id === tripId);
  const place = getPlaceById(placeId);

  if (!trip || !place) {
    return tripId;
  }

  const nextTrip = {
    ...trip,
    updatedAt: new Date(),
    days: trip.days.map((day) => {
      if (day.day !== targetDay) {
        return day;
      }

      const previous = day.stops.at(-1)?.place ?? null;
      const newStop: DayStop = {
        endTime: '',
        id: randomUUID(),
        isBookmarked: false,
        order: day.stops.length + 1,
        place,
        startTime: TIME_SLOTS[day.stops.length] ?? '19:30',
        travelFromPrevious: {
          distance: previous ? Math.round(distanceKm(previous, place) * 10) / 10 : 0,
          duration: previous ? estimateTravelMinutes(previous, place) : 0,
          mode: resolveTravelMode(previous, place),
        },
      };

      return {
        ...day,
        estimatedCost: day.estimatedCost + place.estimatedCost,
        stops: [...day.stops, newStop],
      };
    }),
  } satisfies Trip;

  persistTrip(userId, nextTrip);
  upsertPresenceForTrip(userId, nextTrip);
  return tripId;
}

function removeStopFromTrip(userId: string, tripId: string, stopId: string) {
  const trip = loadTrips(userId).find((candidate) => candidate.id === tripId);

  if (!trip) {
    return tripId;
  }

  const nextTrip = {
    ...trip,
    updatedAt: new Date(),
    days: trip.days.map((day) => {
      const removed = day.stops.find((stop) => stop.id === stopId);
      const nextStops = day.stops
        .filter((stop) => stop.id !== stopId)
        .map((stop, index, collection) => {
          const previous = index > 0 ? collection[index - 1]!.place : null;
          return {
            ...stop,
            order: index + 1,
            travelFromPrevious: {
              distance: previous ? Math.round(distanceKm(previous, stop.place) * 10) / 10 : 0,
              duration: previous ? estimateTravelMinutes(previous, stop.place) : 0,
              mode: resolveTravelMode(previous, stop.place),
            },
          };
        });

      return {
        ...day,
        estimatedCost: Math.max(0, day.estimatedCost - (removed?.place.estimatedCost ?? 0)),
        stops: nextStops,
      };
    }),
  } satisfies Trip;

  persistTrip(userId, nextTrip);
  upsertPresenceForTrip(userId, nextTrip);
  return tripId;
}

function swapStopInTrip(userId: string, tripId: string, stopId: string, newPlaceId: string) {
  const trip = loadTrips(userId).find((candidate) => candidate.id === tripId);
  const newPlace = getPlaceById(newPlaceId);

  if (!trip || !newPlace) {
    return tripId;
  }

  const nextTrip = {
    ...trip,
    updatedAt: new Date(),
    days: trip.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) =>
        stop.id === stopId
          ? {
              ...stop,
              place: newPlace,
            }
          : stop,
      ),
    })),
  } satisfies Trip;

  persistTrip(userId, recalculateTrip(nextTrip));
  upsertPresenceForTrip(userId, nextTrip);
  return tripId;
}

function regenerateTrip(userId: string, tripId: string) {
  const trip = loadTrips(userId).find((candidate) => candidate.id === tripId);

  if (!trip) {
    return tripId;
  }

  const regeneratedTrip = {
    ...trip,
    days: generateTripDays({
      cityId: trip.destination.id,
      endDate: trip.endDate,
      preferences: trip.preferences,
      startDate: trip.startDate,
    }),
    updatedAt: new Date(),
  } satisfies Trip;

  persistTrip(userId, regeneratedTrip);
  upsertPresenceForTrip(userId, regeneratedTrip);
  return tripId;
}

function recalculateTrip(trip: Trip) {
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      estimatedCost: day.stops.reduce((total, stop) => total + stop.place.estimatedCost, 0),
      stops: day.stops.map((stop, index, collection) => {
        const previous = index > 0 ? collection[index - 1]!.place : null;
        return {
          ...stop,
          order: index + 1,
          travelFromPrevious: {
            distance: previous ? Math.round(distanceKm(previous, stop.place) * 10) / 10 : 0,
            duration: previous ? estimateTravelMinutes(previous, stop.place) : 0,
            mode: resolveTravelMode(previous, stop.place),
          },
        };
      }),
    })),
  } satisfies Trip;
}

function inviteCollaboratorToTrip(userId: string, tripId: string, email: string, role: 'editor' | 'viewer') {
  const trip = loadTrips(userId).find((candidate) => candidate.id === tripId);

  if (!trip) {
    return tripId;
  }

  database.prepare('DELETE FROM trip_collaborators WHERE trip_id = ? AND invite_email = ?').run(tripId, email);
  database
    .prepare(`
      INSERT INTO trip_collaborators (id, trip_id, user_id, invite_email, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(randomUUID(), tripId, null, email, role, new Date().toISOString());

  return tripId;
}

function updateTripVisibility(userId: string, tripId: string, isPublic: boolean) {
  database
    .prepare('UPDATE trips SET is_public = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(isPublic ? 1 : 0, new Date().toISOString(), tripId, userId);

  return tripId;
}

function updateProfile(userId: string, profile: Extract<LoopinAction, { type: 'update-profile' }>['profile']) {
  ensureDatabase();

  const existingProfile = database
    .prepare('SELECT id FROM profiles WHERE user_id = ?')
    .get(userId) as { id: string } | undefined;

  if (!existingProfile) {
    database
      .prepare(`
        INSERT INTO profiles (
          id, user_id, first_name, last_name, avatar_url, travel_style, interests,
          show_in_city_lobby, show_planned_places, allow_messages
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        randomUUID(),
        userId,
        profile.firstName ?? null,
        profile.lastName ?? null,
        null,
        'balanced',
        serializeInterests(profile.interests ?? []),
        profile.visibility?.showInCityLobby ?? true ? 1 : 0,
        profile.visibility?.showPlannedPlaces ?? false ? 1 : 0,
        profile.visibility?.allowMessages ?? true ? 1 : 0,
      );
  } else {
    database
      .prepare(`
        UPDATE profiles
        SET first_name = COALESCE(?, first_name),
            last_name = COALESCE(?, last_name),
            interests = COALESCE(?, interests),
            show_in_city_lobby = COALESCE(?, show_in_city_lobby),
            show_planned_places = COALESCE(?, show_planned_places),
            allow_messages = COALESCE(?, allow_messages)
        WHERE user_id = ?
      `)
      .run(
        profile.firstName ?? null,
        profile.lastName ?? null,
        profile.interests ? serializeInterests(profile.interests) : null,
        typeof profile.visibility?.showInCityLobby === 'boolean'
          ? profile.visibility.showInCityLobby
            ? 1
            : 0
          : null,
        typeof profile.visibility?.showPlannedPlaces === 'boolean'
          ? profile.visibility.showPlannedPlaces
            ? 1
            : 0
          : null,
        typeof profile.visibility?.allowMessages === 'boolean'
          ? profile.visibility.allowMessages
            ? 1
            : 0
          : null,
        userId,
      );
  }
}

function upsertPresenceForTrip(userId: string, trip: Trip) {
  const currentUser = buildUser(userId);
  const existingPresence = database
    .prepare('SELECT id FROM presence_records WHERE user_id = ? AND city_slug = ?')
    .get(userId, trip.destination.id) as { id: string } | undefined;

  if (existingPresence) {
    database
      .prepare(`
        UPDATE presence_records
        SET visible_from = ?, visible_to = ?, show_city_presence = ?, show_place_presence = ?
        WHERE id = ?
      `)
      .run(
        trip.startDate,
        trip.endDate,
        currentUser.visibility.showInCityLobby ? 1 : 0,
        currentUser.visibility.showPlannedPlaces ? 1 : 0,
        existingPresence.id,
      );

    return existingPresence.id;
  }

  const id = randomUUID();
  database
    .prepare(`
      INSERT INTO presence_records (
        id, user_id, city_slug, visible_from, visible_to, show_city_presence, show_place_presence
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      userId,
      trip.destination.id,
      trip.startDate,
      trip.endDate,
      currentUser.visibility.showInCityLobby ? 1 : 0,
      currentUser.visibility.showPlannedPlaces ? 1 : 0,
    );

  return id;
}

function createIntentForUser(
  userId: string,
  payload: Extract<LoopinAction, { type: 'create-intent' }>,
  trip: Trip,
) {
  const presenceId = upsertPresenceForTrip(userId, trip);
  database
    .prepare(`
      INSERT INTO intent_records (id, presence_id, title, description, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      randomUUID(),
      presenceId,
      payload.description.slice(0, 72),
      payload.description,
      payload.category,
      new Date().toISOString(),
    );
}

function connectTraveler(userId: string, targetUserId: string) {
  const existing = database
    .prepare(`
      SELECT id
      FROM social_connections
      WHERE (requester_id = ? AND target_user_id = ?) OR (requester_id = ? AND target_user_id = ?)
      LIMIT 1
    `)
    .get(userId, targetUserId, targetUserId, userId) as { id: string } | undefined;

  if (existing) {
    database.prepare('UPDATE social_connections SET status = ? WHERE id = ?').run('accepted', existing.id);
    return;
  }

  database
    .prepare(`
      INSERT INTO social_connections (id, requester_id, target_user_id, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(randomUUID(), userId, targetUserId, 'accepted', new Date().toISOString());
}

function buildNearbySuggestions(trip: Trip): NearMeSuggestion[] {
  const currentPlace = trip.days[0]?.stops.at(-1)?.place ?? places[0]!;
  const takenPlaceIds = new Set(trip.days.flatMap((day) => day.stops.map((stop) => stop.place.id)));

  return places
    .filter((place) => !takenPlaceIds.has(place.id))
    .map((place) => {
      const distance = Math.round(distanceKm(currentPlace, place) * 10) / 10;
      const matchScore = Math.max(
        60,
        Math.round(
          100 -
            distance * 8 +
            (trip.preferences.interests.some((interest) => place.tags.includes(interest)) ? 10 : 0) +
            place.hiddenGemScore * 0.15,
        ),
      );

      return {
        distance,
        estimatedArrival: `${Math.max(3, estimateTravelMinutes(currentPlace, place))} min`,
        fitsTimeSlot: place.typicalDuration <= 120,
        matchScore: Math.min(matchScore, 99),
        place,
        reason:
          place.hiddenness === 'hidden'
            ? 'Good hidden-gem fit near your current route'
            : 'Strong fit for the rest of your day',
      } satisfies NearMeSuggestion;
    })
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 5);
}

function normalizeSampleTravelerDates() {
  return tokyoTravelers.map((traveler, index) => ({
    ...traveler,
    dateRange: {
      end: toDateString(todayPlus(16 + index)),
      start: toDateString(todayPlus(13 + index)),
    },
  }));
}

function buildTravelers(userId: string, trip: Trip) {
  const currentUser = buildUser(userId);
  const presence = database
    .prepare(`
      SELECT id, visible_from, visible_to, show_city_presence, show_place_presence
      FROM presence_records
      WHERE user_id = ? AND city_slug = ?
      LIMIT 1
    `)
    .get(userId, trip.destination.id) as DbPresenceRow | undefined;
  const intents = presence
    ? (database
        .prepare(`
          SELECT id, title, description, category, created_at
          FROM intent_records
          WHERE presence_id = ?
          ORDER BY created_at DESC
        `)
        .all(presence.id) as DbIntentRow[])
    : [];

  const currentTraveler =
    presence && currentUser.visibility.showInCityLobby
      ? ({
          cityId: trip.destination.id,
          dateRange: {
            end: presence.visible_to,
            start: presence.visible_from,
          },
          id: presence.id,
          intents: intents.map((intent) => ({
            category: intent.category,
            createdAt: new Date(intent.created_at),
            description: intent.description,
            id: intent.id,
          })),
          plannedPlaces: currentUser.visibility.showPlannedPlaces
            ? trip.days.flatMap((day) => day.stops.map((stop) => stop.place.id))
            : [],
          user: currentUser,
          visibility: currentUser.visibility.showPlannedPlaces ? 'public' : 'connections',
        } satisfies TravelerPresence)
      : null;

  return [
    ...(currentTraveler ? [currentTraveler] : []),
    ...normalizeSampleTravelerDates(),
  ];
}

function buildPlacePresence(travelers: TravelerPresence[]) {
  const buckets = new Map<string, PlacePresenceSummary>();

  travelers.forEach((traveler) => {
    traveler.plannedPlaces.forEach((placeId) => {
      const place = getPlaceById(placeId);

      if (!place) {
        return;
      }

      const existing = buckets.get(place.id);

      if (!existing) {
        buckets.set(place.id, {
          count: 1,
          place,
          travelers: [traveler.user],
        });
        return;
      }

      buckets.set(place.id, {
        ...existing,
        count: existing.count + 1,
        travelers: [...existing.travelers, traveler.user],
      });
    });
  });

  return Array.from(buckets.values()).sort((left, right) => right.count - left.count).slice(0, 5);
}

function buildConnections(userId: string): Connection[] {
  const rows = database
    .prepare(`
      SELECT id, requester_id, target_user_id, status, created_at
      FROM social_connections
      WHERE requester_id = ? OR target_user_id = ?
      ORDER BY created_at DESC
    `)
    .all(userId, userId) as Array<{
      created_at: string;
      id: string;
      requester_id: string;
      status: Connection['status'];
      target_user_id: string;
    }>;

  return rows.map((row) => ({
    createdAt: new Date(row.created_at),
    id: row.id,
    status: row.status,
    users: [row.requester_id, row.target_user_id],
  }));
}

export function getLoopinAppState(userId: string, tripId?: string): LoopinAppState {
  ensureBootstrapState(userId);

  const trips = loadTrips(userId);
  const currentTrip =
    trips.find((trip) => trip.id === tripId) ??
    trips[0] ??
    buildFallbackTrip(userId);
  const currentUser = buildUser(userId);

  upsertPresenceForTrip(userId, currentTrip);

  const travelers = buildTravelers(userId, currentTrip);

  return {
    cities,
    connections: buildConnections(userId),
    currentTrip,
    currentUser,
    dishes: tokyoDishes,
    nearbySuggestions: buildNearbySuggestions(currentTrip),
    placePresence: buildPlacePresence(travelers),
    places,
    quickActions,
    travelers,
    trips,
  };
}

function buildFallbackTrip(userId: string) {
  seedBootstrapTrip(userId);
  return loadTrips(userId)[0]!;
}

export function applyLoopinAction(userId: string, action: LoopinAction) {
  ensureBootstrapState(userId);

  let activeTripId: string | undefined;

  switch (action.type) {
    case 'create-trip':
      if (action.trip) {
        activeTripId = createTripForUser(userId, action.trip);
      }
      break;
    case 'add-stop':
      activeTripId = addStopToTrip(userId, action.tripId, action.placeId, action.targetDay);
      break;
    case 'remove-stop':
    case 'skip-stop':
      activeTripId = removeStopFromTrip(userId, action.tripId, action.stopId);
      break;
    case 'swap-stop':
      activeTripId = swapStopInTrip(userId, action.tripId, action.stopId, action.newPlaceId);
      break;
    case 'regenerate-trip':
      activeTripId = regenerateTrip(userId, action.tripId);
      break;
    case 'set-active-trip':
      activeTripId = action.tripId;
      break;
    case 'invite-collaborator':
      activeTripId = inviteCollaboratorToTrip(userId, action.tripId, action.email, action.role);
      break;
    case 'update-trip-visibility':
      activeTripId = updateTripVisibility(userId, action.tripId, action.isPublic);
      break;
    case 'connect-traveler':
      connectTraveler(userId, action.targetUserId);
      break;
    case 'create-intent': {
      const trip = loadTrips(userId)[0];
      if (trip) {
        createIntentForUser(userId, action, trip);
        activeTripId = trip.id;
      }
      break;
    }
    case 'update-profile':
      updateProfile(userId, action.profile);
      break;
    default:
      break;
  }

  return getLoopinAppState(userId, activeTripId);
}
