import { describe, expect, test } from 'vitest';

import { apiWorkspace } from '../src/index';

describe('api workspace scaffold', () => {
  test('declares the backend workspace metadata', () => {
    expect(apiWorkspace).toEqual({
      milestone: 'scaffold',
      name: '@loopin/api',
      purpose: 'backend service entrypoint placeholder',
    });
  });
});
