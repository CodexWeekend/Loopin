// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { TripPlannerShell } from '../src/features/trip-planner/components/trip-planner-shell';
import { buildPlannerPreview } from '../src/features/trip-planner/lib/get-trip-planner-view';

describe('planner shell', () => {
  test('renders the generated itinerary interface', () => {
    render(<TripPlannerShell initialPreview={buildPlannerPreview()} />);

    expect(screen.getByText('Tokyo, Japan')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Generate itinerary' })).toBeDefined();
    expect(screen.getByText('Day 1')).toBeDefined();
    expect(screen.getByText('Smart swap suggestion')).toBeDefined();
  });
});
