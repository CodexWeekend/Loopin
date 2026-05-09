import { buildPlannerPreview } from '../../../../src/features/trip-planner/lib/get-trip-planner-view';
import { TripPlannerShell } from '../../../../src/features/trip-planner/components/trip-planner-shell';

export default function TripPlannerPage() {
  return <TripPlannerShell initialPreview={buildPlannerPreview()} />;
}
