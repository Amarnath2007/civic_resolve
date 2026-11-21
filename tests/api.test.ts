import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createReportApi, GET as getReportsApi } from '@/app/api/reports/route';
import { GET as getReportByIdApi, PATCH as patchReportApi } from '@/app/api/reports/[id]/route';
import { GET as getImageSignedUrlApi } from '@/app/api/reports/[id]/image/route';
import { POST as supportReportApi } from '@/app/api/reports/[id]/support/route';
import { GET as getPublicReportsApi } from '@/app/api/reports/public/route';
import { dbService } from '@/lib/db/store';

describe('End-to-End API Routes', () => {
  beforeEach(() => {
    dbService.resetDemoSeed();
  });

  it('POST /api/reports rejects invalid short input with 422', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        title: 'bad', // too short
        description: 'short',
        locality: 'G',
      }),
    });

    const res = await createReportApi(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('Validation failed');
  });

  it('POST /api/reports accepts valid report without image (text-only) and assigns tracking ID', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Dangerous open trench along pedestrian footpath',
        description: 'Open drainage excavation left uncovered without warning lights or safety ribbons.',
        category: 'Water Supply & Drainage',
        locality: 'Peelamedu',
        streetOrLandmark: 'Near Fun Republic Mall',
        latitude: 11.026,
        longitude: 77.003,
        sharePublicly: true,
      }),
    });

    const res = await createReportApi(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.report.trackingCode).toMatch(/^CR-\d{4}-\d{4}$/);
    expect(json.report.finalCategory).toBe('Water Supply & Drainage');
    expect(json.report.finalPriority).toBeDefined();
    expect(json.triageSummary.priorityScore).toBeGreaterThan(0);
  });

  it('POST /api/reports rejects unauthenticated photograph upload with 401', async () => {
    const unauthImageReq = new NextRequest('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Pothole on 100 Feet Road with photo',
        description: 'Deep road cavity causing two-wheelers to slip during rainy evening.',
        category: 'Roads & Potholes',
        locality: 'Gandhipuram',
        imageBase64: Buffer.from('test-photo-data').toString('base64'),
        imageMimeType: 'image/jpeg',
      }),
    });

    const res = await createReportApi(unauthImageReq);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Authentication required');
  });

  it('POST /api/reports accepts authenticated photograph upload and stores Cloudinary image metadata', async () => {
    const authImageReq = new NextRequest('http://localhost:3000/api/reports', {
      method: 'POST',
      headers: {
        authorization: 'Bearer demo-token:citizen@civicresolve.org:demo-citizen-1',
      },
      body: JSON.stringify({
        title: 'Pothole on 100 Feet Road with authenticated photo',
        description: 'Deep road cavity causing two-wheelers to slip during rainy evening.',
        category: 'Roads & Potholes',
        locality: 'Gandhipuram',
        imageBase64: Buffer.from('test-photo-data').toString('base64'),
        imageMimeType: 'image/jpeg',
        sharePublicly: true,
      }),
    });

    const res = await createReportApi(authImageReq);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.report.imageMetadata).toBeDefined();
    expect(json.report.imageMetadata.publicId).toContain('civicresolve_evidence/');
    expect(json.report.imageMetadata.resourceType).toBe('image');
    // Ensure raw base64 is NOT stored in the database
    const savedInDb = await dbService.getReport(json.report.id);
    expect(savedInDb.report?.imageUrl).toBeUndefined();
  });

  it('GET /api/reports/public returns privacy-safe fields without original image or reporter uid', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports/public');
    const res = await getPublicReportsApi(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.reports.length).toBeGreaterThan(0);

    const first = json.reports[0];
    expect(first.reporterUid).toBeUndefined();
    expect(first.reporterEmail).toBeUndefined();
    expect(first.adminNotes).toBeUndefined();
    expect(first.imageUrl).toBeUndefined(); // Photographs are not exposed on public feed
    expect(first.approximateCoordinates).toBeDefined();
  });

  it('GET /api/reports/[id]/image restricts access and only permits owner or admin', async () => {
    // 1. Unauthenticated request -> 401
    const unauthReq = new NextRequest('http://localhost:3000/api/reports/cr-rep-001/image');
    const unauthRes = await getImageSignedUrlApi(unauthReq, {
      params: Promise.resolve({ id: 'cr-rep-001' }),
    });
    expect(unauthRes.status).toBe(401);

    // 2. Unauthorized citizen (not owner, not admin) -> 403
    const strangerReq = new NextRequest('http://localhost:3000/api/reports/cr-rep-001/image', {
      headers: {
        authorization: 'Bearer demo-token:other@civicresolve.org:stranger-999',
      },
    });
    const strangerRes = await getImageSignedUrlApi(strangerReq, {
      params: Promise.resolve({ id: 'cr-rep-001' }),
    });
    expect(strangerRes.status).toBe(403);

    // 3. Authorized owner -> 200 with signedUrl
    // Set mock imageMetadata for cr-rep-001
    await dbService.updateReport('cr-rep-001', {
      imageMetadata: {
        publicId: 'civicresolve_evidence/evidence_demo_test',
        resourceType: 'image',
        format: 'jpg',
        uploadedAt: new Date().toISOString(),
      },
    });

    const ownerReq = new NextRequest('http://localhost:3000/api/reports/cr-rep-001/image', {
      headers: {
        authorization: 'Bearer demo-token:citizen1@civicresolve.org:demo-citizen-1',
      },
    });
    const ownerRes = await getImageSignedUrlApi(ownerReq, {
      params: Promise.resolve({ id: 'cr-rep-001' }),
    });
    expect(ownerRes.status).toBe(200);
    const ownerJson = await ownerRes.json();
    expect(ownerJson.signedUrl).toBeDefined();

    // 4. Authorized admin -> 200 with signedUrl
    const adminReq = new NextRequest('http://localhost:3000/api/reports/cr-rep-001/image', {
      headers: {
        authorization: 'Bearer demo-token:admin@civicresolve.gov:admin-1',
      },
    });
    const adminRes = await getImageSignedUrlApi(adminReq, {
      params: Promise.resolve({ id: 'cr-rep-001' }),
    });
    expect(adminRes.status).toBe(200);
    const adminJson = await adminRes.json();
    expect(adminJson.signedUrl).toBeDefined();
  });

  it('PATCH /api/reports/[id] forbids non-admin users with 403', async () => {
    const citizenReq = new NextRequest('http://localhost:3000/api/reports/cr-rep-001', {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer demo-token:citizen@civicresolve.org:cit-1',
      },
      body: JSON.stringify({
        status: 'Resolved',
      }),
    });

    const res = await patchReportApi(citizenReq, {
      params: Promise.resolve({ id: 'cr-rep-001' }),
    });

    expect(res.status).toBe(403);
  });

  it('PATCH /api/reports/[id] permits authorized admin to update status and add notes', async () => {
    const adminReq = new NextRequest('http://localhost:3000/api/reports/cr-rep-001', {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer demo-token:admin@civicresolve.gov:admin-1',
      },
      body: JSON.stringify({
        status: 'Resolved',
        publicNote: 'Patching completed and road reopened to traffic.',
        internalNote: 'Material cost verified.',
      }),
    });

    const res = await patchReportApi(adminReq, {
      params: Promise.resolve({ id: 'cr-rep-001' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.report.status).toBe('Resolved');
  });

  it('POST /api/reports/[id]/support requires authentication', async () => {
    const unauthReq = new NextRequest('http://localhost:3000/api/reports/cr-rep-001/support', {
      method: 'POST',
    });

    const res = await supportReportApi(unauthReq, {
      params: Promise.resolve({ id: 'cr-rep-001' }),
    });

    expect(res.status).toBe(401);
  });
});
