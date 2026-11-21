import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createReportApi, GET as getReportsApi } from '@/app/api/reports/route';
import { GET as getReportByIdApi, PATCH as patchReportApi } from '@/app/api/reports/[id]/route';
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

  it('POST /api/reports accepts valid report, triggers triage, and assigns tracking ID', async () => {
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

  it('GET /api/reports/public returns privacy-safe fields without reporter email or uid', async () => {
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
    expect(first.approximateCoordinates).toBeDefined();
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
