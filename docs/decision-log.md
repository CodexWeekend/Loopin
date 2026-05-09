# Decision Log

Use this file for sticky defaults that future contributors should not silently reverse.

## Active Decisions

### D-001: Canonical docs plus thin wrappers

- Status: active
- Decision: Product scope, architecture, and status live in canonical repo docs. `CLAUDE.md` and `GEMINI.md` stay thin.
- Why: Avoid drift and make the repo portable across tools and laptops.

### D-002: Documentation-first bootstrap before scaffolding

- Status: active
- Decision: Establish repo canon, status, and workflow rules before generating app code.
- Why: The repo started nearly empty, and future agents need stable context before implementation begins.

### D-003: TypeScript-first monorepo target

- Status: active
- Decision: The default technical direction is a `pnpm` monorepo with Next.js web, Expo mobile, Node API, PostgreSQL/PostGIS, Redis, and shared packages.
- Why: This matches the product brief and supports shared contracts across surfaces.

### D-004: HTTP JSON API with shared schemas

- Status: active
- Decision: Default to versioned HTTP JSON endpoints under `/api/v1` with shared runtime validation and typed clients.
- Why: It is explicit, easy to document, and keeps web and mobile aligned.

### D-005: Privacy-first social defaults

- Status: active
- Decision: Users are private by default, and trip presence is opt-in and scoped by trip.
- Why: Social features are useful only if trust and consent remain central.

### D-006: Status ledger as operational source of truth

- Status: active
- Decision: `docs/implementation-status.md` records current state, completed work, open gaps, and next steps.
- Why: Agents and humans need one place to understand what exists now without reconstructing history.

### D-007: Pre-dev branch workflow

- Status: active
- Decision: Until a real `dev` branch exists, contributors should create `feat/*` or `fix/*` branches from `main` and target pull requests back to `main`.
- Why: The repo cannot forbid direct work on `main` without also stating the temporary safe path.

### D-008: Canonical command names with Windows fallback

- Status: active
- Decision: The canonical command contract uses `./init.sh`, `./sync-dev.sh`, and `./test-all.sh`. On Windows, contributors should use Git Bash or WSL until equivalent repo-native wrappers are added.
- Why: This preserves one standard command vocabulary while still documenting how Windows contributors should execute it.
