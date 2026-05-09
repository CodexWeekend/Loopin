# AGENTS.md

## Purpose

This repository is Loopin, a travel planning and social product focused on smart city itineraries, local discovery, and opt-in coordination with other travelers.

Agents working in this repo must prioritize:

- Maintainable, modular code and docs
- Clear architecture boundaries
- Consistent UX and design language
- Working tests and repeatable workflows
- Honest status reporting with evidence

If a wrapper file, chat message, or local habit conflicts with the canonical repo docs, the canonical docs win.

## Required Reading Order

Read these files before making changes:

1. `README.md`
2. `AGENTS.md`
3. `docs/implementation-status.md`
4. `docs/product-spec.md`
5. `docs/roadmap.md`
6. Task-specific docs:
   - Backend/domain work: `docs/architecture.md`, `docs/data-model.md`
   - API work: `docs/api-guidelines.md`
   - UI work: `docs/design-system.md`, `docs/ux-principles.md`

## Artifact Registry

Use this table to understand which files exist for which audience and why:

| Artifact | Primary audience | Why it exists |
| --- | --- | --- |
| `README.md` | Humans and all agents | Fast repo orientation and onboarding order |
| `AGENTS.md` | All coding agents | Universal repo contract, workflow rules, safety rules |
| `CLAUDE.md` | Claude-based agents | Thin wrapper that points back to canonical docs |
| `GEMINI.md` | Gemini-based agents | Thin wrapper that points back to canonical docs |
| `docs/product-spec.md` | Product, engineering, design | Canonical product brief internalized into the repo |
| `docs/architecture.md` | Engineering | Target architecture and code placement rules |
| `docs/data-model.md` | Engineering | Shared domain vocabulary and entity model |
| `docs/api-guidelines.md` | Engineering | Endpoint, schema, auth, and error conventions |
| `docs/design-system.md` | Design and frontend | Shared tokens and UI rules across web/mobile |
| `docs/ux-principles.md` | Design, product, frontend | Core flows and interaction principles |
| `docs/roadmap.md` | Product and engineering | Milestones and definition of done |
| `docs/implementation-status.md` | All contributors | Current state, completed work, open gaps, next step |
| `docs/decision-log.md` | All contributors | Sticky defaults that should not drift silently |
| `.env.example` | Engineering | Placeholder environment contract and secrets hygiene |

## Workflow Rules

- Prefer canonical repo docs over memory or chat history.
- Work in small, reviewable increments.
- Update `docs/implementation-status.md` whenever the repo state, milestone status, or important decisions change.
- If you add or change standards, reflect them in the canonical docs in the same change.
- Do not claim something exists, works, or passes unless you verified it in the current session.

## Branching And Git Rules

Intended long-term branch model:

- `main`: production, always green
- `dev`: integration branch, regularly synced from `main`
- `feat/<scope>-<short-desc>`: feature branches
- `fix/<scope>-<short-desc>`: bugfix branches

Current reality:

- As of the bootstrap milestone, the repo still only has `main` in the shared remote history.
- Creating `dev` and normalizing the branch workflow is an explicit follow-up task.

Rules:

- Never commit directly to `main`.
- Prefer creating a short-lived working branch for any implementation task.
- Until `dev` exists, create `feat/*` or `fix/*` branches from `main` and target pull requests back to `main`.
- Once `dev` exists, branch from `dev`, not `main`.
- Once `dev` exists, target routine feature and fix pull requests to `dev` unless a human explicitly says otherwise.
- Do not use `git commit --no-verify`.
- Do not rewrite history unless a human explicitly asks for it.

## Command Contract

These commands are the intended project-standard entry points:

- `./init.sh`: install dependencies and run first checks
- `./sync-dev.sh`: sync `dev` from `main`
- `./test-all.sh`: run lint, typechecks, and tests

Current reality:

- These scripts are planned but not implemented yet.
- If you create them, make them the single documented standard and update every doc that references them.
- Until then, do not introduce conflicting pseudo-standards in wrapper files or chat-only instructions.
- On Windows, assume Git Bash or WSL for the canonical `.sh` entry points until equivalent repo-native wrappers are added.
- If Windows-friendly wrappers are introduced later, they should delegate to the same workflow and remain secondary to the canonical command contract.

## Quality Gates

Before handing off work:

- Run the relevant verification commands for the files you changed.
- Confirm docs still match actual repo state.
- Update the implementation status ledger if anything meaningful changed.
- Keep changes scoped to the acceptance criteria for the task.
- Prefer adding focused modules over broad rewrites.

## Environment And Secrets Policy

- Never commit real secrets.
- Keep `.env.example` current as the public contract for required environment variables.
- Store real values in untracked local `.env` files or the deployment platform secret manager.
- If a new integration needs credentials, document the variable name, owner, and purpose before using it.
- If ownership of a dependency or integration is unclear, record the gap in `docs/implementation-status.md` instead of guessing.

## Safety And Editing Rules

- Before major refactors, summarize current behavior and update the affected docs.
- Do not delete or rewrite large files without understanding what they currently represent.
- Preserve a stable onboarding path: `README.md` -> `AGENTS.md` -> `docs/implementation-status.md`.
- Keep agent-specific instructions thin. Product facts, architecture, and status belong in canonical docs, not wrapper files.
- When unsure, choose the smallest change that improves clarity and can be validated quickly.

## Handoff Rule

Every meaningful change should leave behind enough context for a different human or agent to continue the work without chat history. If the next contributor would have to guess what changed or why, the handoff is incomplete.
