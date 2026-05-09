# Roadmap

## Planning Principles

- Deliver in milestones that leave the repo in a usable state
- Keep each milestone tied to a clear definition of done
- Update docs and status artifacts alongside code

## Milestone 0: Multi-agent bootstrap and repo canon

Goals:

- internalize the product brief into repo docs
- make onboarding deterministic for humans and agents
- define defaults, roadmap, and current state

Outputs:

- canonical docs
- agent wrappers
- status ledger
- decision log
- environment contract

Definition of done:

- repo no longer depends on a machine-local prompt file
- new contributors can determine product scope and next steps from repo files alone
- wrapper files do not contradict canonical docs

## Milestone 1: Monorepo scaffold and engineering baseline

Goals:

- scaffold `apps/` and `packages/`
- add package manager, shared TS config, linting, formatting, and test runners
- create `init.sh`, `sync-dev.sh`, `test-all.sh`
- add CI for the standard verification command
- define how Windows contributors should invoke the canonical shell entry points or their equivalent wrappers

Outputs:

- monorepo skeleton
- baseline toolchain
- working branch policy documentation and `dev` branch follow-up
- explicit cross-platform command guidance

Definition of done:

- fresh clone can install and run baseline checks
- `./test-all.sh` exists and is used in CI
- status ledger reflects the new operational reality

## Milestone 2: Vertical slice

Goals:

- implement a minimal happy path from trip creation to itinerary view

Scope:

- create trip
- store trip preferences
- generate naive itinerary from fake or seeded place data
- render the itinerary in web and mobile shells

Definition of done:

- one end-to-end flow works
- shared schemas power both frontends
- at least baseline unit and integration tests exist

## Milestone 3: Discovery and hidden gems

Goals:

- add place discovery, neighborhood summaries, and hiddenness scoring

Scope:

- city pages or views
- normalized place catalog
- discovery provider caching
- user-facing `Touristy`, `Balanced`, `Hidden` labels

Definition of done:

- discovery results are normalized and explainable
- hiddenness is visible in both data and UI

## Milestone 4: In-trip and near-me mode

Goals:

- support real-time itinerary adjustment during a trip

Scope:

- near-me suggestions
- fill-one-hour and rainy-day actions
- skip stop and smart swap
- time-aware recommendation ranking

Definition of done:

- users can change course quickly
- recommendation logic has targeted tests

## Milestone 5: Social and collaboration

Goals:

- add opt-in visibility, trip collaboration, and contextual social matching

Scope:

- trip visibility controls
- city lobby
- place-level aggregate presence
- trip collaboration and lightweight chat

Definition of done:

- privacy defaults are enforced
- social flows are contextual and test-covered

## Milestone 6: Offline and export

Goals:

- support cached itineraries and offline trip cards

Scope:

- local itinerary cache
- offline summary artifact
- map snapshot or fallback directions

Definition of done:

- a user can access critical trip info without network access

## Milestone 7: Hardening

Goals:

- improve reliability, observability, and delivery readiness

Scope:

- provider failure handling
- rate limiting
- logs and metrics
- E2E coverage
- performance and accessibility cleanup

Definition of done:

- the product has a defendable engineering baseline for continued iteration
