import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth/serverAuth';

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;

    // Authenticate citizen
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      return NextResponse.json(
        { error: 'You must be signed in to support neighbourhood issues.' },
        { status: 401 }
      );
    }

    const result = await dbService.supportReport(id, auth.user.uid);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, supportCount: result.supportCount },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      supportCount: result.supportCount,
    });
  } catch (error: any) {
    console.error('API POST /api/reports/[id]/support error:', error);
    return NextResponse.json(
      { error: 'Failed to record support.', details: error.message },
      { status: 500 }
    );
  }
}
