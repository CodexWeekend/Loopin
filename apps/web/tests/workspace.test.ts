import { describe, expect, test } from 'vitest';

import { webWorkspace } from '../src/index';

describe('web workspace scaffold', () => {
  test('declares the web workspace metadata', () => {
    expect(webWorkspace.name).toBe('@loopin/web');
    expect(webWorkspace.purpose).toContain('Next.js');
  });
});
