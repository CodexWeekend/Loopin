import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type {
  AddStopRequest,
  CreateConnectionInput,
  CreateIntentInput,
  CreateTripRequest,
  DiscoveryQuery,
  NearbyQuery,
  PresenceUpdateInput,
  ProfileUpdateInput,
  SocialQuery,
  SwapStopRequest,
  UpdateConnectionInput,
  UpdateTripRequest,
} from '@/lib/local-api-contracts';
import {
  cities,
  nearMeSuggestions as seededNearMeSuggestions,
  places,
  quickActions,
  sampleTrip,
  sampleUsers,
  swapSuggestions,
  tokyoDishes,
  tokyoTravelers,
} from '@/lib/sample-data';
import type {
  City,
  Collaborator,
  Connection,
  DayPlan,
  DayStop,
  InterestType,
  NearMeSuggestion,
  Place,
  QuickAction,
  TravelerPresence,
  TravelInfo,
  TravelIntent,
  Trip,
  TripPreferences,
  User,
  VisibilitySettings,
} from '@/lib/types';

type DbUserRow = {
  allow_messages: number;
  country_code: string | null;
  created_at: string;
  email: string;
  id: string;
  image: string | null;
  name: string | null;
};

type DbProfileRow = {
  avatar_url: string | null;
  first_name: string | null;
  id: string;
  interests: string;
  last_name: string | null;
  travel_style: string | null;
  user_id: string;
};

type DbTripRow = {
  budget: string;
  created_at: string;
  destination_city: string;
  destination_country: string | null;
  end_date: string;
  hidden_gem_preference: string;
  id: string;
  interests: string;
  is_public: number;
  pace: string;
  party_size: number;
  start_date: string;
  status: string;
  updated_at: string;
  user_id: string;
};

type DbTripDayRow = {
  date: string;
  day_number: number;
  estimated_cost: number;
  id: string;
  notes: string | null;
  trip_id: string;
};

type DbTripStopRow = {
  day_id: string;
  end_time: string | null;
  id: string;
  notes: string | null;
  order_index: number;
  place_id: string;
  place_name: string;
  start_time: string;
  travel_minutes: number | null;
  travel_mode: string | null;
};

type DbPresenceRow = {
  city_slug: string;
  id: string;
  planned_place_ids: string;
  show_city_presence: number;
  show_place_presence: number;
  trip_id: string | null;
  user_id: string;
  visibility: string;
  visible_from: string;
  visible_to: string;
};

type DbIntentRow = {
  category: string;
  created_at: string;
  description: string;
  id: string;
  max_group_size: number | null;
  presence_id: string;
  scheduled_for: string | null;
  title: string;
};

type DbConnectionRow = {
  created_at: string;
  id: string;
  requester_user_id: string;
  status: string;
  target_user_id: string;
  trip_id: string | null;
  updated_at: string;
};

type DbTripCollaboratorRow = {
  created_at: string;
  id: string;
  role: Collaborator['role'];
  trip_id: string;
  user_id: string;
};

type UpsertUserInput = {
  allowMessages?: boolean;
  countryCode?: string | null;
  email: string;
  firstName?: string | null;
  id?: string;
  image?: string | null;
  interests?: InterestType[];
  lastName?: string | null;
  name?: string | null;
  provider: string;
  travelStyle?: string | null;
};

type SocialState = {
  cityId: string;
  connections: Array<
    Connection & {
      otherUser: User;
    }
  >;
  currentVisibility: VisibilitySettings & {
    visibility: 'connections' | 'private' | 'public';
  };
  intents: Array<
    TravelIntent & {
      user: User;
    }
  >;
  placePresence: Array<{
    count: number;
    place: Place;
    travelerIds: string[];
  }>;
  travelers: TravelerPresence[];
};

export type AppBootstrapState = {
  activeTrip: Trip | null;
  dbPath: string;
  discovery: {
    categories: QuickAction[];
    city: City;
    dishes: typeof tokyoDishes;
    hiddenGems: Place[];
    mustSee: Place[];
    places: Place[];
  };
  nearby: {
    quickActions: QuickAction[];
    suggestions: NearMeSuggestion[];
  };
  profile: ReturnType<typeof getProfile>;
  social: SocialState;
  trips: Trip[];
  user: User | null;
};

const DEFAULT_CITY_ID = 'tokyo';
const DEFAULT_START_MINUTES = 9 * 60;
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  kyoto: { lat: 35.0116, lng: 135.7681 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
};
const EARTH_RADIUS_KM = 6371;

let database: DatabaseSync | null = null;
let initialized = false;

function resolveDatabasePath() {
  const override = process.env.LOOPIN_LOCAL_DB_PATH?.trim();

  if (override) {
    return resolve(/* turbopackIgnore: true */ process.cwd(), override);
  }

  return resolve(process.cwd(), 'data', 'loopin.sqlite');
}

function getDatabase() {
  if (!database) {
    const databasePath = resolveDatabasePath();

    mkdirSync(dirname(databasePath), { recursive: true });

    database = new DatabaseSync(databasePath);
    database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
    `);
  }

  return database;
}

export function getLocalDatabasePath() {
  return resolveDatabasePath();
}

export function ensureDatabase() {
  if (initialized) {
    return;
  }

  const db = getDatabase();

  db.exec(`
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

    CREATE TABLE IF NOT EXISTS saved_places (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      place_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
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

    CREATE TABLE IF NOT EXISTS connection_requests (
      id TEXT PRIMARY KEY,
      requester_user_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      trip_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(requester_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(target_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_collaborators (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  ensureColumn(
    'users',
    'country_code',
    `ALTER TABLE users ADD COLUMN country_code TEXT`,
  );
  ensureColumn(
    'users',
    'allow_messages',
    `ALTER TABLE users ADD COLUMN allow_messages INTEGER NOT NULL DEFAULT 1`,
  );
  ensureColumn(
    'presence_records',
    'trip_id',
    `ALTER TABLE presence_records ADD COLUMN trip_id TEXT`,
  );
  ensureColumn(
    'presence_records',
    'planned_place_ids',
    `ALTER TABLE presence_records ADD COLUMN planned_place_ids TEXT NOT NULL DEFAULT ''`,
  );
  ensureColumn(
    'presence_records',
    'visibility',
    `ALTER TABLE presence_records ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'`,
  );
  ensureColumn(
    'intent_records',
    'scheduled_for',
    `ALTER TABLE intent_records ADD COLUMN scheduled_for TEXT`,
  );
  ensureColumn(
    'intent_records',
    'max_group_size',
    `ALTER TABLE intent_records ADD COLUMN max_group_size INTEGER`,
  );

  initialized = true;
  ensureSocialSeedData();
}

function ensureColumn(tableName: string, columnName: string, alterStatement: string) {
  const db = getDatabase();
  const rows = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  if (rows.some((row) => row.name === columnName)) {
    return;
  }

  db.exec(alterStatement);
}

function nowIso() {
  return new Date().toISOString();
}

function boolToInteger(value: boolean) {
  return value ? 1 : 0;
}

function integerToBool(value: number | null | undefined, fallback = false) {
  if (value === null || value === undefined) {
    return fallback;
  }

  return value === 1;
}

function normalizeInterests(value: string | InterestType[] | null | undefined) {
  if (!value) {
    return [] as InterestType[];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) as InterestType[];
}

function serializeInterests(interests: InterestType[] | undefined) {
  return (interests ?? []).join(',');
}

function getCityById(cityId: string | null | undefined) {
  return cities.find((city) => city.id === cityId) ?? null;
}

function getPlacesForCity(cityId: string) {
  if (cityId === 'tokyo') {
    return places;
  }

  return places.filter((place) => place.id.startsWith(`${cityId}-`));
}

function getPlaceById(placeId: string) {
  return places.find((place) => place.id === placeId) ?? null;
}

function createFallbackPlace(placeId: string, placeName: string, cityId: string): Place {
  return {
    address: undefined,
    bestFor: [],
    category: 'landmark',
    costLevel: 1,
    description: 'Saved place',
    estimatedCost: 0,
    hiddenGemScore: 0,
    hiddenness: 'balanced',
    id: placeId,
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80',
    lat: CITY_CENTERS[cityId]?.lat ?? CITY_CENTERS[DEFAULT_CITY_ID].lat,
    lng: CITY_CENTERS[cityId]?.lng ?? CITY_CENTERS[DEFAULT_CITY_ID].lng,
    longDescription: undefined,
    mustTryDishes: [],
    name: placeName,
    neighborhood: undefined,
    openHours: undefined,
    popularityScore: 50,
    rating: undefined,
    reviewCount: undefined,
    tags: [],
    typicalDuration: 60,
    vibes: [],
  };
}

function getVisibilityForUser(userId: string): VisibilitySettings {
  const userRow = getUserRow(userId);
  const presence = getLatestPresenceForUser(userId);

  return {
    allowMessages: integerToBool(userRow?.allow_messages, true),
    showInCityLobby: integerToBool(presence?.show_city_presence, false),
    showPlannedPlaces: integerToBool(presence?.show_place_presence, false),
  };
}

function getUserRow(userId: string) {
  ensureDatabase();

  return getDatabase()
    .prepare(
      `SELECT
        id,
        email,
        name,
        image,
        created_at,
        country_code,
        allow_messages
      FROM users
      WHERE id = ?`,
    )
    .get(userId) as DbUserRow | undefined;
}

function getUserRowByEmail(email: string) {
  ensureDatabase();

  return getDatabase()
    .prepare(
      `SELECT
        id,
        email,
        name,
        image,
        created_at,
        country_code,
        allow_messages
      FROM users
      WHERE email = ?`,
    )
    .get(email) as DbUserRow | undefined;
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split('@')[0] ?? 'traveler';

  return localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Traveler';
}

function getTripCollaboratorRows(tripId: string) {
  ensureDatabase();

  return getDatabase()
    .prepare(
      `SELECT
        id,
        trip_id,
        user_id,
        role,
        created_at
      FROM trip_collaborators
      WHERE trip_id = ?
      ORDER BY created_at ASC`,
    )
    .all(tripId) as DbTripCollaboratorRow[];
}

function getProfileRow(userId: string) {
  ensureDatabase();

  return getDatabase()
    .prepare(
      `SELECT
        id,
        user_id,
        first_name,
        last_name,
        avatar_url,
        travel_style,
        interests
      FROM profiles
      WHERE user_id = ?`,
    )
    .get(userId) as DbProfileRow | undefined;
}

function getTripRow(tripId: string) {
  ensureDatabase();

  return getDatabase()
    .prepare(
      `SELECT
        id,
        user_id,
        destination_city,
        destination_country,
        start_date,
        end_date,
        party_size,
        budget,
        pace,
        hidden_gem_preference,
        interests,
        is_public,
        status,
        created_at,
        updated_at
      FROM trips
      WHERE id = ?`,
    )
    .get(tripId) as DbTripRow | undefined;
}

function getLatestPresenceForUser(userId: string, cityId?: string) {
  ensureDatabase();

  const db = getDatabase();

  if (cityId) {
    return db
      .prepare(
        `SELECT
          id,
          user_id,
          city_slug,
          visible_from,
          visible_to,
          show_city_presence,
          show_place_presence,
          trip_id,
          planned_place_ids,
          visibility
        FROM presence_records
        WHERE user_id = ? AND city_slug = ?
        ORDER BY visible_from DESC, rowid DESC
        LIMIT 1`,
      )
      .get(userId, cityId) as DbPresenceRow | undefined;
  }

  return db
    .prepare(
      `SELECT
        id,
        user_id,
        city_slug,
        visible_from,
        visible_to,
        show_city_presence,
        show_place_presence,
        trip_id,
        planned_place_ids,
        visibility
      FROM presence_records
      WHERE user_id = ?
      ORDER BY visible_from DESC, rowid DESC
      LIMIT 1`,
    )
    .get(userId) as DbPresenceRow | undefined;
}

function ensureProfileRecord(userId: string) {
  const existing = getProfileRow(userId);

  if (existing) {
    return existing;
  }

  const profileId = randomUUID();

  getDatabase()
    .prepare(
      `INSERT INTO profiles (id, user_id, first_name, last_name, avatar_url, travel_style, interests)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(profileId, userId, null, null, null, 'balanced', 'food,culture');

  return getProfileRow(userId)!;
}

function ensureSocialSeedData() {
  for (const user of sampleUsers) {
    upsertUser({
      allowMessages: user.visibility.allowMessages,
      countryCode: user.countryCode ?? null,
      email: user.email,
      firstName: user.name.split(' ')[0] ?? user.name,
      id: user.id,
      image: user.avatar ?? null,
      interests: user.interests,
      lastName: user.name.split(' ').slice(1).join(' ') || null,
      name: user.name,
      provider: 'seed',
      travelStyle: 'balanced',
    });
  }

  const db = getDatabase();

  for (const presence of tokyoTravelers) {
    db.prepare(
      `INSERT INTO presence_records (
        id,
        user_id,
        city_slug,
        visible_from,
        visible_to,
        show_city_presence,
        show_place_presence,
        trip_id,
        planned_place_ids,
        visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        city_slug = excluded.city_slug,
        visible_from = excluded.visible_from,
        visible_to = excluded.visible_to,
        show_city_presence = excluded.show_city_presence,
        show_place_presence = excluded.show_place_presence,
        planned_place_ids = excluded.planned_place_ids,
        visibility = excluded.visibility`,
    ).run(
      presence.id,
      presence.user.id,
      presence.cityId,
      presence.dateRange.start,
      presence.dateRange.end,
      1,
      presence.plannedPlaces.length > 0 ? 1 : 0,
      null,
      presence.plannedPlaces.join(','),
      presence.visibility,
    );

    for (const intent of presence.intents) {
      db.prepare(
        `INSERT INTO intent_records (
          id,
          presence_id,
          title,
          description,
          category,
          created_at,
          scheduled_for,
          max_group_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          scheduled_for = excluded.scheduled_for,
          max_group_size = excluded.max_group_size`,
      ).run(
        intent.id,
        presence.id,
        intent.description,
        intent.description,
        intent.category,
        intent.createdAt.toISOString(),
        intent.date ?? null,
        intent.maxGroupSize ?? null,
      );
    }
  }
}

function ensureDemoTrip(userId: string) {
  const db = getDatabase();
  const existingCount = db
    .prepare('SELECT COUNT(*) AS count FROM trips WHERE user_id = ?')
    .get(userId) as { count: number };

  if (existingCount.count > 0) {
    return;
  }

  const city = getCityById(sampleTrip.destination.id) ?? cities[0]!;
  const tripId = sampleTrip.id;
  const createdAt = sampleTrip.createdAt.toISOString();
  const updatedAt = sampleTrip.updatedAt.toISOString();

  db.prepare(
    `INSERT INTO trips (
      id,
      user_id,
      destination_city,
      destination_country,
      start_date,
      end_date,
      party_size,
      budget,
      pace,
      hidden_gem_preference,
      interests,
      is_public,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    tripId,
    userId,
    city.id,
    city.country,
    sampleTrip.startDate,
    sampleTrip.endDate,
    sampleTrip.partySize,
    sampleTrip.preferences.budget,
    sampleTrip.preferences.pace,
    sampleTrip.preferences.hiddenGemPreference,
    serializeInterests(sampleTrip.preferences.interests),
    boolToInteger(sampleTrip.isPublic),
    sampleTrip.status,
    createdAt,
    updatedAt,
  );

  for (const day of sampleTrip.days) {
    db.prepare(
      `INSERT INTO trip_days (id, trip_id, day_number, date, estimated_cost, notes)
      VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(day.id, tripId, day.day, day.date, day.estimatedCost, day.notes ?? null);

    for (const stop of day.stops) {
      db.prepare(
        `INSERT INTO trip_stops (
          id,
          day_id,
          place_id,
          place_name,
          start_time,
          end_time,
          order_index,
          travel_mode,
          travel_minutes,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        stop.id,
        day.id,
        stop.place.id,
        stop.place.name,
        stop.startTime,
        stop.endTime,
        stop.order,
        stop.travelFromPrevious?.mode ?? 'walk',
        stop.travelFromPrevious?.duration ?? 0,
        stop.notes ?? null,
      );

      if (stop.isBookmarked) {
        db.prepare(
          `INSERT INTO saved_places (id, trip_id, place_id, created_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT DO NOTHING`,
        ).run(randomUUID(), tripId, stop.place.id, nowIso());
      }
    }
  }
}

export function upsertUser(input: UpsertUserInput) {
  ensureDatabase();

  const db = getDatabase();
  const existing = db
    .prepare(
      `SELECT
        id,
        email,
        name,
        image,
        created_at,
        country_code,
        allow_messages
      FROM users
      WHERE email = ?`,
    )
    .get(input.email) as DbUserRow | undefined;

  const userId = existing?.id ?? input.id ?? randomUUID();
  const createdAt = existing?.created_at ?? nowIso();
  const name = input.name ?? existing?.name ?? input.email;
  const image = input.image ?? existing?.image ?? null;
  const countryCode = input.countryCode ?? existing?.country_code ?? null;
  const allowMessages = boolToInteger(input.allowMessages ?? integerToBool(existing?.allow_messages, true));

  db.prepare(
    `INSERT INTO users (
      id,
      email,
      name,
      image,
      provider,
      created_at,
      country_code,
      allow_messages
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      image = excluded.image,
      country_code = excluded.country_code,
      allow_messages = excluded.allow_messages`,
  ).run(
    userId,
    input.email,
    name,
    image,
    input.provider,
    createdAt,
    countryCode,
    allowMessages,
  );

  const profile = ensureProfileRecord(userId);

  db.prepare(
    `UPDATE profiles
    SET first_name = ?, last_name = ?, avatar_url = ?, travel_style = ?, interests = ?
    WHERE user_id = ?`,
  ).run(
    input.firstName ?? profile.first_name ?? null,
    input.lastName ?? profile.last_name ?? null,
    input.image ?? profile.avatar_url ?? null,
    input.travelStyle ?? profile.travel_style ?? 'balanced',
    serializeInterests(input.interests) || profile.interests || 'food,culture',
    userId,
  );

  return {
    createdAt,
    email: input.email,
    id: userId,
    image,
    name,
  };
}

export function ensureDemoData() {
  const user = upsertUser({
    allowMessages: true,
    email: 'demo@loopin.local',
    firstName: 'Demo',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    interests: ['food', 'culture', 'nature'],
    lastName: 'Traveler',
    name: 'Demo Traveler',
    provider: 'credentials',
    travelStyle: 'balanced',
  });

  ensureDemoTrip(user.id);
  ensureSocialSeedData();

  return user;
}

export function getProfile(userId: string) {
  ensureDatabase();

  const profile = getProfileRow(userId);

  if (!profile) {
    return null;
  }

  return {
    avatar_url: profile.avatar_url,
    first_name: profile.first_name,
    id: profile.id,
    interests: normalizeInterests(profile.interests),
    last_name: profile.last_name,
    travel_style: profile.travel_style,
  };
}

export function getAppUser(userId: string): User | null {
  ensureDatabase();

  const user = getUserRow(userId);

  if (!user) {
    return null;
  }

  const profile = ensureProfileRecord(userId);
  const visibility = getVisibilityForUser(userId);
  const derivedName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();

  return {
    avatar: profile.avatar_url ?? user.image ?? undefined,
    countryCode: user.country_code ?? undefined,
    createdAt: new Date(user.created_at),
    email: user.email,
    id: user.id,
    interests: normalizeInterests(profile.interests),
    name: user.name ?? (derivedName || user.email),
    visibility,
  };
}

export function updateProfile(userId: string, input: ProfileUpdateInput) {
  ensureDatabase();

  const db = getDatabase();
  const user = getUserRow(userId);

  if (!user) {
    throw new Error('User not found.');
  }

  const profile = ensureProfileRecord(userId);
  const nextFirstName = input.firstName === undefined ? profile.first_name : input.firstName;
  const nextLastName = input.lastName === undefined ? profile.last_name : input.lastName;
  const nextAvatar = input.avatarUrl === undefined ? profile.avatar_url : input.avatarUrl;
  const nextTravelStyle = input.travelStyle === undefined ? profile.travel_style : input.travelStyle;
  const nextInterests = input.interests === undefined ? normalizeInterests(profile.interests) : input.interests;
  const nextName =
    [nextFirstName, nextLastName].filter(Boolean).join(' ').trim() || user.name || user.email;

  db.prepare(
    `UPDATE users
    SET name = ?, image = ?, country_code = ?, allow_messages = ?
    WHERE id = ?`,
  ).run(
    nextName,
    nextAvatar ?? null,
    input.countryCode === undefined ? user.country_code : input.countryCode,
    boolToInteger(input.allowMessages ?? integerToBool(user.allow_messages, true)),
    userId,
  );

  db.prepare(
    `UPDATE profiles
    SET first_name = ?, last_name = ?, avatar_url = ?, travel_style = ?, interests = ?
    WHERE user_id = ?`,
  ).run(
    nextFirstName ?? null,
    nextLastName ?? null,
    nextAvatar ?? null,
    nextTravelStyle ?? 'balanced',
    serializeInterests(nextInterests),
    userId,
  );

  if (
    input.showInCityLobby !== undefined ||
    input.showPlannedPlaces !== undefined ||
    input.allowMessages !== undefined
  ) {
    const latestTrip = listTripsForUser(userId)[0];
    updatePresence(
      userId,
      {
        cityId: latestTrip?.destination.id ?? DEFAULT_CITY_ID,
        plannedPlaceIds: latestTrip?.days.flatMap((day) => day.stops.map((stop) => stop.place.id)).slice(0, 5) ?? [],
        showInCityLobby: input.showInCityLobby ?? false,
        showPlannedPlaces: input.showPlannedPlaces ?? false,
        tripId: latestTrip?.id,
        visibility: input.showInCityLobby ? 'public' : 'private',
        visibleFrom: latestTrip?.startDate,
        visibleTo: latestTrip?.endDate,
      },
      false,
    );
  }

  return {
    profile: getProfile(userId),
    user: getAppUser(userId),
  };
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

function padTime(value: number) {
  return value.toString().padStart(2, '0');
}

function minutesToTime(minutes: number) {
  const normalized = Math.max(0, minutes);
  const hours = Math.floor(normalized / 60);
  const remainingMinutes = normalized % 60;

  return `${padTime(hours)}:${padTime(remainingMinutes)}`;
}

function travelInfoForPlaces(previousPlace: Place | null, nextPlace: Place | null): TravelInfo {
  if (!previousPlace || !nextPlace) {
    return {
      distance: 0,
      duration: 0,
      mode: 'walk',
    };
  }

  const distance = haversineDistanceKm(previousPlace, nextPlace);
  const roundedDistance = Number(distance.toFixed(1));
  const duration = estimateTravelMinutes(previousPlace, nextPlace, distance <= 1.5 ? 4.5 : 18);

  if (distance <= 1.5) {
    return {
      distance: roundedDistance,
      duration,
      mode: 'walk',
    };
  }

  if (distance <= 6) {
    return {
      distance: roundedDistance,
      duration,
      mode: 'transit',
    };
  }

  return {
    distance: roundedDistance,
    duration: Math.max(8, Math.round(duration * 0.6)),
    mode: 'taxi',
  };
}

function recalculateTripDay(dayId: string) {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT
        id,
        day_id,
        place_id,
        place_name,
        start_time,
        end_time,
        order_index,
        travel_mode,
        travel_minutes,
        notes
      FROM trip_stops
      WHERE day_id = ?
      ORDER BY order_index ASC, rowid ASC`,
    )
    .all(dayId) as DbTripStopRow[];

  let cursor = DEFAULT_START_MINUTES;
  let previousPlace: Place | null = null;
  let estimatedCost = 0;

  rows.forEach((row, index) => {
    const place = getPlaceById(row.place_id) ?? createFallbackPlace(row.place_id, row.place_name, DEFAULT_CITY_ID);
    const travel = travelInfoForPlaces(previousPlace, place);
    const startTime = minutesToTime(cursor + travel.duration);
    const duration = place.typicalDuration || 60;
    const endTime = minutesToTime(cursor + travel.duration + duration);

    db.prepare(
      `UPDATE trip_stops
      SET order_index = ?, place_name = ?, start_time = ?, end_time = ?, travel_mode = ?, travel_minutes = ?
      WHERE id = ?`,
    ).run(index + 1, place.name, startTime, endTime, travel.mode, travel.duration, row.id);

    cursor = cursor + travel.duration + duration;
    estimatedCost += place.estimatedCost;
    previousPlace = place;
  });

  db.prepare('UPDATE trip_days SET estimated_cost = ? WHERE id = ?').run(estimatedCost, dayId);
}

function createTripDayRows(tripId: string, startDate: string, endDate: string) {
  const db = getDatabase();
  const dates = enumerateDates(startDate, endDate);
  const dayRows: DbTripDayRow[] = [];

  for (const [index, date] of dates.entries()) {
    const dayId = randomUUID();

    db.prepare(
      `INSERT INTO trip_days (id, trip_id, day_number, date, estimated_cost, notes)
      VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(dayId, tripId, index + 1, date, 0, null);

    dayRows.push({
      date,
      day_number: index + 1,
      estimated_cost: 0,
      id: dayId,
      notes: null,
      trip_id: tripId,
    });
  }

  return dayRows;
}

function clearTripPlan(tripId: string) {
  getDatabase().prepare('DELETE FROM trip_days WHERE trip_id = ?').run(tripId);
}

function matchesInterest(place: Place, interest: InterestType) {
  const haystack = [
    place.category,
    place.description,
    place.name,
    place.neighborhood ?? '',
    ...place.tags,
    ...(place.bestFor ?? []),
    ...(place.vibes ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const mappings: Record<InterestType, string[]> = {
    art: ['art', 'design', 'museum', 'architecture'],
    culture: ['culture', 'history', 'temple', 'shrine', 'museum', 'landmark'],
    food: ['food', 'restaurant', 'cafe', 'market', 'bakery', 'ramen', 'coffee', 'bar'],
    history: ['history', 'historic', 'temple', 'shrine', 'landmark'],
    nature: ['nature', 'garden', 'park', 'outdoor'],
    nightlife: ['nightlife', 'bar', 'late', 'drinks'],
    photography: ['photography', 'viewpoint', 'design', 'landmark', 'scenic'],
    shopping: ['shopping', 'market', 'fashion'],
    'work-friendly': ['coffee', 'calm', 'work', 'cafe'],
  };

  return mappings[interest].some((matcher) => haystack.includes(matcher));
}

function scorePlaceForTrip(place: Place, preferences: TripPreferences) {
  let score = place.popularityScore + place.hiddenGemScore;

  for (const interest of preferences.interests) {
    if (matchesInterest(place, interest)) {
      score += 30;
    }
  }

  if (preferences.hiddenGemPreference === 'local') {
    score += place.hiddenness === 'hidden' ? 35 : place.hiddenness === 'balanced' ? 10 : -20;
  } else if (preferences.hiddenGemPreference === 'mixed') {
    score += place.hiddenness === 'touristy' ? 5 : 20;
  } else {
    score += place.hiddenness === 'touristy' ? 30 : 5;
  }

  if (preferences.budget === 'low' && place.costLevel >= 3) {
    score -= 25;
  } else if (preferences.budget === 'mid' && place.costLevel === 4) {
    score -= 10;
  } else if (preferences.budget === 'high') {
    score += place.costLevel * 3;
  }

  if (preferences.pace === 'relaxed' && place.typicalDuration > 90) {
    score += 5;
  }

  if (preferences.pace === 'packed' && place.typicalDuration <= 60) {
    score += 8;
  }

  return score;
}

function selectPlacesForTrip(trip: Trip) {
  const catalog = getPlacesForCity(trip.destination.id);
  const sorted = [...catalog].sort(
    (left, right) => scorePlaceForTrip(right, trip.preferences) - scorePlaceForTrip(left, trip.preferences),
  );
  const desiredCount = Math.max(4, enumerateDates(trip.startDate, trip.endDate).length * 4);

  return sorted.slice(0, desiredCount);
}

function persistTripStops(dayRows: DbTripDayRow[], selectedPlaces: Place[]) {
  const db = getDatabase();
  const stopsPerDay = Math.max(1, Math.ceil(selectedPlaces.length / Math.max(1, dayRows.length)));

  dayRows.forEach((dayRow, dayIndex) => {
    const dayPlaces = selectedPlaces.slice(dayIndex * stopsPerDay, (dayIndex + 1) * stopsPerDay);

    dayPlaces.forEach((place, placeIndex) => {
      db.prepare(
        `INSERT INTO trip_stops (
          id,
          day_id,
          place_id,
          place_name,
          start_time,
          end_time,
          order_index,
          travel_mode,
          travel_minutes,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(),
        dayRow.id,
        place.id,
        place.name,
        '09:00',
        '10:00',
        placeIndex + 1,
        placeIndex === 0 ? 'walk' : 'transit',
        placeIndex === 0 ? 0 : 10,
        null,
      );
    });

    recalculateTripDay(dayRow.id);
  });
}

function getTripDayRows(tripId: string) {
  return getDatabase()
    .prepare(
      `SELECT
        id,
        trip_id,
        day_number,
        date,
        estimated_cost,
        notes
      FROM trip_days
      WHERE trip_id = ?
      ORDER BY day_number ASC`,
    )
    .all(tripId) as DbTripDayRow[];
}

function bookmarkedPlaceIdsForTrip(tripId: string) {
  const rows = getDatabase()
    .prepare('SELECT place_id FROM saved_places WHERE trip_id = ?')
    .all(tripId) as Array<{ place_id: string }>;

  return new Set(rows.map((row) => row.place_id));
}

function hydrateTripRow(tripRow: DbTripRow) {
  const destination = getCityById(tripRow.destination_city) ?? cities[0]!;
  const owner = getAppUser(tripRow.user_id);
  const bookmarkedPlaceIds = bookmarkedPlaceIdsForTrip(tripRow.id);
  const dayRows = getTripDayRows(tripRow.id);
  const collaboratorRows = getTripCollaboratorRows(tripRow.id);

  const days: DayPlan[] = dayRows.map((dayRow) => {
    const stopRows = getDatabase()
      .prepare(
        `SELECT
          id,
          day_id,
          place_id,
          place_name,
          start_time,
          end_time,
          order_index,
          travel_mode,
          travel_minutes,
          notes
        FROM trip_stops
        WHERE day_id = ?
        ORDER BY order_index ASC`,
      )
      .all(dayRow.id) as DbTripStopRow[];

    let previousPlace: Place | null = null;

    const stops: DayStop[] = stopRows.map((stopRow) => {
      const place =
        getPlaceById(stopRow.place_id) ??
        createFallbackPlace(stopRow.place_id, stopRow.place_name, tripRow.destination_city);
      const travel = travelInfoForPlaces(previousPlace, place);

      previousPlace = place;

      return {
        endTime: stopRow.end_time ?? stopRow.start_time,
        id: stopRow.id,
        isBookmarked: bookmarkedPlaceIds.has(stopRow.place_id),
        notes: stopRow.notes ?? undefined,
        order: stopRow.order_index,
        place,
        startTime: stopRow.start_time,
        travelFromPrevious: {
          distance: travel.distance,
          duration: stopRow.travel_minutes ?? travel.duration,
          mode: (stopRow.travel_mode as TravelInfo['mode'] | null) ?? travel.mode,
        },
      };
    });

    return {
      date: dayRow.date,
      day: dayRow.day_number,
      estimatedCost: dayRow.estimated_cost,
      id: dayRow.id,
      notes: dayRow.notes ?? undefined,
      stops,
    };
  });

  const collaborators: Collaborator[] = owner
    ? [
        {
          invitedAt: new Date(tripRow.created_at),
          role: 'owner' as const,
          user: owner,
          userId: owner.id,
        },
      ]
    : [];

  for (const collaboratorRow of collaboratorRows) {
    const collaboratorUser = getAppUser(collaboratorRow.user_id);

    if (!collaboratorUser || collaborators.some((entry) => entry.userId === collaboratorUser.id)) {
      continue;
    }

    collaborators.push({
      invitedAt: new Date(collaboratorRow.created_at),
      role: collaboratorRow.role,
      user: collaboratorUser,
      userId: collaboratorUser.id,
    });
  }

  return {
    collaborators,
    createdAt: new Date(tripRow.created_at),
    days,
    destination,
    endDate: tripRow.end_date,
    id: tripRow.id,
    isPublic: integerToBool(tripRow.is_public),
    partySize: tripRow.party_size,
    preferences: {
      budget: (tripRow.budget as TripPreferences['budget']) ?? 'mid',
      hiddenGemPreference:
        (tripRow.hidden_gem_preference as TripPreferences['hiddenGemPreference']) ?? 'mixed',
      interests: normalizeInterests(tripRow.interests),
      pace: (tripRow.pace as TripPreferences['pace']) ?? 'balanced',
    },
    startDate: tripRow.start_date,
    status: (tripRow.status as Trip['status']) ?? 'draft',
    updatedAt: new Date(tripRow.updated_at),
  } satisfies Trip;
}

function getAuthorizedTripRow(tripId: string, userId: string) {
  const trip = getTripRow(tripId);

  if (!trip) {
    throw new Error('Trip not found.');
  }

  const isCollaborator = getTripCollaboratorRows(tripId).some((row) => row.user_id === userId);

  if (trip.user_id !== userId && !isCollaborator) {
    throw new Error('Trip access denied.');
  }

  return trip;
}

export function listTripsForUser(userId: string) {
  ensureDatabase();

  const rows = getDatabase()
    .prepare(
      `SELECT
        id,
        user_id,
        destination_city,
        destination_country,
        start_date,
        end_date,
        party_size,
        budget,
        pace,
        hidden_gem_preference,
        interests,
        is_public,
        status,
        created_at,
        updated_at
      FROM trips
      WHERE user_id = ?
        OR id IN (
          SELECT trip_id
          FROM trip_collaborators
          WHERE user_id = ?
        )
      ORDER BY updated_at DESC, created_at DESC`,
    )
    .all(userId, userId) as DbTripRow[];

  return rows.map((row) => hydrateTripRow(row));
}

export function getTripById(tripId: string, userId: string) {
  return hydrateTripRow(getAuthorizedTripRow(tripId, userId));
}

export function createTrip(userId: string, input: CreateTripRequest) {
  ensureDatabase();

  const city = getCityById(input.cityId) ?? cities[0]!;
  const tripId = randomUUID();
  const timestamp = nowIso();

  getDatabase()
    .prepare(
      `INSERT INTO trips (
        id,
        user_id,
        destination_city,
        destination_country,
        start_date,
        end_date,
        party_size,
        budget,
        pace,
        hidden_gem_preference,
        interests,
        is_public,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      tripId,
      userId,
      city.id,
      city.country,
      input.startDate,
      input.endDate,
      input.partySize,
      input.preferences.budget,
      input.preferences.pace,
      input.preferences.hiddenGemPreference,
      serializeInterests(input.preferences.interests),
      boolToInteger(input.isPublic),
      input.status,
      timestamp,
      timestamp,
    );

  const dayRows = createTripDayRows(tripId, input.startDate, input.endDate);

  if (input.generateItinerary) {
    const trip = hydrateTripRow(getTripRow(tripId)!);
    persistTripStops(dayRows, selectPlacesForTrip(trip));
  }

  return getTripById(tripId, userId);
}

export function regenerateTripItinerary(tripId: string, userId: string) {
  const tripRow = getAuthorizedTripRow(tripId, userId);
  const trip = hydrateTripRow(tripRow);

  clearTripPlan(tripId);
  const dayRows = createTripDayRows(tripId, trip.startDate, trip.endDate);
  persistTripStops(dayRows, selectPlacesForTrip(trip));
  touchTrip(tripId);

  return getTripById(tripId, userId);
}

export function updateTrip(userId: string, tripId: string, input: UpdateTripRequest) {
  const tripRow = getAuthorizedTripRow(tripId, userId);
  const currentTrip = hydrateTripRow(tripRow);
  const nextCity = getCityById(input.cityId ?? currentTrip.destination.id) ?? currentTrip.destination;
  const nextPreferences = {
    ...currentTrip.preferences,
    ...(input.preferences ?? {}),
    interests: input.preferences?.interests ?? currentTrip.preferences.interests,
  };
  const nextStartDate = input.startDate ?? currentTrip.startDate;
  const nextEndDate = input.endDate ?? currentTrip.endDate;

  getDatabase()
    .prepare(
      `UPDATE trips
      SET
        destination_city = ?,
        destination_country = ?,
        start_date = ?,
        end_date = ?,
        party_size = ?,
        budget = ?,
        pace = ?,
        hidden_gem_preference = ?,
        interests = ?,
        is_public = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?`,
    )
    .run(
      nextCity.id,
      nextCity.country,
      nextStartDate,
      nextEndDate,
      input.partySize ?? currentTrip.partySize,
      nextPreferences.budget,
      nextPreferences.pace,
      nextPreferences.hiddenGemPreference,
      serializeInterests(nextPreferences.interests),
      boolToInteger(input.isPublic ?? currentTrip.isPublic),
      input.status ?? currentTrip.status,
      nowIso(),
      tripId,
    );

  if (
    input.generateItinerary ||
    input.cityId !== undefined ||
    input.startDate !== undefined ||
    input.endDate !== undefined
  ) {
    return regenerateTripItinerary(tripId, userId);
  }

  return getTripById(tripId, userId);
}

function resolveDayId(tripId: string, input: AddStopRequest) {
  const dayRows = getTripDayRows(tripId);

  if (input.dayId) {
    const matching = dayRows.find((day) => day.id === input.dayId);

    if (!matching) {
      throw new Error('Trip day not found.');
    }

    return matching.id;
  }

  if (input.day) {
    const matching = dayRows.find((day) => day.day_number === input.day);

    if (!matching) {
      throw new Error('Trip day not found.');
    }

    return matching.id;
  }

  return dayRows[0]?.id ?? createTripDayRows(tripId, getTripRow(tripId)!.start_date, getTripRow(tripId)!.end_date)[0]!.id;
}

function setBookmarkForStop(tripId: string, placeId: string, isBookmarked: boolean) {
  const db = getDatabase();

  if (!isBookmarked) {
    db.prepare('DELETE FROM saved_places WHERE trip_id = ? AND place_id = ?').run(tripId, placeId);
    return;
  }

  db.prepare(
    `INSERT INTO saved_places (id, trip_id, place_id, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT DO NOTHING`,
  ).run(randomUUID(), tripId, placeId, nowIso());
}

export function addTripStop(userId: string, tripId: string, input: AddStopRequest) {
  getAuthorizedTripRow(tripId, userId);

  const place = getPlaceById(input.placeId);

  if (!place) {
    throw new Error('Place not found.');
  }

  const dayId = resolveDayId(tripId, input);
  const existingStops = getDatabase()
    .prepare('SELECT id, order_index FROM trip_stops WHERE day_id = ? ORDER BY order_index ASC')
    .all(dayId) as Array<{ id: string; order_index: number }>;

  const orderIndex = input.insertAt ?? existingStops.length + 1;

  getDatabase()
    .prepare('UPDATE trip_stops SET order_index = order_index + 1 WHERE day_id = ? AND order_index >= ?')
    .run(dayId, orderIndex);

  getDatabase()
    .prepare(
      `INSERT INTO trip_stops (
        id,
        day_id,
        place_id,
        place_name,
        start_time,
        end_time,
        order_index,
        travel_mode,
        travel_minutes,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      dayId,
      place.id,
      place.name,
      '09:00',
      '10:00',
      orderIndex,
      'walk',
      0,
      input.notes ?? null,
    );

  setBookmarkForStop(tripId, place.id, input.isBookmarked);
  recalculateTripDay(dayId);
  touchTrip(tripId);

  return getTripById(tripId, userId);
}

function getStopRow(tripId: string, stopId: string) {
  return getDatabase()
    .prepare(
      `SELECT
        trip_stops.id,
        trip_stops.day_id,
        trip_stops.place_id,
        trip_stops.place_name,
        trip_stops.start_time,
        trip_stops.end_time,
        trip_stops.order_index,
        trip_stops.travel_mode,
        trip_stops.travel_minutes,
        trip_stops.notes
      FROM trip_stops
      INNER JOIN trip_days ON trip_days.id = trip_stops.day_id
      WHERE trip_stops.id = ? AND trip_days.trip_id = ?`,
    )
    .get(stopId, tripId) as DbTripStopRow | undefined;
}

export function removeTripStop(userId: string, tripId: string, stopId: string) {
  getAuthorizedTripRow(tripId, userId);
  const stopRow = getStopRow(tripId, stopId);

  if (!stopRow) {
    throw new Error('Trip stop not found.');
  }

  getDatabase().prepare('DELETE FROM trip_stops WHERE id = ?').run(stopId);
  getDatabase().prepare('DELETE FROM saved_places WHERE trip_id = ? AND place_id = ?').run(tripId, stopRow.place_id);
  recalculateTripDay(stopRow.day_id);
  touchTrip(tripId);

  return getTripById(tripId, userId);
}

function findSwapCandidate(trip: Trip, originalPlaceId: string, requestedPlaceId?: string) {
  if (requestedPlaceId) {
    const requestedPlace = getPlaceById(requestedPlaceId);

    if (requestedPlace) {
      return requestedPlace;
    }
  }

  const suggestion = swapSuggestions.find((entry) => entry.originalPlace.id === originalPlaceId);

  if (suggestion) {
    return suggestion.suggestedPlace;
  }

  const originalPlace = getPlaceById(originalPlaceId);

  if (!originalPlace) {
    return null;
  }

  return getPlacesForCity(trip.destination.id)
    .filter((candidate) => candidate.id !== originalPlace.id && candidate.category === originalPlace.category)
    .sort((left, right) => {
      const leftDistance = haversineDistanceKm(originalPlace, left);
      const rightDistance = haversineDistanceKm(originalPlace, right);

      return leftDistance - rightDistance;
    })[0] ?? null;
}

export function swapTripStop(userId: string, tripId: string, stopId: string, input: SwapStopRequest) {
  getAuthorizedTripRow(tripId, userId);
  const trip = getTripById(tripId, userId);
  const stopRow = getStopRow(tripId, stopId);

  if (!stopRow) {
    throw new Error('Trip stop not found.');
  }

  const nextPlace = findSwapCandidate(trip, stopRow.place_id, input.placeId);

  if (!nextPlace) {
    throw new Error('No swap candidate found.');
  }

  const isBookmarked = bookmarkedPlaceIdsForTrip(tripId).has(stopRow.place_id);

  getDatabase()
    .prepare('UPDATE trip_stops SET place_id = ?, place_name = ? WHERE id = ?')
    .run(nextPlace.id, nextPlace.name, stopId);

  if (isBookmarked) {
    setBookmarkForStop(tripId, stopRow.place_id, false);
    setBookmarkForStop(tripId, nextPlace.id, true);
  }

  recalculateTripDay(stopRow.day_id);
  touchTrip(tripId);

  return {
    replacement: nextPlace,
    trip: getTripById(tripId, userId),
  };
}

export function skipTripStop(userId: string, tripId: string, stopId: string, input: SwapStopRequest) {
  const trip = getTripById(tripId, userId);
  const stopRow = getStopRow(tripId, stopId);

  if (!stopRow) {
    throw new Error('Trip stop not found.');
  }

  const replacement = findSwapCandidate(trip, stopRow.place_id, input.placeId);

  if (!replacement) {
    return {
      replacement: null,
      trip: removeTripStop(userId, tripId, stopId),
    };
  }

  return swapTripStop(userId, tripId, stopId, {
    placeId: replacement.id,
  });
}

function touchTrip(tripId: string) {
  getDatabase().prepare('UPDATE trips SET updated_at = ? WHERE id = ?').run(nowIso(), tripId);
}

export function getDiscoveryState(query: DiscoveryQuery) {
  const city = getCityById(query.cityId) ?? cities[0]!;
  const basePlaces = getPlacesForCity(city.id);
  const normalizedQuery = query.q?.trim().toLowerCase();

  const filteredPlaces = basePlaces.filter((place) => {
    if (query.category && place.category !== query.category) {
      return false;
    }

    if (query.hiddenOnly && place.hiddenness !== 'hidden') {
      return false;
    }

    if (query.budget === 'low' && place.costLevel > 1) {
      return false;
    }

    if (query.budget === 'mid' && place.costLevel > 2) {
      return false;
    }

    if (normalizedQuery) {
      const haystack = `${place.name} ${place.description} ${place.neighborhood ?? ''} ${place.tags.join(' ')}`.toLowerCase();

      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  return {
    categories: quickActions,
    city,
    dishes: city.id === 'tokyo' ? tokyoDishes : [],
    hiddenGems: filteredPlaces.filter((place) => place.hiddenness === 'hidden'),
    mustSee: filteredPlaces.filter((place) => place.popularityScore >= 80),
    places: filteredPlaces,
  };
}

function defaultOriginForCity(cityId: string) {
  return CITY_CENTERS[cityId] ?? CITY_CENTERS[DEFAULT_CITY_ID];
}

function matchesQuickAction(place: Place, quickActionId: string) {
  switch (quickActionId) {
    case 'coffee-break':
      return place.category === 'cafe';
    case 'fill-hour':
      return place.typicalDuration <= 60;
    case 'hidden-gems':
      return place.hiddenness === 'hidden';
    case 'late-night':
      return place.category === 'bar' || place.category === 'restaurant';
    case 'rainy-day':
      return ['museum', 'cafe', 'shopping', 'market'].includes(place.category);
    default:
      return true;
  }
}

function buildNearbySuggestions(
  query: NearbyQuery,
  tripPreferences?: TripPreferences,
) {
  const cityId = query.cityId ?? DEFAULT_CITY_ID;
  const origin = {
    lat: query.lat ?? defaultOriginForCity(cityId).lat,
    lng: query.lng ?? defaultOriginForCity(cityId).lng,
  };
  const basePlaces = getPlacesForCity(cityId).filter((place) => !query.category || place.category === query.category);
  const filteredPlaces = query.quickAction
    ? basePlaces.filter((place) => matchesQuickAction(place, query.quickAction!))
    : basePlaces;

  if (filteredPlaces.length === 0) {
    return seededNearMeSuggestions.slice(0, 4);
  }

  return filteredPlaces
    .map((place) => {
      const distance = haversineDistanceKm(origin, place);
      const duration = estimateTravelMinutes(origin, place, distance <= 1.5 ? 4.5 : 18);
      const fitsTimeSlot = duration + place.typicalDuration <= (query.minutesAvailable ?? 90);
      const interestBoost = tripPreferences?.interests.some((interest) => matchesInterest(place, interest))
        ? 18
        : 0;
      const score =
        place.popularityScore +
        place.hiddenGemScore +
        interestBoost +
        (fitsTimeSlot ? 20 : -25) -
        duration * 1.5 -
        distance * 6;

      return {
        distance: Number(distance.toFixed(1)),
        estimatedArrival: `${Math.max(3, duration)} min ${distance <= 1.5 ? 'walk' : 'ride'}`,
        fitsTimeSlot,
        matchScore: Math.max(1, Math.round(score)),
        place,
        reason:
          query.quickAction === 'hidden-gems'
            ? 'Quiet, local-leaning option nearby'
            : interestBoost > 0
              ? 'Strong match for your trip interests'
              : fitsTimeSlot
                ? 'Fits your current time window'
                : 'Worth the extra travel if you want a stronger stop',
      } satisfies NearMeSuggestion;
    })
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 6);
}

export function getNearbyState(query: NearbyQuery, userId?: string) {
  const latestTrip = query.tripId && userId ? getTripById(query.tripId, userId) : userId ? listTripsForUser(userId)[0] : undefined;
  const suggestions = buildNearbySuggestions(query, latestTrip?.preferences);

  return {
    quickActions,
    suggestions,
  };
}

function buildTravelerPresence(row: DbPresenceRow): TravelerPresence | null {
  const user = getAppUser(row.user_id);

  if (!user) {
    return null;
  }

  const intentRows = getDatabase()
    .prepare(
      `SELECT
        id,
        presence_id,
        title,
        description,
        category,
        created_at,
        scheduled_for,
        max_group_size
      FROM intent_records
      WHERE presence_id = ?
      ORDER BY created_at DESC`,
    )
    .all(row.id) as DbIntentRow[];

  const intents: TravelIntent[] = intentRows.map((intentRow) => ({
    category: intentRow.category as TravelIntent['category'],
    createdAt: new Date(intentRow.created_at),
    date: intentRow.scheduled_for ?? undefined,
    description: intentRow.description,
    id: intentRow.id,
    maxGroupSize: intentRow.max_group_size ?? undefined,
  }));

  return {
    cityId: row.city_slug,
    dateRange: {
      end: row.visible_to,
      start: row.visible_from,
    },
    id: row.id,
    intents,
    plannedPlaces: integerToBool(row.show_place_presence) ? row.planned_place_ids.split(',').filter(Boolean) : [],
    user,
    visibility: (row.visibility as TravelerPresence['visibility']) ?? 'public',
  };
}

export function getSocialState(query: SocialQuery, userId: string): SocialState {
  ensureDatabase();
  ensureSocialSeedData();

  const cityId = query.cityId ?? DEFAULT_CITY_ID;
  const db = getDatabase();
  const presenceRows = db
    .prepare(
      `SELECT
        id,
        user_id,
        city_slug,
        visible_from,
        visible_to,
        show_city_presence,
        show_place_presence,
        trip_id,
        planned_place_ids,
        visibility
      FROM presence_records
      WHERE city_slug = ? AND user_id <> ? AND show_city_presence = 1
      ORDER BY visible_from ASC, rowid ASC`,
    )
    .all(cityId, userId) as DbPresenceRow[];

  const travelers = presenceRows
    .map((row) => buildTravelerPresence(row))
    .filter((presence): presence is TravelerPresence => Boolean(presence));

  const placePresenceMap = new Map<string, { count: number; travelerIds: string[] }>();

  for (const traveler of travelers) {
    for (const placeId of traveler.plannedPlaces) {
      const current = placePresenceMap.get(placeId) ?? { count: 0, travelerIds: [] };
      current.count += 1;
      current.travelerIds.push(traveler.user.id);
      placePresenceMap.set(placeId, current);
    }
  }

  const placePresence = [...placePresenceMap.entries()]
    .map(([placeId, value]) => {
      const place = getPlaceById(placeId);

      if (!place) {
        return null;
      }

      return {
        count: value.count,
        place,
        travelerIds: value.travelerIds,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const intents = travelers.flatMap((traveler) =>
    traveler.intents.map((intent) => ({
      ...intent,
      user: traveler.user,
    })),
  );

  const connectionRows = db
    .prepare(
      `SELECT
        id,
        requester_user_id,
        target_user_id,
        trip_id,
        status,
        created_at,
        updated_at
      FROM connection_requests
      WHERE requester_user_id = ? OR target_user_id = ?
      ORDER BY updated_at DESC, created_at DESC`,
    )
    .all(userId, userId) as DbConnectionRow[];

  const connections = connectionRows
    .map((row) => {
      const otherUserId = row.requester_user_id === userId ? row.target_user_id : row.requester_user_id;
      const otherUser = getAppUser(otherUserId);

      if (!otherUser) {
        return null;
      }

      return {
        createdAt: new Date(row.created_at),
        id: row.id,
        otherUser,
        status: row.status as Connection['status'],
        tripContext: row.trip_id ?? undefined,
        users: [row.requester_user_id, row.target_user_id] as [string, string],
      };
    })
    .filter((connection): connection is NonNullable<typeof connection> => Boolean(connection));

  const ownPresence = getLatestPresenceForUser(userId, cityId);

  return {
    cityId,
    connections,
    currentVisibility: {
      ...getVisibilityForUser(userId),
      visibility: (ownPresence?.visibility as SocialState['currentVisibility']['visibility']) ?? 'private',
    },
    intents,
    placePresence,
    travelers,
  };
}

export function updatePresence(userId: string, input: PresenceUpdateInput, touchUserTrip = true) {
  ensureDatabase();

  const db = getDatabase();
  const existing = getLatestPresenceForUser(userId, input.cityId);
  const latestTrip = input.tripId ? getTripById(input.tripId, userId) : listTripsForUser(userId)[0];
  const visibleFrom = input.visibleFrom ?? (latestTrip ? latestTrip.startDate : nowIso().slice(0, 10));
  const visibleTo = input.visibleTo ?? (latestTrip ? latestTrip.endDate : visibleFrom);
  const visibility =
    input.visibility ??
    (input.showInCityLobby ? 'public' : 'private');

  if (existing) {
    db.prepare(
      `UPDATE presence_records
      SET
        city_slug = ?,
        visible_from = ?,
        visible_to = ?,
        show_city_presence = ?,
        show_place_presence = ?,
        trip_id = ?,
        planned_place_ids = ?,
        visibility = ?
      WHERE id = ?`,
    ).run(
      input.cityId,
      visibleFrom,
      visibleTo,
      boolToInteger(input.showInCityLobby),
      boolToInteger(input.showPlannedPlaces),
      input.tripId ?? existing.trip_id ?? null,
      (input.plannedPlaceIds ?? []).join(','),
      visibility,
      existing.id,
    );

    if (touchUserTrip && input.tripId) {
      touchTrip(input.tripId);
    }

    return buildTravelerPresence(getLatestPresenceForUser(userId, input.cityId)!);
  }

  const presenceId = randomUUID();

  db.prepare(
    `INSERT INTO presence_records (
      id,
      user_id,
      city_slug,
      visible_from,
      visible_to,
      show_city_presence,
      show_place_presence,
      trip_id,
      planned_place_ids,
      visibility
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    presenceId,
    userId,
    input.cityId,
    visibleFrom,
    visibleTo,
    boolToInteger(input.showInCityLobby),
    boolToInteger(input.showPlannedPlaces),
    input.tripId ?? null,
    (input.plannedPlaceIds ?? []).join(','),
    visibility,
  );

  if (touchUserTrip && input.tripId) {
    touchTrip(input.tripId);
  }

  return buildTravelerPresence(getLatestPresenceForUser(userId, input.cityId)!);
}

export function createIntent(userId: string, input: CreateIntentInput) {
  const presence =
    getLatestPresenceForUser(userId, input.cityId) ??
    (updatePresence(
      userId,
      {
        cityId: input.cityId,
        plannedPlaceIds: input.plannedPlaceIds,
        showInCityLobby: true,
        showPlannedPlaces: input.plannedPlaceIds.length > 0,
        tripId: input.tripId,
        visibility: 'public',
        visibleFrom: input.date,
        visibleTo: input.date,
      },
      false,
    ),
    getLatestPresenceForUser(userId, input.cityId)!);

  getDatabase()
    .prepare(
      `INSERT INTO intent_records (
        id,
        presence_id,
        title,
        description,
        category,
        created_at,
        scheduled_for,
        max_group_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      presence.id,
      input.description,
      input.description,
      input.category,
      nowIso(),
      input.date ?? null,
      input.maxGroupSize ?? null,
    );

  return getSocialState({ cityId: input.cityId }, userId);
}

export function createConnection(userId: string, input: CreateConnectionInput) {
  ensureDatabase();

  if (input.targetUserId === userId) {
    throw new Error('Cannot connect to yourself.');
  }

  const targetUser = getUserRow(input.targetUserId);

  if (!targetUser) {
    throw new Error('Target user not found.');
  }

  const existing = getDatabase()
    .prepare(
      `SELECT
        id,
        requester_user_id,
        target_user_id,
        trip_id,
        status,
        created_at,
        updated_at
      FROM connection_requests
      WHERE
        ((requester_user_id = ? AND target_user_id = ?) OR (requester_user_id = ? AND target_user_id = ?))
        AND (trip_id IS ? OR trip_id = ?)`,
    )
    .get(userId, input.targetUserId, input.targetUserId, userId, input.tripId ?? null, input.tripId ?? null) as
    | DbConnectionRow
    | undefined;

  if (!existing) {
    getDatabase()
      .prepare(
        `INSERT INTO connection_requests (
          id,
          requester_user_id,
          target_user_id,
          trip_id,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        randomUUID(),
        userId,
        input.targetUserId,
        input.tripId ?? null,
        'pending',
        nowIso(),
        nowIso(),
      );
  }

  return getSocialState({ cityId: DEFAULT_CITY_ID }, userId).connections;
}

export function inviteTripCollaborator(
  userId: string,
  tripId: string,
  email: string,
  role: Collaborator['role'],
) {
  const trip = getAuthorizedTripRow(tripId, userId);

  if (trip.user_id !== userId) {
    throw new Error('Only the trip owner can invite collaborators.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Collaborator email is required.');
  }

  const collaboratorUser =
    getUserRowByEmail(normalizedEmail) ??
    getUserRow(
      upsertUser({
        allowMessages: false,
        email: normalizedEmail,
        firstName: deriveNameFromEmail(normalizedEmail),
        name: deriveNameFromEmail(normalizedEmail),
        provider: 'invite',
      }).id,
    );

  if (!collaboratorUser) {
    throw new Error('Failed to prepare collaborator account.');
  }

  const existing = getTripCollaboratorRows(tripId).find((row) => row.user_id === collaboratorUser.id);

  if (existing) {
    getDatabase()
      .prepare('UPDATE trip_collaborators SET role = ?, created_at = ? WHERE id = ?')
      .run(role, nowIso(), existing.id);
  } else {
    getDatabase()
      .prepare(
        `INSERT INTO trip_collaborators (id, trip_id, user_id, role, created_at)
        VALUES (?, ?, ?, ?, ?)`,
      )
      .run(randomUUID(), tripId, collaboratorUser.id, role, nowIso());
  }

  touchTrip(tripId);

  return getTripById(tripId, userId);
}

export function removeTripCollaborator(
  userId: string,
  tripId: string,
  collaboratorUserId: string,
) {
  const trip = getAuthorizedTripRow(tripId, userId);

  if (trip.user_id !== userId) {
    throw new Error('Only the trip owner can manage collaborators.');
  }

  getDatabase()
    .prepare('DELETE FROM trip_collaborators WHERE trip_id = ? AND user_id = ?')
    .run(tripId, collaboratorUserId);

  touchTrip(tripId);

  return getTripById(tripId, userId);
}

export function updateConnection(userId: string, input: UpdateConnectionInput) {
  const row = getDatabase()
    .prepare(
      `SELECT
        id,
        requester_user_id,
        target_user_id,
        trip_id,
        status,
        created_at,
        updated_at
      FROM connection_requests
      WHERE id = ?`,
    )
    .get(input.connectionId) as DbConnectionRow | undefined;

  if (!row) {
    throw new Error('Connection not found.');
  }

  if (row.requester_user_id !== userId && row.target_user_id !== userId) {
    throw new Error('Connection access denied.');
  }

  getDatabase()
    .prepare('UPDATE connection_requests SET status = ?, updated_at = ? WHERE id = ?')
    .run(input.status, nowIso(), input.connectionId);

  return getSocialState({ cityId: DEFAULT_CITY_ID }, userId).connections;
}

export function getAppBootstrapState(userId: string, cityId?: string): AppBootstrapState {
  ensureDatabase();
  ensureSocialSeedData();

  const trips = listTripsForUser(userId);
  const activeTrip = trips[0] ?? null;
  const resolvedCityId = cityId ?? activeTrip?.destination.id ?? DEFAULT_CITY_ID;
  const discovery = getDiscoveryState({ cityId: resolvedCityId, hiddenOnly: false });
  const nearby = getNearbyState(
    {
      cityId: resolvedCityId,
      lat: activeTrip?.days[0]?.stops[0]?.place.lat,
      lng: activeTrip?.days[0]?.stops[0]?.place.lng,
      minutesAvailable: 90,
      quickAction: undefined,
      tripId: activeTrip?.id,
    },
    userId,
  );

  return {
    activeTrip,
    dbPath: getLocalDatabasePath(),
    discovery,
    nearby,
    profile: getProfile(userId),
    social: getSocialState({ cityId: resolvedCityId }, userId),
    trips,
    user: getAppUser(userId),
  };
}

export function __resetLocalDbForTests() {
  initialized = false;

  if (database) {
    database.close();
    database = null;
  }
}

function haversineDistanceKm(origin: { lat: number; lng: number }, target: { lat: number; lng: number }) {
  const dLat = toRadians(target.lat - origin.lat);
  const dLng = toRadians(target.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const targetLat = toRadians(target.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function estimateTravelMinutes(
  origin: { lat: number; lng: number },
  target: { lat: number; lng: number },
  averageKmh = 4.5,
) {
  const distanceKm = haversineDistanceKm(origin, target);

  return Math.max(0, Math.round((distanceKm / averageKmh) * 60));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
