export const tripBudgetBands = ['low', 'medium', 'high'] as const;

export type TripBudgetBand = (typeof tripBudgetBands)[number];

export const tripInterests = [
  'food',
  'culture',
  'nightlife',
  'nature',
  'shopping',
  'work-friendly',
] as const;

export type TripInterest = (typeof tripInterests)[number];

export type BootstrappedTripDraft = {
  budget: TripBudgetBand;
  citySlug: string;
  endDate: string;
  interests: TripInterest[];
  partySize: number;
  startDate: string;
};

export function createTripDraft(citySlug: string): BootstrappedTripDraft {
  return {
    budget: 'medium',
    citySlug,
    endDate: '2026-10-04',
    interests: ['food', 'culture'],
    partySize: 2,
    startDate: '2026-10-01',
  };
}
