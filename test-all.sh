#!/usr/bin/env bash
set -euo pipefail

corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test:ci
