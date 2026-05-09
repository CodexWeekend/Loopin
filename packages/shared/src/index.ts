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

export type TripBudgetBand = (typeof tripBudgetBands)[number];
export type TripInterest = (typeof tripInterests)[number];
export type TripPace = (typeof tripPaces)[number];
export type HiddenGemPreference = (typeof hiddenGemPreferences)[number];
export type PlaceCategory = (typeof placeCategories)[number];
export type HiddennessLabel = (typeof hiddennessLabels)[number];

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
  popularityScore: z.number().min(0).max(1),
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

export type TripPreferences = z.infer<typeof tripPreferencesSchema>;
export type CreateTripInput = z.infer<typeof createTripInputSchema>;
export type Trip = z.infer<typeof tripSchema>;
export type Place = z.infer<typeof placeSchema>;
export type DayStop = z.infer<typeof dayStopSchema>;
export type DayPlan = z.infer<typeof dayPlanSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;

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
