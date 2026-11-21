import {
  Report,
  PublicReport,
  ComplaintStatus,
  CivicCategory,
  CivicDepartment,
  PriorityLevel,
  ComplaintUpdate,
  AdminAuditLog,
  DashboardStats,
} from '@/types';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { INITIAL_DEMO_REPORTS } from '@/lib/seedData';
import { approximateCoordinates } from '@/lib/geo';

// In-memory state for local evaluation fallback
class LocalStore {
  private reports: Map<string, Report> = new Map();
  private updates: Map<string, ComplaintUpdate[]> = new Map();
  private auditLogs: AdminAuditLog[] = [];
  private supportVotes: Map<string, Set<string>> = new Map();

  constructor() {
    this.reset();
  }

  reset(seedData: Report[] = INITIAL_DEMO_REPORTS) {
    this.reports.clear();
    this.updates.clear();
    this.auditLogs = [];
    this.supportVotes.clear();

    for (const r of seedData) {
      this.reports.set(r.id, { ...r });

      // Initialize support votes set
      const votes = new Set<string>(r.supportedByUids || []);
      this.supportVotes.set(r.id, votes);

      // Initial updates history
      const initialUpdates: ComplaintUpdate[] = [
        {
          id: `upd-${r.id}-1`,
          reportId: r.id,
          status: 'Reported',
          note: 'Complaint registered and triaged into the municipal queue.',
          createdByRole: 'system',
          createdAt: r.createdAt,
        },
      ];

      if (r.status === 'Under Review' || r.status === 'In Progress' || r.status === 'Resolved') {
        initialUpdates.push({
          id: `upd-${r.id}-2`,
          reportId: r.id,
          status: r.status === 'Resolved' ? 'In Progress' : r.status,
          note: `Complaint assigned to ${r.finalDepartment}. Site assessment initiated.`,
          createdByRole: 'admin',
          createdAt: new Date(new Date(r.createdAt).getTime() + 4 * 3600 * 1000).toISOString(),
        });
      }

      if (r.status === 'Resolved') {
        initialUpdates.push({
          id: `upd-${r.id}-3`,
          reportId: r.id,
          status: 'Resolved',
          note: 'Remediation completed by municipal field unit. Site inspected and confirmed resolved.',
          createdByRole: 'admin',
          createdAt: r.resolvedAt || r.updatedAt,
        });
      }

      this.updates.set(r.id, initialUpdates);
    }
  }

  getAllReports(): Report[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getReport(idOrTracking: string): Report | null {
    // Check by ID
    if (this.reports.has(idOrTracking)) {
      return { ...this.reports.get(idOrTracking)! };
    }
    // Check by trackingCode
    for (const r of this.reports.values()) {
      if (r.trackingCode.toLowerCase() === idOrTracking.toLowerCase()) {
        return { ...r };
      }
    }
    return null;
  }

  saveReport(report: Report): Report {
    this.reports.set(report.id, { ...report });
    if (!this.supportVotes.has(report.id)) {
      this.supportVotes.set(report.id, new Set(report.supportedByUids || []));
    }

    const updates = this.updates.get(report.id) || [];
    updates.push({
      id: `upd-${report.id}-${Date.now()}`,
      reportId: report.id,
      status: report.status,
      note: 'Complaint registered and triaged into the municipal queue.',
      createdByRole: 'system',
      createdAt: report.createdAt,
    });
    this.updates.set(report.id, updates);

    return { ...report };
  }

  updateReport(
    id: string,
    updates: Partial<Report>,
    adminEmail?: string,
    publicNote?: string,
    internalNote?: string
  ): Report | null {
    const existing = this.getReport(id);
    if (!existing) return null;

    const previousStatus = existing.status;
    const isStatusChanged = updates.status && updates.status !== previousStatus;

    const merged: Report = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      resolvedAt:
        updates.status === 'Resolved'
          ? new Date().toISOString()
          : updates.status
          ? null
          : existing.resolvedAt,
    };

    if (internalNote) {
      merged.adminNotes = [...(merged.adminNotes || []), internalNote];
    }

    this.reports.set(merged.id, merged);

    // Record public update if status changed or note provided
    if (isStatusChanged || publicNote) {
      const reportUpdates = this.updates.get(merged.id) || [];
      reportUpdates.push({
        id: `upd-${merged.id}-${Date.now()}`,
        reportId: merged.id,
        status: merged.status,
        note: publicNote || `Status updated from ${previousStatus} to ${merged.status}.`,
        createdByRole: 'admin',
        authorEmail: adminEmail,
        createdAt: new Date().toISOString(),
      });
      this.updates.set(merged.id, reportUpdates);
    }

    // Record audit log
    if (adminEmail) {
      this.auditLogs.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        reportId: merged.id,
        adminEmail,
        action: isStatusChanged ? `Status changed to ${merged.status}` : 'Report modified',
        changes: updates as Record<string, unknown>,
        internalNote,
        timestamp: new Date().toISOString(),
      });
    }

    return { ...merged };
  }

  getUpdates(reportId: string): ComplaintUpdate[] {
    return (this.updates.get(reportId) || []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  addSupportVote(reportId: string, userUid: string): { success: boolean; supportCount: number; message: string } {
    const report = this.getReport(reportId);
    if (!report) {
      return { success: false, supportCount: 0, message: 'Report not found' };
    }

    const votes = this.supportVotes.get(report.id) || new Set<string>();
    if (votes.has(userUid)) {
      return {
        success: false,
        supportCount: report.supportCount,
        message: 'You have already supported this neighbourhood issue.',
      };
    }

    votes.add(userUid);
    this.supportVotes.set(report.id, votes);

    report.supportCount = votes.size;
    report.supportedByUids = Array.from(votes);
    this.reports.set(report.id, report);

    return {
      success: true,
      supportCount: report.supportCount,
      message: 'Support recorded! Thank you for standing with your community.',
    };
  }
}

// Global singleton for local store
const globalLocalStore = new LocalStore();

/**
 * Generates an official, human-friendly Complaint Tracking Code.
 * Format: CR-YYYY-XXXX (e.g. CR-2026-7319)
 */
export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `CR-${year}-${randomDigits}`;
}

/**
 * Transforms a full internal Report into a privacy-safe PublicReport.
 * Strips reporterUid, reporterEmail, exact private coordinates, and internal adminNotes.
 */
export function toPublicReport(report: Report, updates: ComplaintUpdate[] = []): PublicReport {
  return {
    id: report.id,
    trackingCode: report.trackingCode,
    title: report.title,
    summary: report.aiSummary || report.description.substring(0, 160),
    category: report.finalCategory,
    department: report.finalDepartment,
    locality: report.location?.locality || 'General Municipal Area',
    approximateCoordinates: approximateCoordinates(
      report.location?.latitude,
      report.location?.longitude
    ),
    priority: report.finalPriority,
    priorityScore: report.aiPriorityScore,
    status: report.status,
    supportCount: report.supportCount || 0,
    createdAt: report.createdAt,
    imageUrl: report.imageUrl,
    imageObservations: report.imageObservations || [],
    recentUpdate: updates.length > 0 ? updates[updates.length - 1].note : undefined,
    updates: updates.map((u) => ({
      status: u.status,
      note: u.note,
      createdAt: u.createdAt,
    })),
  };
}

/**
 * Database abstraction service layer
 */
export const dbService = {
  /**
   * Fetch all reports with multi-criteria filtering
   */
  async getReports(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    department?: string;
    reporterUid?: string;
    search?: string;
  }): Promise<Report[]> {
    const { firestore, isConfigured } = getFirebaseAdmin();

    let allReports: Report[] = [];

    if (isConfigured && firestore) {
      try {
        const snap = await firestore.collection('reports').orderBy('createdAt', 'desc').get();
        allReports = snap.docs.map((doc: any) => doc.data() as Report);
      } catch (err) {
        console.warn('Firestore getReports failed, falling back to local memory store:', err);
        allReports = globalLocalStore.getAllReports();
      }
    } else {
      allReports = globalLocalStore.getAllReports();
    }

    return allReports.filter((r) => {
      if (filters?.reporterUid && r.reporterUid !== filters.reporterUid) return false;
      if (filters?.status && filters.status !== 'All' && r.status !== filters.status) return false;
      if (filters?.category && filters.category !== 'All' && r.finalCategory !== filters.category) return false;
      if (filters?.priority && filters.priority !== 'All' && r.finalPriority !== filters.priority) return false;
      if (filters?.department && filters.department !== 'All' && r.finalDepartment !== filters.department) return false;

      if (filters?.search) {
        const query = filters.search.toLowerCase().trim();
        const matchesQuery =
          r.title.toLowerCase().includes(query) ||
          r.trackingCode.toLowerCase().includes(query) ||
          (r.location?.locality && r.location.locality.toLowerCase().includes(query)) ||
          r.finalCategory.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });
  },

  /**
   * Get report by ID or tracking code
   */
  async getReport(idOrTracking: string): Promise<{ report: Report | null; updates: ComplaintUpdate[] }> {
    const { firestore, isConfigured } = getFirebaseAdmin();

    if (isConfigured && firestore) {
      try {
        // Try direct ID
        const docRef = firestore.collection('reports').doc(idOrTracking);
        const docSnap = await docRef.get();

        let reportData: Report | null = null;
        if (docSnap.exists) {
          reportData = docSnap.data() as Report;
        } else {
          // Query trackingCode
          const qSnap = await firestore
            .collection('reports')
            .where('trackingCode', '==', idOrTracking.toUpperCase())
            .limit(1)
            .get();
          if (!qSnap.empty) {
            reportData = qSnap.docs[0].data() as Report;
          }
        }

        if (reportData) {
          const updatesSnap = await firestore
            .collection(`reports/${reportData.id}/updates`)
            .orderBy('createdAt', 'asc')
            .get();
          const updates = updatesSnap.docs.map((d: any) => d.data() as ComplaintUpdate);
          return { report: reportData, updates };
        }
      } catch (err) {
        console.warn('Firestore getReport error, falling back to local memory store:', err);
      }
    }

    const report = globalLocalStore.getReport(idOrTracking);
    const updates = report ? globalLocalStore.getUpdates(report.id) : [];
    return { report, updates };
  },

  /**
   * Retrieve privacy-safe public reports feed
   */
  async getPublicReports(filters?: { category?: string; locality?: string }): Promise<PublicReport[]> {
    const all = await this.getReports();
    const publicReports = all.filter((r) => r.sharePublicly);

    return publicReports
      .filter((r) => {
        if (filters?.category && filters.category !== 'All' && r.finalCategory !== filters.category) return false;
        if (filters?.locality && filters.locality !== 'All' && r.location?.locality !== filters.locality) return false;
        return true;
      })
      .map((r) => {
        const updates = globalLocalStore.getUpdates(r.id);
        return toPublicReport(r, updates);
      });
  },

  /**
   * Create a new complaint report
   */
  async createReport(report: Report): Promise<Report> {
    const { firestore, isConfigured } = getFirebaseAdmin();

    if (isConfigured && firestore) {
      try {
        await firestore.collection('reports').doc(report.id).set(report);

        // Also add initial update
        const initialUpdate: ComplaintUpdate = {
          id: `upd-${report.id}-init`,
          reportId: report.id,
          status: 'Reported',
          note: 'Complaint registered and triaged into the municipal queue.',
          createdByRole: 'system',
          createdAt: report.createdAt,
        };
        await firestore
          .collection(`reports/${report.id}/updates`)
          .doc(initialUpdate.id)
          .set(initialUpdate);

        // Also mirror to publicReports if sharePublicly enabled
        if (report.sharePublicly) {
          const pub = toPublicReport(report, [initialUpdate]);
          await firestore.collection('publicReports').doc(report.id).set(pub);
        }
      } catch (err) {
        console.warn('Firestore createReport error, caching locally:', err);
      }
    }

    return globalLocalStore.saveReport(report);
  },

  /**
   * Update report administrative status, category, department, or add progress note
   */
  async updateReport(
    id: string,
    updates: Partial<Report>,
    adminEmail?: string,
    publicNote?: string,
    internalNote?: string
  ): Promise<Report | null> {
    const { firestore, isConfigured } = getFirebaseAdmin();

    if (isConfigured && firestore) {
      try {
        const docRef = firestore.collection('reports').doc(id);
        const snap = await docRef.get();
        if (snap.exists) {
          const current = snap.data() as Report;
          const merged: Partial<Report> = {
            ...updates,
            updatedAt: new Date().toISOString(),
            resolvedAt:
              updates.status === 'Resolved'
                ? new Date().toISOString()
                : updates.status
                ? null
                : current.resolvedAt,
          };

          if (internalNote) {
            merged.adminNotes = [...(current.adminNotes || []), internalNote];
          }

          await docRef.update(merged);

          if (updates.status || publicNote) {
            const updateRecord: ComplaintUpdate = {
              id: `upd-${id}-${Date.now()}`,
              reportId: id,
              status: updates.status || current.status,
              note: publicNote || `Status updated to ${updates.status}`,
              createdByRole: 'admin',
              authorEmail: adminEmail,
              createdAt: new Date().toISOString(),
            };
            await firestore
              .collection(`reports/${id}/updates`)
              .doc(updateRecord.id)
              .set(updateRecord);
          }

          if (adminEmail) {
            await firestore.collection('adminAuditLogs').add({
              reportId: id,
              adminEmail,
              action: updates.status ? `Status changed to ${updates.status}` : 'Report updated',
              changes: updates,
              internalNote,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.warn('Firestore updateReport error, fallback to local:', err);
      }
    }

    return globalLocalStore.updateReport(id, updates, adminEmail, publicNote, internalNote);
  },

  /**
   * Upvote / Support an issue (+1 per citizen UID)
   */
  async supportReport(reportId: string, userUid: string): Promise<{ success: boolean; supportCount: number; message: string }> {
    const { firestore, isConfigured } = getFirebaseAdmin();

    if (isConfigured && firestore) {
      try {
        const voteRef = firestore.doc(`reports/${reportId}/supportVotes/${userUid}`);
        const voteSnap = await voteRef.get();
        if (voteSnap.exists) {
          const repSnap = await firestore.collection('reports').doc(reportId).get();
          const count = repSnap.exists ? (repSnap.data() as Report).supportCount : 0;
          return {
            success: false,
            supportCount: count,
            message: 'You have already supported this neighbourhood issue.',
          };
        }

        await voteRef.set({
          userUid,
          votedAt: new Date().toISOString(),
        });

        const repDoc = firestore.collection('reports').doc(reportId);
        const repSnap = await repDoc.get();
        const repData = repSnap.data() as Report;
        const newCount = (repData.supportCount || 0) + 1;
        await repDoc.update({
          supportCount: newCount,
          supportedByUids: [...(repData.supportedByUids || []), userUid],
        });

        return {
          success: true,
          supportCount: newCount,
          message: 'Support recorded! Thank you for standing with your community.',
        };
      } catch (err) {
        console.warn('Firestore supportReport error, fallback to local:', err);
      }
    }

    return globalLocalStore.addSupportVote(reportId, userUid);
  },

  /**
   * Compute real-time dashboard statistics from database
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const reports = await this.getReports();

    const stats: DashboardStats = {
      totalComplaints: reports.length,
      reported: 0,
      underReview: 0,
      inProgress: 0,
      resolved: 0,
      criticalPriority: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      statusDistribution: {
        Reported: 0,
        'Under Review': 0,
        'In Progress': 0,
        Resolved: 0,
      },
      categoryDistribution: {},
      departmentWorkload: {},
    };

    for (const r of reports) {
      // Status
      if (r.status === 'Reported') stats.reported++;
      else if (r.status === 'Under Review') stats.underReview++;
      else if (r.status === 'In Progress') stats.inProgress++;
      else if (r.status === 'Resolved') stats.resolved++;

      if (stats.statusDistribution[r.status] !== undefined) {
        stats.statusDistribution[r.status]++;
      }

      // Priority
      if (r.finalPriority === 'Critical') stats.criticalPriority++;
      else if (r.finalPriority === 'High') stats.highPriority++;
      else if (r.finalPriority === 'Medium') stats.mediumPriority++;
      else if (r.finalPriority === 'Low') stats.lowPriority++;

      // Category
      const cat = r.finalCategory || 'Other';
      stats.categoryDistribution[cat] = (stats.categoryDistribution[cat] || 0) + 1;

      // Department
      const dept = r.finalDepartment || 'Unassigned';
      stats.departmentWorkload[dept] = (stats.departmentWorkload[dept] || 0) + 1;
    }

    return stats;
  },

  /**
   * Reset or re-seed the demonstration dataset
   */
  resetDemoSeed(): void {
    globalLocalStore.reset();
  },
};
