import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function GET(req: NextRequest) {
  try {
    // Authenticate admin access
    const auth = await authenticateRequest(req, { requireAdmin: true });
    if (!auth.user || !auth.user.isAdmin) {
      return NextResponse.json(
        { error: auth.error || 'Forbidden: Administrator privileges required.' },
        { status: auth.status || 403 }
      );
    }

    const stats = await dbService.getDashboardStats();
    return NextResponse.json(
      { success: true, stats },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API GET /api/admin/stats error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve admin analytics.', details: err.message },
      { status: 500 }
    );
  }
}
