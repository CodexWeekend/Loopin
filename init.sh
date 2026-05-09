#!/usr/bin/env bash
set -euo pipefail

corepack prepare pnpm@10.11.0 --activate
corepack pnpm install
./test-all.sh
