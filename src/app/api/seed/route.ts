import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function POST(req: NextRequest) {
  try {
    // Authenticate admin
    const auth = await authenticateRequest(req, { requireAdmin: true });
    if (!auth.user || !auth.user.isAdmin) {
      return NextResponse.json(
        { error: auth.error || 'Forbidden: Administrator privileges required.' },
        { status: auth.status || 403 }
      );
    }

    dbService.resetDemoSeed();
    const stats = await dbService.getDashboardStats();

    return NextResponse.json({
      success: true,
      message: 'Demo dataset successfully re-seeded for Coimbatore, Tamil Nadu.',
      stats,
    });
  } catch (error: any) {
    console.error('API POST /api/seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed demo data.', details: error.message },
      { status: 500 }
    );
  }
}
