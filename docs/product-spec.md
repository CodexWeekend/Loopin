# Loopin Product Specification

## Purpose Of This Document

This file is the canonical, repo-owned version of the original Loopin product brief. It exists so the project does not depend on chat history or a machine-local prompt file.

## Product Identity

- Name: Loopin
- Meaning:
  - "Loop someone in" means include them in a plan or conversation.
  - "Loop" also evokes routes, walkable city areas, and exploring nearby places.
  - The dropped "g" gives the product a modern, compact brand shape.
- One-sentence vision:
  - Loopin helps travelers plan smart city trips optimized for distance, cost, and vibe while discovering hidden gems and optionally looping other people into the plan.

## Product Promise

Loopin should help users:

- Plan a trip quickly from a few clear inputs
- Discover neighborhoods and places beyond generic tourist lists
- Build day plans that respect time, money, and distance
- Adapt during the trip when weather, energy, or timing changes
- Optionally share plans and connect with other travelers in a safe, consent-based way

## Core Feature Areas

### 1. Trip creation and personalization

Users can create trips with:

- destination city
- start and end dates
- number of people
- budget
- interests such as food, culture, nightlife, nature, shopping, and work-friendly spots
- travel pace: relaxed, balanced, or packed
- hidden-gem preference: touristy, mixed, or mostly local

Model this as a `Trip` aggregate with a nested `TripPreferences` object.

### 2. Smart city discovery and hidden gems

For each city, Loopin should surface:

- neighborhood overviews such as best for food, nightlife, scenery, or budget
- place categories:
  - must-see landmarks
  - food and cafes
  - viewpoints and parks
  - hidden gems

Each `Place` should include:

- name, city, neighborhood, coordinates
- type and tags
- approximate cost level
- typical visit duration
- popularity score
- hiddenness score
- user-facing label: `Touristy`, `Balanced`, or `Hidden`

### 3. Distance-aware and cost-aware itinerary building

Loopin should generate day-by-day itineraries that:

- cluster nearby places to reduce zigzagging
- estimate travel time between stops
- estimate total daily spend
- support automatic first-pass generation plus manual edits

The itinerary builder must support a `Smart swap` action that can replace a stop with a nearby alternative based on:

- cheaper option
- more local or more touristy option
- closer option
- slightly farther but more interesting option

### 4. Food-centric discovery

Loopin needs a dedicated food flow for questions like "What should I eat here?"

That flow should support:

- must-try dishes by city
- breakfast, lunch, dinner, and late-night suggestions
- price, cuisine, diet, and vibe filters
- integration with itinerary generation and near-me suggestions

### 5. In-trip mode

Mobile-first in-trip support should include:

- a `Now` tab
- nearby suggestions ranked by fit, distance, hiddenness, and available time
- quick actions such as:
  - fill 1 free hour
  - rainy day ideas
  - late-night within a chosen radius
- current day timeline with travel times
- one-tap skip that triggers smart swap

### 6. Social and matching

The social layer is opt-in.

Requirements:

- users are private by default
- visibility is controlled per trip
- users can choose to show:
  - that they are in a city during specific dates
  - that they plan to visit specific places
- city lobbies should show visible travelers with lightweight profiles
- users can post simple intents such as joining a food crawl or museum visit
- place-level presence can show aggregate counts for opted-in travelers
- connection features can include:
  - connection request
  - activity-focused chat
  - per-trip group chat for invited friends

### 7. Collaboration and sharing

Loopin should support:

- shareable read-only trip links
- invited multi-editor trip collaboration
- comments or proposals on trip days
- voting on saved places

### 8. Offline trip card

The product should support an offline-friendly trip artifact with:

- per-day summaries
- addresses and notes
- coordinates
- map snapshot or text fallback

The mobile experience should cache this locally.

## Product Surfaces

### Web

- public marketing site
- authenticated trip planner
- planning-heavy flows such as trip creation, review, and collaboration

### Mobile

- in-trip mode
- near-me exploration
- notifications and social presence
- cached access to itinerary information

### API and services

- trip lifecycle
- itinerary generation
- discovery and place search
- recommendation and smart swap
- presence, matching, and chat support

## Target Technical Direction

Assume this stack unless a human explicitly changes it:

- Monorepo
- TypeScript-first
- `pnpm` package manager
- Web: Next.js App Router + React + Tailwind CSS
- Mobile: React Native + Expo
- API: Node.js + TypeScript with a modular backend
- Database: PostgreSQL + PostGIS
- Cache and rate limiting: Redis
- Mapping: Mapbox behind an internal abstraction
- AI and discovery: OpenAI, Exa, and optional workflow orchestration
- Visual generation: Fal for city and trip visuals

## Planned Repository Shape

The intended layout is:

- `apps/web`
- `apps/mobile`
- `apps/api`
- `packages/core`
- `packages/geo`
- `packages/shared`
- `packages/design-system`
- `docs/`

Shared product facts, API contracts, and design rules should live in repo-owned docs and packages, not hidden in agent prompts.

## Service Boundaries

Loopin should eventually expose these core domain services:

- `TripPlanningService`
- `DiscoveryService`
- `RecommendationService`
- `SocialService`

Each service should have clear inputs, outputs, and test coverage. AI assistance is allowed inside services, but the surrounding contract should be deterministic and observable.

## Quality And Operations Expectations

- Build a real product structure, not a one-off prototype
- Keep architecture layered and modular
- Prefer shared schemas and typed clients over duplicated request shapes
- Add tests for planning logic, recommendation ranking, social visibility, and key API flows
- Keep the repo self-describing for future contributors and agents
