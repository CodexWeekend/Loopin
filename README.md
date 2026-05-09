# Loopin

Loopin is a travel planning and social coordination product for people who want smarter city itineraries, better local discovery, and optional ways to loop other travelers or friends into the plan.

This repository is currently in a documentation-first bootstrap phase. The repo now contains the product brief, architecture direction, agent instructions, roadmap, and handoff status needed for humans or coding agents to continue the project without chat history or access to a machine-local prompt file.

## What Exists Today

- Canonical product and architecture docs in [`docs/`](docs/)
- A real `dev` integration branch plus feature-branch workflow
- Monorepo scaffolding in `apps/` and `packages/`
- Baseline shell scripts: [`init.sh`](init.sh), [`sync-dev.sh`](sync-dev.sh), [`test-all.sh`](test-all.sh)
- Baseline CI in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- Shared trip contracts, naive itinerary logic, and the first API slice for create/get/generate trip flows
- Shared discovery catalog and API discovery routes for city overview and filtered places
- Shared/API nearby recommendation foundation for city-scoped near-me suggestions
- A real Next.js planner shell in `apps/web` for the first trip-to-itinerary experience
- A real Expo trip shell in `apps/mobile` for the same naive trip-to-itinerary experience
- Agent onboarding and workflow rules in [`AGENTS.md`](AGENTS.md)
- Thin compatibility wrappers for Claude and Gemini in [`CLAUDE.md`](CLAUDE.md) and [`GEMINI.md`](GEMINI.md)
- A current-state ledger in [`docs/implementation-status.md`](docs/implementation-status.md)
- A lightweight decision log in [`docs/decision-log.md`](docs/decision-log.md)
- A placeholder environment contract in [`.env.example`](.env.example)

## What Does Not Exist Yet

- No real product runtime yet
- No advanced in-trip mobile experience yet
- No persistent storage yet
- No dedicated near-me UI flow, social layer, or persistent storage yet

Treat those gaps as known bootstrap work, not missing context.

## Agent Onboarding Order

If you are a new contributor or coding agent, read these files in order:

1. [`README.md`](README.md)
2. [`AGENTS.md`](AGENTS.md)
3. [`docs/implementation-status.md`](docs/implementation-status.md)
4. [`docs/product-spec.md`](docs/product-spec.md)
5. [`docs/roadmap.md`](docs/roadmap.md)
6. The task-specific docs you need:
   - Backend/domain work: [`docs/architecture.md`](docs/architecture.md), [`docs/data-model.md`](docs/data-model.md)
   - API work: [`docs/api-guidelines.md`](docs/api-guidelines.md)
   - UI work: [`docs/design-system.md`](docs/design-system.md), [`docs/ux-principles.md`](docs/ux-principles.md)

## Documentation Map

- [`docs/product-spec.md`](docs/product-spec.md): Canonical product scope and feature brief
- [`docs/architecture.md`](docs/architecture.md): Planned monorepo and service architecture
- [`docs/data-model.md`](docs/data-model.md): Core entities, relationships, and domain language
- [`docs/api-guidelines.md`](docs/api-guidelines.md): API conventions, error shape, auth, and examples
- [`docs/design-system.md`](docs/design-system.md): Design tokens, component rules, and cross-platform UI direction
- [`docs/ux-principles.md`](docs/ux-principles.md): Product UX goals and flow guidance
- [`docs/roadmap.md`](docs/roadmap.md): Milestones, sequencing, and definition of done
- [`docs/implementation-status.md`](docs/implementation-status.md): What is done, why, and what comes next
- [`docs/decision-log.md`](docs/decision-log.md): Defaults future agents should not silently reverse

## Quickstart Intent

This repository now has a working scaffold and baseline verification workflow, but it does not yet ship the Loopin product flows.

The standardized command contract for the future repo is:

- `./init.sh` for dependency installation and first-run checks
- `./sync-dev.sh` for syncing `dev` from `main`
- `./test-all.sh` for lint, typecheck, and test verification

Those scripts are planned but not implemented yet. Until they exist, do not invent contradictory one-off commands and then treat them as project standards. If you add the scripts, also update the docs and the implementation status ledger in the same change.

Portability default:

- The canonical command names remain `./init.sh`, `./sync-dev.sh`, and `./test-all.sh`.
- On Windows, assume Git Bash or WSL until equivalent repo-native wrappers exist.
- If you add Windows wrappers such as `.ps1` files, they must mirror the same underlying workflow rather than define a second standard.

## Planned Architecture At A Glance

Loopin is intended to become a TypeScript-first monorepo with:

- `apps/web` for the Next.js web experience
- `apps/mobile` for the Expo mobile experience
- `apps/api` for the backend service
- `packages/core` for domain services such as trip planning and social logic
- `packages/geo` for routing, clustering, and distance utilities
- `packages/shared` for schemas, DTOs, and shared types
- `packages/design-system` for shared design tokens and primitives

The target backend is a layered architecture: interface -> application/domain services -> infrastructure adapters -> storage/external APIs.

## Current Next Step

The next recommended work is persistent trip storage plus a dedicated near-me user flow on top of the new recommendation foundation.

Use [`docs/roadmap.md`](docs/roadmap.md) and [`docs/implementation-status.md`](docs/implementation-status.md) as the operational source of truth for that work.
