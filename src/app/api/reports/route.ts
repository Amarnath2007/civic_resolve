import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbService, generateTrackingCode } from '@/lib/db/store';
import { triageComplaint } from '@/lib/ai/gemini';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { findNearbyRelatedReports } from '@/lib/geo';
import { CivicCategory, Report } from '@/types';
import { CIVIC_CATEGORIES, DEFAULT_JURISDICTION } from '@/lib/constants';

const CreateReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().optional(),
  locality: z.string().min(2, 'Locality is required').max(100),
  streetOrLandmark: z.string().max(150).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  sharePublicly: z.boolean().default(false),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const department = searchParams.get('department') || undefined;
    const reporterUid = searchParams.get('reporterUid') || undefined;
    const search = searchParams.get('search') || undefined;

    // Check optional auth for filtering citizen's own reports
    const authHeader = req.headers.get('authorization');
    if (reporterUid && authHeader) {
      const auth = await authenticateRequest(req);
      if (auth.user && !auth.user.isAdmin && auth.user.uid !== reporterUid) {
        return NextResponse.json(
          { error: 'Forbidden: You can only view your own complaints.' },
          { status: 403 }
        );
      }
    }

    const reports = await dbService.getReports({
      status,
      category,
      priority,
      department,
      reporterUid,
      search,
    });

    return NextResponse.json({ success: true, count: reports.length, reports });
  } catch (error: any) {
    console.error('API GET /api/reports error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve reports.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const parsed = CreateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // Resolve reporter identity
    let reporterUid = 'anonymous-citizen';
    let reporterEmail: string | undefined;

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const auth = await authenticateRequest(req);
      if (auth.user) {
        reporterUid = auth.user.uid;
        reporterEmail = auth.user.email;
      }
    }

    const selectedCategory: CivicCategory = CIVIC_CATEGORIES.includes(
      data.category as CivicCategory
    )
      ? (data.category as CivicCategory)
      : 'Other / Not Sure';

    // Execute Gemini AI triage (or fallback classifier)
    const triage = await triageComplaint({
      title: data.title,
      description: data.description,
      selectedCategory,
      location: {
        locality: data.locality,
        streetOrLandmark: data.streetOrLandmark,
      },
      imageBuffer: data.imageBase64,
      imageMimeType: data.imageMimeType,
    });

    // Check for nearby related reports for Neighbourhood Pulse
    const allExisting = await dbService.getReports();
    const relatedMatches = findNearbyRelatedReports(
      {
        category: triage.suggestedCategory,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      allExisting,
      150
    );

    const relatedReportIds = relatedMatches.map((m) => m.report.id);

    const now = new Date().toISOString();
    const id = `cr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const trackingCode = generateTrackingCode();

    const newReport: Report = {
      id,
      trackingCode,
      reporterUid,
      reporterEmail,
      title: data.title,
      description: data.description,
      detectedLanguage: triage.detectedLanguage,
      citizenSelectedCategory: selectedCategory,
      aiSuggestedCategory: triage.suggestedCategory,
      finalCategory: triage.suggestedCategory,
      aiSuggestedDepartment: triage.suggestedDepartment,
      finalDepartment: triage.suggestedDepartment,
      aiPriorityScore: triage.priorityScore,
      aiPriorityLevel: triage.priorityLevel,
      finalPriority: triage.priorityLevel,
      aiConfidence: triage.confidence,
      aiSummary: triage.summary,
      aiReason: triage.reason,
      recommendedAction: triage.recommendedAction,
      scoreBreakdown: triage.scoreBreakdown,
      imageObservations: triage.imageObservations,
      imageUrl: data.imageBase64
        ? `data:${data.imageMimeType || 'image/jpeg'};base64,${data.imageBase64}`
        : undefined,
      location: {
        locality: data.locality,
        streetOrLandmark: data.streetOrLandmark,
        latitude: data.latitude,
        longitude: data.longitude,
        jurisdiction: DEFAULT_JURISDICTION,
      },
      status: 'Reported',
      sharePublicly: data.sharePublicly,
      supportCount: 0,
      supportedByUids: [],
      relatedReportIds,
      triageMethod: triage.triageMethod,
      requiresHumanReview: triage.requiresHumanReview,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      adminNotes: [],
    };

    const savedReport = await dbService.createReport(newReport);

    return NextResponse.json(
      {
        success: true,
        message: 'Your report has been successfully submitted.',
        report: savedReport,
        triageSummary: {
          trackingCode: savedReport.trackingCode,
          suggestedCategory: savedReport.finalCategory,
          recommendedDepartment: savedReport.finalDepartment,
          priorityLevel: savedReport.finalPriority,
          priorityScore: savedReport.aiPriorityScore,
          shortAssessment: savedReport.aiSummary,
          submissionDate: savedReport.createdAt,
          triageMethod: savedReport.triageMethod,
          nearbyRelatedCount: relatedReportIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API POST /api/reports error:', error);
    return NextResponse.json(
      { error: 'Failed to process and store civic report.', details: error.message },
      { status: 500 }
    );
  }
}
