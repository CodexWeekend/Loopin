// Core Types for Loopin

// ============ User & Auth ============
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  countryCode?: string
  interests: InterestType[]
  visibility: VisibilitySettings
  createdAt: Date
}

export interface VisibilitySettings {
  showInCityLobby: boolean
  showPlannedPlaces: boolean
  allowMessages: boolean
}

// ============ Trip & Planning ============
export type BudgetLevel = "low" | "mid" | "high"
export type TravelPace = "relaxed" | "balanced" | "packed"
export type HiddenGemPreference = "touristy" | "mixed" | "local"
export type InterestType = 
  | "food" 
  | "culture" 
  | "nightlife" 
  | "nature" 
  | "shopping" 
  | "work-friendly"
  | "art"
  | "history"
  | "photography"

export interface TripPreferences {
  budget: BudgetLevel
  dailyBudget?: number
  pace: TravelPace
  hiddenGemPreference: HiddenGemPreference
  interests: InterestType[]
  dietaryPreferences?: string[]
  mobilityNeeds?: string[]
}

export interface Trip {
  id: string
  destination: City
  startDate: string
  endDate: string
  partySize: number
  preferences: TripPreferences
  days: DayPlan[]
  collaborators: Collaborator[]
  isPublic: boolean
  status: "draft" | "planned" | "active" | "completed"
  createdAt: Date
  updatedAt: Date
}

export interface Collaborator {
  userId: string
  user: User
  role: "owner" | "editor" | "viewer"
  invitedAt: Date
}

// ============ Places & Stops ============
export type PlaceCategory = 
  | "landmark"
  | "museum"
  | "restaurant"
  | "cafe"
  | "bar"
  | "park"
  | "viewpoint"
  | "shopping"
  | "temple"
  | "market"
  | "entertainment"

export type HiddennessLevel = "touristy" | "balanced" | "hidden"

export interface Place {
  id: string
  name: string
  description: string
  longDescription?: string
  image: string
  images?: string[]
  lat: number
  lng: number
  category: PlaceCategory
  tags: string[]
  costLevel: 1 | 2 | 3 | 4
  estimatedCost: number
  typicalDuration: number // in minutes
  hiddenness: HiddennessLevel
  popularityScore: number // 0-100
  hiddenGemScore: number // 0-100
  openHours?: OpenHours
  neighborhood?: string
  address?: string
  mustTryDishes?: string[]
  bestFor?: string[]
  vibes?: string[]
  rating?: number
  reviewCount?: number
}

export interface OpenHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

export interface DayStop {
  id: string
  place: Place
  startTime: string // "09:00"
  endTime: string
  order: number
  notes?: string
  travelFromPrevious?: TravelInfo
  isBookmarked: boolean
}

export interface TravelInfo {
  distance: number // in km
  duration: number // in minutes
  mode: "walk" | "transit" | "taxi"
}

export interface DayPlan {
  id: string
  day: number
  date: string
  stops: DayStop[]
  estimatedCost: number
  notes?: string
}

// ============ City & Discovery ============
export interface City {
  id: string
  name: string
  country: string
  countryCode: string
  image: string
  description: string
  timezone: string
  currency: string
  language: string
  neighborhoods: Neighborhood[]
  highlights: string[]
  bestTimeToVisit?: string
}

export interface Neighborhood {
  id: string
  name: string
  description: string
  image?: string
  bestFor: string[]
  vibes: string[]
  priceLevel: 1 | 2 | 3 | 4
}

// ============ Food Discovery ============
export interface Dish {
  id: string
  name: string
  description: string
  image?: string
  category: "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "drink"
  cuisine: string
  priceRange: string
  isVegetarian?: boolean
  isVegan?: boolean
  bestPlaces: Place[]
}

// ============ Social Features ============
export interface TravelerPresence {
  id: string
  user: User
  cityId: string
  dateRange: {
    start: string
    end: string
  }
  plannedPlaces: string[] // place IDs
  intents: TravelIntent[]
  visibility: "public" | "connections" | "private"
}

export interface TravelIntent {
  id: string
  description: string
  category: "food" | "activity" | "nightlife" | "general"
  date?: string
  maxGroupSize?: number
  createdAt: Date
}

export interface Connection {
  id: string
  users: [string, string]
  status: "pending" | "accepted" | "declined"
  tripContext?: string
  createdAt: Date
}

export interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  tripId?: string
  placeId?: string
  createdAt: Date
  readAt?: Date
}

// ============ Smart Features ============
export interface SwapSuggestion {
  originalPlace: Place
  suggestedPlace: Place
  reason: "cheaper" | "closer" | "more-local" | "better-fit" | "time-saver"
  timeDifference: number // positive = more time, negative = less time
  costDifference: number // positive = more cost, negative = savings
  distanceDifference: number
}

export interface NearMeSuggestion {
  place: Place
  distance: number
  matchScore: number
  reason: string
  estimatedArrival: string
  fitsTimeSlot: boolean
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  filters: Partial<{
    maxDistance: number
    maxDuration: number
    categories: PlaceCategory[]
    weather: "any" | "indoor" | "outdoor"
    timeOfDay: "morning" | "afternoon" | "evening" | "night"
  }>
}

// ============ Offline ============
export interface OfflineTripCard {
  tripId: string
  generatedAt: Date
  days: OfflineDaySummary[]
  emergencyInfo: {
    embassy: string
    emergencyNumber: string
    nearestHospital: string
  }
}

export interface OfflineDaySummary {
  day: number
  date: string
  stops: {
    name: string
    address: string
    lat: number
    lng: number
    time: string
    notes?: string
  }[]
}
