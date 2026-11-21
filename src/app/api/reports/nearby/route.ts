import { NextRequest, NextResponse } from 'next/server';
import { dbService, toPublicReport } from '@/lib/db/store';
import { findNearbyRelatedReports } from '@/lib/geo';
import { DEFAULT_PROXIMITY_RADIUS_METRES } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');
    const category = searchParams.get('category') || '';
    const radiusStr = searchParams.get('radius');

    if (!latStr || !lonStr) {
      return NextResponse.json(
        { error: 'Missing required lat and lon query parameters.' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);
    const radiusMetres = radiusStr ? parseInt(radiusStr, 10) : DEFAULT_PROXIMITY_RADIUS_METRES;

    const allReports = await dbService.getReports();

    const matches = findNearbyRelatedReports(
      { category, latitude, longitude },
      allReports,
      radiusMetres
    );

    const safeResults = matches.map((m) => ({
      distanceMetres: m.distanceMetres,
      report: toPublicReport(m.report),
    }));

    return NextResponse.json({
      success: true,
      count: safeResults.length,
      radiusMetres,
      nearbyIssues: safeResults,
    });
  } catch (error: any) {
    console.error('API GET /api/reports/nearby error:', error);
    return NextResponse.json(
      { error: 'Failed to find nearby issues.', details: error.message },
      { status: 500 }
    );
  }
}
