# API Guidelines

## Goals

- Keep contracts explicit and shared across web, mobile, and backend
- Use predictable naming and versioning
- Validate every request and normalize every response
- Keep auth and privacy rules consistent across routes

## API Style

Default style:

- HTTP JSON
- versioned under `/api/v1`
- resource-oriented route names
- shared runtime schemas in `packages/shared`

Examples:

- `POST /api/v1/trips`
- `GET /api/v1/trips/:tripId`
- `POST /api/v1/trips/:tripId/itinerary/generate`
- `POST /api/v1/trips/:tripId/stops/:stopId/swap`
- `GET /api/v1/cities/:citySlug/places`
- `GET /api/v1/cities/:citySlug/lobby`

## Naming Rules

- Use nouns for primary resources: `trips`, `cities`, `places`, `presence`
- Use verb-like subpaths only for explicit actions: `generate`, `swap`, `join`
- Use kebab-case for multiword static path segments
- Keep request and response DTO names aligned with route intent

## Versioning

- Start with `/api/v1`
- Only introduce `/api/v2` for breaking contract changes
- Prefer additive changes inside a version when safe
- Deprecate old fields with explicit documentation before removal

## Request Validation

- Validate every request at the API boundary
- Reject malformed input before touching domain services
- Use shared schemas for:
  - path params
  - query params
  - request bodies
  - response DTOs

Do not accept untyped or loosely validated provider payloads directly into domain logic.

## Authentication And Authorization

- All write routes require authentication
- Read routes for public or share-link content may allow anonymous access with explicit scope
- Authorization must check:
  - trip ownership or collaboration rights
  - visibility state for social and presence data
  - scope of shared links

Privacy-sensitive endpoints must default to the narrowest possible response.

## Error Handling

Use a stable JSON error shape:

```json
{
  "error": {
    "code": "trip_not_found",
    "message": "Trip not found.",
    "details": {
      "tripId": "trip_123"
    },
    "requestId": "req_abc123"
  }
}
```

Rules:

- `code` is machine-readable and stable
- `message` is human-readable and safe to show in logs or UIs
- `details` is optional and should never leak secrets
- `requestId` should be included when observability tooling exists

Suggested HTTP mapping:

- `400` invalid input
- `401` unauthenticated
- `403` unauthorized
- `404` missing resource
- `409` conflict
- `422` semantically invalid state
- `429` rate limited
- `500` internal failure
- `502` or `503` upstream dependency issues

## Idempotency And Async Work

- Use idempotency keys for expensive or duplicate-prone write actions where retries are likely
- Consider async orchestration for long-running discovery or generation tasks
- If generation becomes async, return a job resource rather than blocking indefinitely

## Endpoint Examples

### Create trip

`POST /api/v1/trips`

Request:

```json
{
  "citySlug": "tokyo",
  "startDate": "2026-10-02",
  "endDate": "2026-10-06",
  "partySize": 2,
  "preferences": {
    "budget": "medium",
    "interests": ["food", "culture"],
    "pace": "balanced",
    "hiddenGemPreference": "mixed"
  }
}
```

Response:

```json
{
  "trip": {
    "id": "trip_123",
    "citySlug": "tokyo",
    "status": "draft"
  }
}
```

### Generate itinerary

`POST /api/v1/trips/:tripId/itinerary/generate`

Behavior:

- validates trip ownership
- loads candidate places
- generates a first-pass set of day plans
- returns normalized day plans plus summary metadata

### Search or filter places

`GET /api/v1/cities/:citySlug/places?type=food&hiddenness=hidden&budget=low`

Behavior:

- supports filters without leaking provider-specific query details
- returns normalized place summaries and paging metadata

### Update trip presence

`PUT /api/v1/trips/:tripId/presence`

Behavior:

- toggles city and place visibility
- stores date-bounded visibility state
- returns the effective visibility settings

### View city lobby

`GET /api/v1/cities/:citySlug/lobby?from=2026-10-02&to=2026-10-06`

Behavior:

- returns only opted-in travelers
- exposes minimal profile and activity context
- hides precise details not allowed by privacy settings

## DTO Hygiene

- Keep storage models separate from transport DTOs
- Favor explicit summary DTOs for lists and richer DTOs for details
- Avoid leaking nullable provider-specific noise into public API contracts

## Documentation Rule

When you add or change an endpoint, update:

- the shared schemas
- the consuming clients
- this guideline doc if the change affects repo-wide conventions
