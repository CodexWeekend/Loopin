#!/usr/bin/env bash
set -euo pipefail

git fetch origin
git checkout main
git pull --ff-only origin main
git checkout dev
git merge --ff-only origin/main
git push origin dev
