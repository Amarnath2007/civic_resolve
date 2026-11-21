import { describe, it, expect, beforeEach } from 'vitest';
import { dbService, generateTrackingCode, toPublicReport } from '@/lib/db/store';
import { Report } from '@/types';

describe('Data Store & Workflow Logic', () => {
  beforeEach(() => {
    dbService.resetDemoSeed();
  });

  it('generates a valid tracking code with CR-YYYY-XXXX format', () => {
    const code = generateTrackingCode();
    expect(code).toMatch(/^CR-\d{4}-\d{4}$/);
  });

  it('filters reports accurately by status and category', async () => {
    const all = await dbService.getReports();
    expect(all.length).toBeGreaterThan(0);

    const roads = await dbService.getReports({ category: 'Roads & Potholes' });
    expect(roads.every((r) => r.finalCategory === 'Roads & Potholes')).toBe(true);

    const inProgress = await dbService.getReports({ status: 'In Progress' });
    expect(inProgress.every((r) => r.status === 'In Progress')).toBe(true);
  });

  it('safely transforms an internal report to a PublicReport with privacy guarantees', () => {
    const internalReport: Report = {
      id: 'priv-001',
      trackingCode: 'CR-2026-9999',
      reporterUid: 'secret-uid-999',
      reporterEmail: 'private-citizen@example.com',
      title: 'Water pipe leak',
      description: 'Private citizen notes and phone number 9876543210',
      citizenSelectedCategory: 'Water Supply & Drainage',
      aiSuggestedCategory: 'Water Supply & Drainage',
      finalCategory: 'Water Supply & Drainage',
      aiSuggestedDepartment: 'Water Supply & Sewerage',
      finalDepartment: 'Water Supply & Sewerage',
      aiPriorityScore: 70,
      aiPriorityLevel: 'High',
      finalPriority: 'High',
      aiConfidence: 0.95,
      aiSummary: 'Underground pipeline leak near road intersection.',
      aiReason: 'High priority due to clean water wastage.',
      scoreBreakdown: { severity: 7, publicImpact: 7, accessibilityRisk: 5, vulnerableLocationImpact: 5, persistence: 6 },
      imageObservations: [],
      location: {
        locality: 'Gandhipuram',
        latitude: 11.018543,
        longitude: 76.963289,
      },
      status: 'Reported',
      sharePublicly: true,
      supportCount: 5,
      relatedReportIds: [],
      triageMethod: 'gemini',
      requiresHumanReview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes: ['Top secret internal staff note'],
    };

    const pub = toPublicReport(internalReport);

    // Verify critical privacy guarantees
    expect((pub as any).reporterUid).toBeUndefined();
    expect((pub as any).reporterEmail).toBeUndefined();
    expect((pub as any).adminNotes).toBeUndefined();
    expect(pub.title).toBe(internalReport.title);
    expect(pub.summary).toBe(internalReport.aiSummary);
    // Coordinates must be approximated
    expect(pub.approximateCoordinates?.latitude).toBe(11.019);
    expect(pub.approximateCoordinates?.longitude).toBe(76.963);
  });

  it('prevents duplicate support votes by the same user on the same complaint', async () => {
    const testReportId = 'cr-rep-001';
    const userUid = 'voter-unique-123';

    // First vote should succeed
    const firstVote = await dbService.supportReport(testReportId, userUid);
    expect(firstVote.success).toBe(true);

    // Second vote by the exact same user must be blocked
    const duplicateVote = await dbService.supportReport(testReportId, userUid);
    expect(duplicateVote.success).toBe(false);
    expect(duplicateVote.message).toContain('already supported');
  });

  it('records an audit log and creates a public timeline update when status is updated', async () => {
    const testReportId = 'cr-rep-003';
    const adminEmail = 'commissioner@civicresolve.gov';
    const publicNote = 'Excavation team scheduled for tomorrow 9 AM.';

    const updated = await dbService.updateReport(
      testReportId,
      { status: 'In Progress' },
      adminEmail,
      publicNote,
      'Internal vendor contract assigned.'
    );

    expect(updated?.status).toBe('In Progress');
    const { updates } = await dbService.getReport(testReportId);
    const lastUpdate = updates[updates.length - 1];
    expect(lastUpdate.note).toBe(publicNote);
    expect(lastUpdate.status).toBe('In Progress');
  });
});
