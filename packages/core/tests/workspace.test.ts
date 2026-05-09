import { describe, expect, test } from 'vitest';

import { latestCompletedStage, planningStages } from '../src/index';

describe('core scaffold', () => {
  test('tracks the bootstrap stage as the current completed milestone', () => {
    expect(planningStages).toContain('vertical-slice');
    expect(latestCompletedStage).toBe('bootstrap');
  });
});
