import { describe, expect, test } from 'vitest';

import { mobileWorkspace } from '../src/index';

describe('mobile workspace scaffold', () => {
  test('declares the mobile workspace metadata', () => {
    expect(mobileWorkspace.name).toBe('@loopin/mobile');
    expect(mobileWorkspace.purpose).toContain('Expo');
  });
});
