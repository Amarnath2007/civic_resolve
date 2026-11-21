import { Report } from '@/types';
import { DEFAULT_PROXIMITY_RADIUS_METRES } from './constants';

/**
 * Computes Great-circle distance between two GPS coordinates using the Haversine formula.
 * Returns distance in metres.
 */
export function getHaversineDistanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Returns an approximate coordinate with 3 decimal places (~110m resolution)
 * to safeguard citizen privacy on public feeds.
 */
export function approximateCoordinates(
  lat?: number,
  lon?: number
): { latitude: number; longitude: number } | undefined {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return undefined;
  }
  return {
    latitude: Math.round(lat * 1000) / 1000,
    longitude: Math.round(lon * 1000) / 1000,
  };
}

/**
 * Identifies potential duplicate or recurring neighbourhood issues:
 * - Same category
 * - Currently unresolved (not 'Resolved')
 * - Within specified distance radius (default: 150m)
 */
export function findNearbyRelatedReports(
  target: {
    id?: string;
    category: string;
    latitude?: number;
    longitude?: number;
  },
  existingReports: Report[],
  radiusMetres: number = DEFAULT_PROXIMITY_RADIUS_METRES
): Array<{ report: Report; distanceMetres: number }> {
  if (
    typeof target.latitude !== 'number' ||
    typeof target.longitude !== 'number' ||
    isNaN(target.latitude) ||
    isNaN(target.longitude)
  ) {
    return [];
  }

  const matches: Array<{ report: Report; distanceMetres: number }> = [];

  for (const r of existingReports) {
    if (r.id === target.id) continue;
    if (r.status === 'Resolved') continue;

    // Check category match
    if (r.finalCategory !== target.category && r.citizenSelectedCategory !== target.category) {
      continue;
    }

    const rLat = r.location?.latitude;
    const rLon = r.location?.longitude;
    if (typeof rLat !== 'number' || typeof rLon !== 'number') continue;

    const distance = getHaversineDistanceMetres(
      target.latitude,
      target.longitude,
      rLat,
      rLon
    );

    if (distance <= radiusMetres) {
      matches.push({
        report: r,
        distanceMetres: Math.round(distance),
      });
    }
  }

  return matches.sort((a, b) => a.distanceMetres - b.distanceMetres);
}
