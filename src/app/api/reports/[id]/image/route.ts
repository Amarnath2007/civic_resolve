import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { generateSignedDeliveryUrl } from '@/lib/media/cloudinary';

type RouteProps = {
  params: Promise<{ id: string }>;
};

/**
 * Secure endpoint to request a temporary signed delivery URL for complaint evidence.
 * Authenticates user first, then verifies report ownership or administrative privileges.
 */
export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const { report } = await dbService.getReport(id);

    if (!report) {
      return NextResponse.json({ error: 'Complaint report not found.' }, { status: 404 });
    }

    // Authenticate requester first
    const auth = await authenticateRequest(req);
    const user = auth.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    // Verify ownership or administrative authority
    const isOwner = Boolean(user.uid === report.reporterUid);
    const isAdmin = Boolean(user.isAdmin);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Access restricted to report owner and municipal administrators.' },
        { status: 403 }
      );
    }

    if (!report.imageMetadata?.publicId) {
      return NextResponse.json(
        { error: 'No photographic evidence was attached to this complaint.' },
        { status: 404 }
      );
    }

    const signedUrl = generateSignedDeliveryUrl(
      report.imageMetadata.publicId,
      report.imageMetadata.format,
      3600 // 1 hour validity
    );

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error('API GET /api/reports/[id]/image error:', error);
    return NextResponse.json(
      { error: 'Failed to generate secure image access URL.', details: error.message },
      { status: 500 }
    );
  }
}
