import { describe, it, expect } from 'vitest';
import { getHaversineDistanceMetres, approximateCoordinates, findNearbyRelatedReports } from '@/lib/geo';
import { Report } from '@/types';

describe('Neighbourhood Pulse - Geo & Proximity', () => {
  it('calculates accurate distance between two points in Coimbatore', () => {
    // Gandhipuram Bus Stand: 11.0168, 76.9558
    // Cross Cut Road Junction: 11.0180, 76.9600 (~480 meters)
    const dist = getHaversineDistanceMetres(11.0168, 76.9558, 11.0180, 76.9600);
    expect(dist).toBeGreaterThan(400);
    expect(dist).toBeLessThan(600);
  });

  it('returns 0 distance for identical coordinates', () => {
    const dist = getHaversineDistanceMetres(11.0168, 76.9558, 11.0168, 76.9558);
    expect(dist).toBe(0);
  });

  it('approximates coordinates to 3 decimals to protect citizen privacy', () => {
    const approx = approximateCoordinates(11.0168421, 76.9558194);
    expect(approx?.latitude).toBe(11.017);
    expect(approx?.longitude).toBe(76.956);
  });

  it('identifies nearby related reports within 150m radius and ignores distant or resolved ones', () => {
    const baseLat = 11.0168;
    const baseLon = 76.9558;

    const mockReports: Partial<Report>[] = [
      {
        id: 'rep-1',
        finalCategory: 'Streetlights & Electricity',
        citizenSelectedCategory: 'Streetlights & Electricity',
        status: 'Reported',
        location: {
          locality: 'Gandhipuram',
          latitude: baseLat + 0.0005, // ~55 metres away
          longitude: baseLon + 0.0005,
        },
      },
      {
        id: 'rep-2',
        finalCategory: 'Streetlights & Electricity',
        citizenSelectedCategory: 'Streetlights & Electricity',
        status: 'Resolved', // Should be ignored because already resolved
        location: {
          locality: 'Gandhipuram',
          latitude: baseLat + 0.0003,
          longitude: baseLon + 0.0003,
        },
      },
      {
        id: 'rep-3',
        finalCategory: 'Waste & Garbage', // Different category
        citizenSelectedCategory: 'Waste & Garbage',
        status: 'Reported',
        location: {
          locality: 'Gandhipuram',
          latitude: baseLat + 0.0002,
          longitude: baseLon + 0.0002,
        },
      },
      {
        id: 'rep-4',
        finalCategory: 'Streetlights & Electricity',
        citizenSelectedCategory: 'Streetlights & Electricity',
        status: 'In Progress',
        location: {
          locality: 'Peelamedu',
          latitude: baseLat + 0.05, // Several km away
          longitude: baseLon + 0.05,
        },
      },
    ];

    const nearby = findNearbyRelatedReports(
      {
        id: 'current-rep',
        category: 'Streetlights & Electricity',
        latitude: baseLat,
        longitude: baseLon,
      },
      mockReports as Report[],
      150
    );

    expect(nearby.length).toBe(1);
    expect(nearby[0].report.id).toBe('rep-1');
    expect(nearby[0].distanceMetres).toBeLessThan(150);
  });
});
