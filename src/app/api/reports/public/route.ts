import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const locality = searchParams.get('locality') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;

    const publicReports = await dbService.getPublicReports({ category, locality, limit, page });

    return NextResponse.json(
      {
        success: true,
        count: publicReports.length,
        reports: publicReports,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API GET /api/reports/public error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve public issue feed.', details: err.message },
      { status: 500 }
    );
  }
}
