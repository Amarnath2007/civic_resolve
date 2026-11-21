import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbService, generateTrackingCode } from '@/lib/db/store';
import { triageComplaint } from '@/lib/ai/gemini';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { findNearbyRelatedReports } from '@/lib/geo';
import {
  uploadComplaintEvidence,
  validateImageUpload,
  generateSignedDeliveryUrl,
} from '@/lib/media/cloudinary';
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
    const auth = authHeader ? await authenticateRequest(req) : null;
    if (auth?.user) {
      reporterUid = auth.user.uid;
      reporterEmail = auth.user.email;
    }

    // Secure upload requirement: citizen must be authenticated before uploading photograph
    if (data.imageBase64 && !auth?.user) {
      return NextResponse.json(
        {
          error:
            'Authentication required. Please sign in as a citizen before uploading photograph evidence.',
        },
        { status: 401 }
      );
    }

    // Validate image format and size
    if (data.imageBase64) {
      const validation = validateImageUpload(data.imageBase64, data.imageMimeType);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 422 });
      }
    }

    const selectedCategory: CivicCategory = CIVIC_CATEGORIES.includes(
      data.category as CivicCategory
    )
      ? (data.category as CivicCategory)
      : 'Other / Not Sure';

    // Execute Gemini AI triage: pass in-memory image bytes securely to Gemini
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

    // Securely upload complaint image to Cloudinary (authenticated asset delivery)
    let imageMetadata;
    let signedImageUrl: string | undefined;

    if (data.imageBase64) {
      try {
        imageMetadata = await uploadComplaintEvidence(data.imageBase64, data.imageMimeType);
        // Generate temporary signed delivery URL for immediate confirmation response
        if (imageMetadata.publicId) {
          signedImageUrl = generateSignedDeliveryUrl(
            imageMetadata.publicId,
            imageMetadata.format
          );
        }
      } catch (uploadErr: any) {
        console.error('Cloudinary evidence upload error:', uploadErr);
        // Do not fail entire complaint if Cloudinary is temporarily unreachable
      }
    }

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

    // Store report in Firestore / database.
    // NEVER store image binary data or base64 strings in Firestore!
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
      imageMetadata, // Cloudinary publicId, assetId, resourceType, format, uploadedAt
      imageUrl: undefined, // Stripped from persistent DB storage
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

    // Attach signedImageUrl only to the direct response for the submitting citizen
    const responseReport = {
      ...savedReport,
      imageUrl: signedImageUrl,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Your report has been successfully submitted.',
        report: responseReport,
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
          hasPhotoEvidence: Boolean(imageMetadata),
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
