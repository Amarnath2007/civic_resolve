import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const locality = searchParams.get('locality') || undefined;

    const publicReports = await dbService.getPublicReports({ category, locality });

    return NextResponse.json({
      success: true,
      count: publicReports.length,
      reports: publicReports,
    });
  } catch (error: any) {
    console.error('API GET /api/reports/public error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve public issue feed.', details: error.message },
      { status: 500 }
    );
  }
}
