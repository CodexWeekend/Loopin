import { z } from 'zod';

export const tripBudgetBands = ['low', 'medium', 'high'] as const;
export const tripInterests = [
  'food',
  'culture',
  'nightlife',
  'nature',
  'shopping',
  'work-friendly',
] as const;
export const tripPaces = ['relaxed', 'balanced', 'packed'] as const;
export const hiddenGemPreferences = ['touristy', 'mixed', 'mostly-local'] as const;
export const placeCategories = ['landmark', 'food', 'park', 'hidden-gem', 'viewpoint'] as const;
export const hiddennessLabels = ['Touristy', 'Balanced', 'Hidden'] as const;
export const discoveryHiddennessFilters = ['touristy', 'balanced', 'hidden'] as const;

export type TripBudgetBand = (typeof tripBudgetBands)[number];
export type TripInterest = (typeof tripInterests)[number];
export type TripPace = (typeof tripPaces)[number];
export type HiddenGemPreference = (typeof hiddenGemPreferences)[number];
export type PlaceCategory = (typeof placeCategories)[number];
export type HiddennessLabel = (typeof hiddennessLabels)[number];
export type DiscoveryHiddennessFilter = (typeof discoveryHiddennessFilters)[number];

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const tripPreferencesSchema = z.object({
  budget: z.enum(tripBudgetBands),
  hiddenGemPreference: z.enum(hiddenGemPreferences),
  interests: z.array(z.enum(tripInterests)).min(1),
  pace: z.enum(tripPaces),
});

export const createTripInputSchema = z.object({
  citySlug: z.string().min(1),
  endDate: dateStringSchema,
  partySize: z.number().int().min(1),
  preferences: tripPreferencesSchema,
  startDate: dateStringSchema,
});

export const tripSchema = createTripInputSchema.extend({
  id: z.string().min(1),
  status: z.literal('draft'),
});

export const placeSchema = z.object({
  category: z.enum(placeCategories),
  citySlug: z.string().min(1),
  costLevel: z.number().int().min(1).max(3),
  hiddennessLabel: z.enum(hiddennessLabels),
  hiddennessScore: z.number().min(0).max(1),
  id: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  name: z.string().min(1),
  neighborhoodName: z.string().min(1).optional(),
  neighborhoodSlug: z.string().min(1).optional(),
  popularityScore: z.number().min(0).max(1),
  summary: z.string().min(1),
  tags: z.array(z.string()),
  visitDurationMinutes: z.number().int().positive(),
});

export const dayStopSchema = z.object({
  estimatedCost: z.number().nonnegative(),
  placeId: z.string().min(1),
  placeName: z.string().min(1),
  sequence: z.number().int().positive(),
  travelMinutesFromPrevious: z.number().int().nonnegative(),
  visitDurationMinutes: z.number().int().positive(),
});

export const dayPlanSchema = z.object({
  date: dateStringSchema,
  dayIndex: z.number().int().positive(),
  estimatedCost: z.number().nonnegative(),
  estimatedTravelMinutes: z.number().int().nonnegative(),
  stops: z.array(dayStopSchema),
});

export const itinerarySchema = z.object({
  dayPlans: z.array(dayPlanSchema),
  generatedAt: z.string().min(1),
  tripId: z.string().min(1),
});

export const discoveryCitySchema = z.object({
  countryCode: z.string().min(2),
  name: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  timezone: z.string().min(1),
});

export const discoveryNeighborhoodSchema = z.object({
  budgetScore: z.number().int().min(1).max(5),
  citySlug: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  strengthTags: z.array(z.string()).min(1),
  summary: z.string().min(1),
  walkabilityScore: z.number().int().min(1).max(5),
});

export const cityParamsSchema = z.object({
  citySlug: z.string().min(1),
});

export const cityPlacesQuerySchema = z.object({
  budget: z.enum(tripBudgetBands).optional(),
  category: z.enum(placeCategories).optional(),
  hiddenness: z.enum(discoveryHiddennessFilters).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const cityOverviewSchema = z.object({
  city: discoveryCitySchema,
  hiddenGemCount: z.number().int().nonnegative(),
  neighborhoods: z.array(
    z.object({
      budgetScore: z.number().int().min(1).max(5),
      name: z.string().min(1),
      slug: z.string().min(1),
      strengths: z.array(z.string()).min(1),
      summary: z.string().min(1),
      walkabilityScore: z.number().int().min(1).max(5),
    }),
  ),
});

export const cityPlacesResponseSchema = z.object({
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().nonnegative(),
  }),
  places: z.array(placeSchema),
});

export type TripPreferences = z.infer<typeof tripPreferencesSchema>;
export type CreateTripInput = z.infer<typeof createTripInputSchema>;
export type Trip = z.infer<typeof tripSchema>;
export type Place = z.infer<typeof placeSchema>;
export type DayStop = z.infer<typeof dayStopSchema>;
export type DayPlan = z.infer<typeof dayPlanSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;
export type DiscoveryCity = z.infer<typeof discoveryCitySchema>;
export type DiscoveryNeighborhood = z.infer<typeof discoveryNeighborhoodSchema>;
export type CityPlacesQuery = z.infer<typeof cityPlacesQuerySchema>;
export type CityOverview = z.infer<typeof cityOverviewSchema>;

export type BootstrappedTripDraft = CreateTripInput & {
  budget: TripBudgetBand;
  interests: TripInterest[];
};

export function createTripDraft(citySlug: string): BootstrappedTripDraft {
  return {
    budget: 'medium',
    citySlug,
    endDate: '2026-10-04',
    interests: ['food', 'culture'],
    partySize: 2,
    preferences: {
      budget: 'medium',
      hiddenGemPreference: 'mixed',
      interests: ['food', 'culture'],
      pace: 'balanced',
    },
    startDate: '2026-10-01',
  };
}

const discoveryCities: DiscoveryCity[] = [
  {
    countryCode: 'JP',
    name: 'Tokyo',
    slug: 'tokyo',
    summary: 'A city of dense neighborhoods, exceptional food, and layered tourist-versus-local tradeoffs.',
    timezone: 'Asia/Tokyo',
  },
];

const discoveryNeighborhoods: DiscoveryNeighborhood[] = [
  {
    budgetScore: 3,
    citySlug: 'tokyo',
    name: 'Shibuya',
    slug: 'shibuya',
    strengthTags: ['nightlife', 'food', 'shopping'],
    summary: 'Fast-moving, high-energy, and ideal for first-time city texture.',
    walkabilityScore: 5,
  },
  {
    budgetScore: 4,
    citySlug: 'tokyo',
    name: 'Meguro',
    slug: 'meguro',
    strengthTags: ['cafes', 'local', 'riverside'],
    summary: 'More local, calmer, and strong for coffee, strolling, and hidden corners.',
    walkabilityScore: 4,
  },
  {
    budgetScore: 3,
    citySlug: 'tokyo',
    name: 'Shinjuku',
    slug: 'shinjuku',
    strengthTags: ['parks', 'ramen', 'late-night'],
    summary: 'Dense, varied, and practical for mixing gardens, food, and evening plans.',
    walkabilityScore: 4,
  },
  {
    budgetScore: 2,
    citySlug: 'tokyo',
    name: 'Asakusa',
    slug: 'asakusa',
    strengthTags: ['heritage', 'landmarks', 'street-food'],
    summary: 'Historic texture with iconic sights and easy cultural orientation.',
    walkabilityScore: 4,
  },
];

const discoveryPlaces: Place[] = [
  {
    category: 'landmark',
    citySlug: 'tokyo',
    costLevel: 1,
    hiddennessLabel: 'Hidden',
    hiddennessScore: 0.72,
    id: 'tokyo-meiji-jingu',
    lat: 35.6764,
    lng: 139.6993,
    name: 'Meiji Jingu Shrine',
    neighborhoodName: 'Shibuya',
    neighborhoodSlug: 'shibuya',
    popularityScore: 0.83,
    summary: 'Serene Shinto shrine surrounded by tall trees. A spiritual start to the day.',
    tags: ['culture', 'nature', 'shrine'],
    visitDurationMinutes: 90,
  },
  {
    category: 'food',
    citySlug: 'tokyo',
    costLevel: 1,
    hiddennessLabel: 'Balanced',
    hiddennessScore: 0.46,
    id: 'tokyo-onibus',
    lat: 35.6443,
    lng: 139.6985,
    name: 'ONIBUS Coffee Nakameguro',
    neighborhoodName: 'Meguro',
    neighborhoodSlug: 'meguro',
    popularityScore: 0.7,
    summary: 'Small-batch coffee in a cozy riverside spot.',
    tags: ['coffee', 'local', 'food'],
    visitDurationMinutes: 45,
  },
  {
    category: 'food',
    citySlug: 'tokyo',
    costLevel: 2,
    hiddennessLabel: 'Balanced',
    hiddennessScore: 0.31,
    id: 'tokyo-menya-musashi',
    lat: 35.6938,
    lng: 139.7004,
    name: 'Menya Musashi Shinjuku',
    neighborhoodName: 'Shinjuku',
    neighborhoodSlug: 'shinjuku',
    popularityScore: 0.84,
    summary: 'Legendary ramen spot since 1996.',
    tags: ['ramen', 'food', 'iconic'],
    visitDurationMinutes: 60,
  },
  {
    category: 'viewpoint',
    citySlug: 'tokyo',
    costLevel: 1,
    hiddennessLabel: 'Hidden',
    hiddennessScore: 0.68,
    id: 'tokyo-21-design-sight',
    lat: 35.6654,
    lng: 139.7308,
    name: '21_21 DESIGN SIGHT',
    neighborhoodName: 'Shibuya',
    neighborhoodSlug: 'shibuya',
    popularityScore: 0.63,
    summary: 'Design museum by Tadao Ando.',
    tags: ['design', 'museum', 'culture'],
    visitDurationMinutes: 75,
  },
  {
    category: 'food',
    citySlug: 'tokyo',
    costLevel: 2,
    hiddennessLabel: 'Balanced',
    hiddennessScore: 0.4,
    id: 'tokyo-omoide-yokocho',
    lat: 35.6927,
    lng: 139.6995,
    name: 'Omoide Yokocho',
    neighborhoodName: 'Shinjuku',
    neighborhoodSlug: 'shinjuku',
    popularityScore: 0.89,
    summary: 'Nostalgic alley with tiny yakitori stalls.',
    tags: ['food', 'nightlife', 'yakitori'],
    visitDurationMinutes: 90,
  },
  {
    category: 'park',
    citySlug: 'tokyo',
    costLevel: 1,
    hiddennessLabel: 'Hidden',
    hiddennessScore: 0.66,
    id: 'tokyo-shinjuku-gyoen',
    lat: 35.6852,
    lng: 139.7101,
    name: 'Shinjuku Gyoen National Garden',
    neighborhoodName: 'Shinjuku',
    neighborhoodSlug: 'shinjuku',
    popularityScore: 0.79,
    summary: 'Beautiful garden with seasonal blooms.',
    tags: ['nature', 'garden', 'hidden-gem'],
    visitDurationMinutes: 90,
  },
  {
    category: 'food',
    citySlug: 'tokyo',
    costLevel: 1,
    hiddennessLabel: 'Hidden',
    hiddennessScore: 0.62,
    id: 'tokyo-bakery-sasaki',
    lat: 35.643,
    lng: 139.6998,
    name: 'Bakery Sasaki',
    neighborhoodName: 'Meguro',
    neighborhoodSlug: 'meguro',
    popularityScore: 0.58,
    summary: 'Quiet bakery with standout shokupan and a neighborhood feel.',
    tags: ['bakery', 'food', 'local'],
    visitDurationMinutes: 35,
  },
  {
    category: 'landmark',
    citySlug: 'tokyo',
    costLevel: 1,
    hiddennessLabel: 'Touristy',
    hiddennessScore: 0.2,
    id: 'tokyo-sensoji',
    lat: 35.7148,
    lng: 139.7967,
    name: 'Senso-ji',
    neighborhoodName: 'Asakusa',
    neighborhoodSlug: 'asakusa',
    popularityScore: 0.98,
    summary: 'Iconic Buddhist temple with a classic first-time-Tokyo feel.',
    tags: ['landmark', 'culture', 'street-food'],
    visitDurationMinutes: 120,
  },
];

export function getCityDiscoveryView(citySlug: string): {
  city: DiscoveryCity;
  neighborhoods: DiscoveryNeighborhood[];
  places: Place[];
} | null {
  const city = discoveryCities.find((candidate) => candidate.slug === citySlug);

  if (!city) {
    return null;
  }

  return {
    city,
    neighborhoods: discoveryNeighborhoods.filter((candidate) => candidate.citySlug === citySlug),
    places: discoveryPlaces.filter((candidate) => candidate.citySlug === citySlug),
  };
}
