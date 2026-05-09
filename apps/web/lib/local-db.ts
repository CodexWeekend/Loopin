import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

type DbUser = {
  createdAt: string;
  email: string;
  id: string;
  image: string | null;
  name: string | null;
};

type DbProfile = {
  avatar_url: string | null;
  first_name: string | null;
  id: string;
  interests: string[];
  last_name: string | null;
  travel_style: string | null;
};

function resolveWebRoot() {
  const cwd = process.cwd();

  if (existsSync(join(cwd, 'app')) && existsSync(join(cwd, 'package.json'))) {
    return cwd;
  }

  return join(cwd, 'apps', 'web');
}

const dbDirectory = join(resolveWebRoot(), 'data');
mkdirSync(dbDirectory, { recursive: true });

const databasePath = join(dbDirectory, 'loopin.sqlite');
const database = new DatabaseSync(databasePath);

let initialized = false;

export function ensureDatabase() {
  if (initialized) {
    return;
  }

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
  `);

  initialized = true;
}

export function upsertUser(input: {
  email: string;
  firstName?: string | null;
  image?: string | null;
  lastName?: string | null;
  name?: string | null;
  provider: string;
}) {
  ensureDatabase();

  const existing = database
    .prepare('SELECT id, email, name, image, created_at AS createdAt FROM users WHERE email = ?')
    .get(input.email) as DbUser | undefined;

  if (existing) {
    database
      .prepare('UPDATE users SET name = ?, image = ?, provider = ? WHERE id = ?')
      .run(input.name ?? existing.name, input.image ?? existing.image, input.provider, existing.id);
    upsertProfile(existing.id, input);
    return existing;
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  database
    .prepare('INSERT INTO users (id, email, name, image, provider, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, input.email, input.name ?? input.email, input.image ?? null, input.provider, createdAt);

  upsertProfile(id, input);

  return {
    createdAt,
    email: input.email,
    id,
    image: input.image ?? null,
    name: input.name ?? input.email,
  };
}

export function getProfile(userId: string): DbProfile | null {
  ensureDatabase();

  const profile = database
    .prepare(
      'SELECT id, first_name AS first_name, last_name AS last_name, avatar_url AS avatar_url, travel_style AS travel_style, interests FROM profiles WHERE user_id = ?',
    )
    .get(userId) as
      | {
          avatar_url: string | null;
          first_name: string | null;
          id: string;
          interests: string;
          last_name: string | null;
          travel_style: string | null;
        }
      | undefined;

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    interests: profile.interests ? profile.interests.split(',').filter(Boolean) : [],
  };
}

export function ensureDemoData() {
  upsertUser({
    email: 'demo@loopin.local',
    firstName: 'Demo',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    lastName: 'Traveler',
    name: 'Demo Traveler',
    provider: 'credentials',
  });
}

function upsertProfile(
  userId: string,
  input: {
    firstName?: string | null;
    image?: string | null;
    lastName?: string | null;
  },
) {
  const existing = database
    .prepare('SELECT id FROM profiles WHERE user_id = ?')
    .get(userId) as { id: string } | undefined;

  if (existing) {
    database
      .prepare('UPDATE profiles SET first_name = ?, last_name = ?, avatar_url = ? WHERE user_id = ?')
      .run(
        input.firstName ?? null,
        input.lastName ?? null,
        input.image ?? null,
        userId,
      );
    return;
  }

  database
    .prepare(
      'INSERT INTO profiles (id, user_id, first_name, last_name, avatar_url, travel_style, interests) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      randomUUID(),
      userId,
      input.firstName ?? null,
      input.lastName ?? null,
      input.image ?? null,
      'balanced',
      'food,culture,nature',
    );
}
