import { z } from 'zod';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
}, z.boolean());

export const budgetLevels = ['low', 'mid', 'high'] as const;
export const travelPaces = ['relaxed', 'balanced', 'packed'] as const;
export const hiddenGemPreferences = ['touristy', 'mixed', 'local'] as const;
export const interestTypes = [
  'food',
  'culture',
  'nightlife',
  'nature',
  'shopping',
  'work-friendly',
  'art',
  'history',
  'photography',
] as const;
export const placeCategories = [
  'landmark',
  'museum',
  'restaurant',
  'cafe',
  'bar',
  'park',
  'viewpoint',
  'shopping',
  'temple',
  'market',
  'entertainment',
] as const;
export const tripStatuses = ['draft', 'planned', 'active', 'completed'] as const;
export const intentCategories = ['food', 'activity', 'nightlife', 'general'] as const;
export const connectionStatuses = ['pending', 'accepted', 'declined'] as const;
export const presenceVisibilities = ['public', 'connections', 'private'] as const;

export const tripPreferencesSchema = z.object({
  budget: z.enum(budgetLevels),
  dailyBudget: z.number().positive().optional(),
  dietaryPreferences: z.array(z.string().min(1)).optional(),
  hiddenGemPreference: z.enum(hiddenGemPreferences),
  interests: z.array(z.enum(interestTypes)).min(1),
  mobilityNeeds: z.array(z.string().min(1)).optional(),
  pace: z.enum(travelPaces),
});

export const createTripRequestSchema = z.object({
  cityId: z.string().min(1),
  endDate: dateStringSchema,
  generateItinerary: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(false),
  partySize: z.number().int().min(1).max(20),
  preferences: tripPreferencesSchema,
  startDate: dateStringSchema,
  status: z.enum(tripStatuses).optional().default('draft'),
});

export const updateTripRequestSchema = z
  .object({
    cityId: z.string().min(1).optional(),
    endDate: dateStringSchema.optional(),
    generateItinerary: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    partySize: z.number().int().min(1).max(20).optional(),
    preferences: tripPreferencesSchema.partial().optional(),
    startDate: dateStringSchema.optional(),
    status: z.enum(tripStatuses).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const tripIdParamsSchema = z.object({
  tripId: z.string().min(1),
});

export const stopParamsSchema = z.object({
  stopId: z.string().min(1),
  tripId: z.string().min(1),
});

export const addStopRequestSchema = z
  .object({
    day: z.number().int().min(1).optional(),
    dayId: z.string().min(1).optional(),
    insertAt: z.number().int().min(1).optional(),
    isBookmarked: z.boolean().optional().default(false),
    notes: z.string().max(500).optional(),
    placeId: z.string().min(1),
  })
  .refine((value) => value.dayId || value.day || true);

export const swapStopRequestSchema = z.object({
  placeId: z.string().min(1).optional(),
});

export const discoveryQuerySchema = z.object({
  budget: z.enum(budgetLevels).optional(),
  category: z.enum(placeCategories).optional(),
  cityId: z.string().min(1).optional().default('tokyo'),
  hiddenOnly: booleanQuerySchema.optional().default(false),
  q: z.string().trim().optional(),
});

export const nearbyQuerySchema = z.object({
  category: z.enum(placeCategories).optional(),
  cityId: z.string().min(1).optional().default('tokyo'),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  minutesAvailable: z.coerce.number().int().min(15).optional().default(90),
  quickAction: z.string().min(1).optional(),
  tripId: z.string().min(1).optional(),
});

export const socialQuerySchema = z.object({
  cityId: z.string().min(1).optional().default('tokyo'),
});

export const profileUpdateSchema = z
  .object({
    allowMessages: z.boolean().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    countryCode: z.string().min(2).max(2).nullable().optional(),
    firstName: z.string().min(1).max(50).nullable().optional(),
    interests: z.array(z.enum(interestTypes)).optional(),
    lastName: z.string().min(1).max(50).nullable().optional(),
    showInCityLobby: z.boolean().optional(),
    showPlannedPlaces: z.boolean().optional(),
    travelStyle: z.enum(travelPaces).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one profile field must be provided.',
  });

export const presenceUpdateSchema = z.object({
  cityId: z.string().min(1),
  plannedPlaceIds: z.array(z.string().min(1)).optional().default([]),
  showInCityLobby: z.boolean().optional().default(false),
  showPlannedPlaces: z.boolean().optional().default(false),
  tripId: z.string().min(1).optional(),
  visibility: z.enum(presenceVisibilities).optional(),
  visibleFrom: dateStringSchema.optional(),
  visibleTo: dateStringSchema.optional(),
});

export const createIntentSchema = z.object({
  category: z.enum(intentCategories),
  cityId: z.string().min(1),
  date: dateStringSchema.optional(),
  description: z.string().min(3).max(500),
  maxGroupSize: z.number().int().min(2).max(20).optional(),
  plannedPlaceIds: z.array(z.string().min(1)).optional().default([]),
  tripId: z.string().min(1).optional(),
});

export const createConnectionSchema = z.object({
  targetUserId: z.string().min(1),
  tripId: z.string().min(1).optional(),
});

export const updateConnectionSchema = z.object({
  connectionId: z.string().min(1),
  status: z.enum(connectionStatuses),
});

export const bootstrapQuerySchema = z.object({
  cityId: z.string().min(1).optional(),
});

export type CreateTripRequest = z.infer<typeof createTripRequestSchema>;
export type UpdateTripRequest = z.infer<typeof updateTripRequestSchema>;
export type AddStopRequest = z.infer<typeof addStopRequestSchema>;
export type SwapStopRequest = z.infer<typeof swapStopRequestSchema>;
export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type SocialQuery = z.infer<typeof socialQuerySchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PresenceUpdateInput = z.infer<typeof presenceUpdateSchema>;
export type CreateIntentInput = z.infer<typeof createIntentSchema>;
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;
