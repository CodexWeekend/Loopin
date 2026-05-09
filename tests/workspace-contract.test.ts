import { existsSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const requiredPaths = [
  'apps/api/package.json',
  'apps/mobile/package.json',
  'apps/web/package.json',
  'packages/core/package.json',
  'packages/design-system/package.json',
  'packages/geo/package.json',
  'packages/shared/package.json',
  'init.sh',
  'sync-dev.sh',
  'test-all.sh',
  '.github/workflows/ci.yml',
];

describe('workspace contract', () => {
  test('creates the monorepo skeleton promised by the roadmap', () => {
    const missing = requiredPaths.filter((path) => !existsSync(path));

    expect(missing).toEqual([]);
  });
});
