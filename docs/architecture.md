# Architecture

## Current State

This document describes the target architecture for Loopin. The repository is still in a bootstrap phase, so most of the code structure below is planned rather than already present.

## Architecture Goals

- Keep product logic portable across web, mobile, and backend
- Separate domain logic from infrastructure and UI
- Make place, route, and recommendation logic easy to test in isolation
- Keep integrations with AI, maps, and external discovery providers behind explicit adapters
- Let new contributors answer "where should this code go?" quickly

## Planned Monorepo Layout

```text
apps/
  web/                 Next.js marketing + planner UI
  mobile/              Expo app for in-trip and social flows
  api/                 HTTP API and service orchestration
packages/
  core/                Domain entities and business services
  geo/                 Distance, clustering, routing helpers
  shared/              DTOs, schemas, API contracts, utility types
  design-system/       Shared tokens and reusable UI primitives
docs/                  Product, architecture, UX, and workflow docs
```

## Backend Layering

The backend should use a layered architecture:

1. Interface layer
   - HTTP routes, request parsing, auth hooks, response mapping
2. Application and domain layer
   - use-case orchestration
   - entities, value objects, policies, ranking logic
3. Infrastructure layer
   - database repositories
   - cache adapters
   - external providers such as OpenAI, Exa, Fal, and maps

Rules:

- UI must not import infrastructure code directly.
- Interface handlers must stay thin and delegate to services.
- Domain services should depend on interfaces, not concrete SDK clients.
- Cross-surface contracts should live in `packages/shared`.

## Planned Domain Services

### TripPlanningService

Responsibilities:

- take a trip, preferences, and candidate places
- cluster nearby places
- estimate travel and visit time
- produce day plans and stop order
- support itinerary regeneration and smart swap suggestions

Inputs:

- `Trip`
- `TripPreferences`
- candidate `Place[]`
- planning options such as timebox and daily budget

Outputs:

- `DayPlan[]`
- swap suggestions
- plan metadata such as estimated daily cost and total distance

### DiscoveryService

Responsibilities:

- fetch city and place context from trusted internal or external sources
- normalize raw results into `City`, `Neighborhood`, and `Place` records
- compute popularity and hiddenness labels
- cache expensive discovery results

### RecommendationService

Responsibilities:

- rank nearby or city-wide suggestions
- power "near me now", rainy-day, and short-gap recommendations
- account for interest match, distance, open status, hiddenness, and cost fit

### SocialService

Responsibilities:

- manage trip visibility and presence rules
- support city lobbies and place-level aggregate presence
- support connection requests, trip chat, and group activity coordination

## Data Flow

The common happy-path flow should look like this:

1. User creates or edits trip preferences in web or mobile UI.
2. UI sends typed request DTOs to the API.
3. API validates inputs with shared schemas.
4. Domain services fetch stored trip data and candidate places.
5. Discovery and recommendation helpers enrich or rank the results.
6. Planning service generates or updates day plans.
7. API persists results and returns normalized response DTOs.
8. Web and mobile render the same typed shapes with surface-specific UI.

For external enrichment:

1. Discovery service queries providers such as Exa or curated data sources.
2. Infrastructure adapters normalize raw provider data.
3. Normalized data is scored and cached.
4. Domain records are stored or returned to consumers.

## Geospatial Strategy

- PostGIS is the system of record for location-aware queries.
- `packages/geo` should contain reusable distance, clustering, and route-estimation utilities.
- Keep vendor map rendering separate from geospatial business logic.
- UI map components should consume neutral view models, not raw provider response shapes.

## API Style Default

The default backend shape is:

- HTTP JSON API
- versioned routes under `/api/v1`
- Zod-like runtime validation shared from `packages/shared`
- typed clients generated or hand-authored from shared schemas

If the team later chooses a different transport style, preserve the same domain boundaries and shared contract discipline.

## Where New Code Should Go

- New domain entity or business rule: `packages/core`
- New distance or routing helper: `packages/geo`
- New request or response schema: `packages/shared`
- New reusable UI primitive or token: `packages/design-system`
- New web page or planner screen: `apps/web`
- New mobile screen or in-trip flow: `apps/mobile`
- New endpoint, auth hook, or orchestration route: `apps/api`
- New architecture, workflow, or scope rule: `docs/`

## Cross-Cutting Concerns

### Privacy

- Social visibility is opt-in and scoped per trip
- Presence views should expose aggregates by default, not exact identities unless the user opted in
- Chat and visibility changes need explicit auditability

### Reliability

- Cache provider responses where it improves latency or cost
- Keep AI-generated suggestions explainable enough for user trust
- Prefer deterministic fallbacks when AI responses are unavailable or low confidence

### Observability

- Add structured logs around plan generation, discovery fetches, and recommendation ranking
- Record provider latency, cache hit rate, and itinerary generation failures

## Architecture Guardrails

- Do not leak provider-specific SDK types into domain entities or UI props
- Do not hide important product rules only in prompts or wrappers
- Do not let the mobile and web apps drift onto separate data contracts
- Do not add a second source of truth for product scope or current status outside the canonical docs
