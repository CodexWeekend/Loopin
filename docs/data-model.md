# Data Model

## Modeling Principles

- Keep core trip and place concepts stable across web, mobile, and API
- Separate persistent entities from derived view models
- Model privacy and visibility rules explicitly
- Prefer narrow, composable value objects over giant flat records

## Core Entities

| Entity | What it represents | Key fields | Relationships |
| --- | --- | --- | --- |
| `User` | A person using Loopin | `id`, `email`, `displayName`, `homeCountry`, `avatarUrl`, `privacyDefaults` | Owns trips, presences, matches, messages |
| `Trip` | A single travel plan | `id`, `ownerId`, `cityId`, `startDate`, `endDate`, `partySize`, `status` | Has one `TripPreferences`, many `DayPlan`, many collaborators |
| `TripPreferences` | User constraints and taste for a trip | `budget`, `interests`, `pace`, `hiddenGemPreference`, `dietaryPreferences`, `mobilityConstraints` | Belongs to one `Trip` |
| `DayPlan` | A planned day inside a trip | `id`, `tripId`, `dayIndex`, `theme`, `estimatedCost`, `estimatedTravelMinutes` | Has many `DayStop` |
| `DayStop` | One itinerary stop | `id`, `dayPlanId`, `placeId`, `sequence`, `visitStart`, `visitDurationMinutes`, `travelModeFromPrevious` | Belongs to one `DayPlan`, references one `Place` |
| `Place` | A specific venue, landmark, park, or hidden gem | `id`, `cityId`, `neighborhoodId`, `name`, `type`, `lat`, `lng`, `costLevel`, `visitDurationMinutes`, `popularityScore`, `hiddennessScore` | Belongs to one `City`, optionally one `Neighborhood` |
| `City` | A supported destination city | `id`, `slug`, `name`, `countryCode`, `timezone`, `summary` | Has many `Neighborhood`, `Place`, and `Trip` |
| `Neighborhood` | A local area within a city | `id`, `cityId`, `name`, `summary`, `strengthTags`, `walkabilityScore`, `budgetScore` | Belongs to one `City`, has many `Place` |
| `SavedPlace` | A place a user or trip wants to keep for later | `id`, `tripId`, `placeId`, `savedByUserId`, `source` | Belongs to one `Trip`, references one `Place` |
| `TripInvite` | A collaboration invite for a trip | `id`, `tripId`, `inviterUserId`, `inviteeUserId`, `role`, `status` | Belongs to one `Trip` |
| `TripComment` | A comment or suggestion attached to a trip or day | `id`, `tripId`, `dayPlanId`, `authorUserId`, `body`, `status` | Belongs to one `Trip`, optionally one `DayPlan` |
| `UserPresence` | A user's opt-in visibility for a trip and city | `id`, `userId`, `tripId`, `cityId`, `visibleFrom`, `visibleTo`, `shareCityPresence`, `sharePlacePresence` | Belongs to one `User` and one `Trip` |
| `PlaceIntent` | A lightweight public or semi-public intent | `id`, `userId`, `tripId`, `placeId`, `title`, `scheduledAt`, `visibility` | References a `Place` and `Trip` |
| `MatchRequest` | A request to connect around a trip or activity | `id`, `fromUserId`, `toUserId`, `tripId`, `placeIntentId`, `status` | Connects users in a trip context |
| `Conversation` | A chat thread for a match or trip | `id`, `tripId`, `type`, `createdByUserId` | Has many `Message`, many participants |
| `Message` | A chat message | `id`, `conversationId`, `authorUserId`, `body`, `sentAt` | Belongs to one `Conversation` |

## Key Value Objects

### `BudgetPreference`

Represents a trip budget as either:

- a coarse band such as `low`, `medium`, `high`
- or a numeric daily budget with currency

### `InterestProfile`

Represents user interests such as:

- food
- culture
- nightlife
- nature
- shopping
- work-friendly

### `HiddenGemPreference`

Represents the desired balance between famous attractions and lesser-known places:

- `touristy`
- `mixed`
- `mostly-local`

### `PlaceHiddennessLabel`

The user-facing classification for place discovery:

- `Touristy`
- `Balanced`
- `Hidden`

### `LocationPoint`

A normalized coordinate pair plus optional display metadata:

- `lat`
- `lng`
- optional `geohash`
- optional `address`

## Relationship Notes

- A `Trip` belongs to one owner but can have many collaborators.
- A `Trip` has one `TripPreferences` snapshot that should be versionable as needs evolve.
- A `DayPlan` is ordered by `dayIndex`, and each `DayStop` is ordered by `sequence`.
- `Place` and `Neighborhood` records should be reusable across trips.
- Presence and social data are contextual to trips and dates, not global by default.

## Derived Views

These are not primary entities, but they are important API response shapes:

- `TripSummaryView`
- `ItineraryView`
- `NearbySuggestionView`
- `CityLobbyView`
- `PlacePresenceView`
- `OfflineTripCardView`

Keep derived views in shared schemas rather than mixing them into persistent entities.

## Privacy-Sensitive Data

Treat these fields as sensitive:

- exact travel dates
- precise location sharing state
- private notes
- chat messages
- collaborator and invite relationships

Default behavior must preserve privacy unless the user opts in at the trip level.
