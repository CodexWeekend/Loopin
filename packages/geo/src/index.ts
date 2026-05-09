export type Coordinate = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(origin: Coordinate, target: Coordinate): number {
  const dLat = toRadians(target.lat - origin.lat);
  const dLng = toRadians(target.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const targetLat = toRadians(target.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function estimateTravelMinutes(origin: Coordinate, target: Coordinate, averageKmh = 4.5): number {
  const distanceKm = haversineDistanceKm(origin, target);

  return Math.max(0, Math.round((distanceKm / averageKmh) * 60));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
