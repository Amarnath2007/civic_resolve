import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbService, toPublicReport } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { generateSignedDeliveryUrl } from '@/lib/media/cloudinary';
import { CivicCategory, CivicDepartment, PriorityLevel, ComplaintStatus } from '@/types';
import {
  CIVIC_CATEGORIES,
  CIVIC_DEPARTMENTS,
  PRIORITY_LEVELS,
  COMPLAINT_STATUSES,
} from '@/lib/constants';

const AdminUpdateSchema = z.object({
  status: z.enum(['Reported', 'Under Review', 'In Progress', 'Resolved']).optional(),
  finalCategory: z.string().optional(),
  finalDepartment: z.string().optional(),
  finalPriority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  publicNote: z.string().max(1000).optional(),
  internalNote: z.string().max(1000).optional(),
});

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const { report, updates } = await dbService.getReport(id);

    if (!report) {
      return NextResponse.json({ error: 'Complaint report not found.' }, { status: 404 });
    }

    // Check caller authentication
    const auth = await authenticateRequest(req);
    const user = auth.user;

    const isOwner = Boolean(user && user.uid === report.reporterUid);
    const isAdmin = Boolean(user && user.isAdmin);

    // If caller is admin or the owner: grant full record with authorized signed delivery URL
    if (isAdmin || isOwner) {
      let authorizedImageUrl = report.imageUrl;

      // If Cloudinary publicId exists, generate fresh temporary signed delivery URL
      if (report.imageMetadata?.publicId) {
        authorizedImageUrl = generateSignedDeliveryUrl(
          report.imageMetadata.publicId,
          report.imageMetadata.format
        );
      }

      return NextResponse.json({
        success: true,
        report: {
          ...report,
          imageUrl: authorizedImageUrl,
        },
        updates,
        isOwner,
        isAdmin,
      });
    }

    // If public sharing is enabled, return privacy-safe view (WITHOUT original photo)
    if (report.sharePublicly) {
      const publicView = toPublicReport(report, updates);
      return NextResponse.json({
        success: true,
        report: publicView,
        updates: publicView.updates,
        isPublicView: true,
      });
    }

    // Otherwise, private complaint access restricted
    return NextResponse.json(
      { error: 'Forbidden: Private complaint record. Please sign in with the reporter account.' },
      { status: 403 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API GET /api/reports/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch report.', details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;

    // Strict admin authorization verification
    const auth = await authenticateRequest(req, { requireAdmin: true });
    if (!auth.user || !auth.user.isAdmin) {
      return NextResponse.json(
        { error: auth.error || 'Forbidden: Administrator privileges required.' },
        { status: auth.status || 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const parsed = AdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const updates: Record<string, unknown> = {};

    if (data.status && COMPLAINT_STATUSES.includes(data.status as ComplaintStatus)) {
      updates.status = data.status;
    }

    if (data.finalCategory && CIVIC_CATEGORIES.includes(data.finalCategory as CivicCategory)) {
      updates.finalCategory = data.finalCategory;
    }

    if (
      data.finalDepartment &&
      CIVIC_DEPARTMENTS.includes(data.finalDepartment as CivicDepartment)
    ) {
      updates.finalDepartment = data.finalDepartment;
    }

    if (data.finalPriority && PRIORITY_LEVELS.includes(data.finalPriority as PriorityLevel)) {
      updates.finalPriority = data.finalPriority;
    }

    const updated = await dbService.updateReport(
      id,
      updates,
      auth.user.email,
      data.publicNote,
      data.internalNote
    );

    if (!updated) {
      return NextResponse.json({ error: 'Report not found to update.' }, { status: 404 });
    }

    const { updates: freshUpdates } = await dbService.getReport(id);

    return NextResponse.json({
      success: true,
      message: 'Complaint updated successfully.',
      report: updated,
      updates: freshUpdates,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API PATCH /api/reports/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to update report.', details: err.message },
      { status: 500 }
    );
  }
}
