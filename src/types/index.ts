export type CivicCategory =
  | 'Roads & Potholes'
  | 'Waste & Garbage'
  | 'Streetlights & Electricity'
  | 'Water Supply & Drainage'
  | 'Public Spaces & Parks'
  | 'Traffic & Road Safety'
  | 'Other / Not Sure';

export type CivicDepartment =
  | 'Roads & Public Works'
  | 'Sanitation & Solid Waste'
  | 'Electricity & Street Lighting'
  | 'Water Supply & Sewerage'
  | 'Parks & Public Spaces'
  | 'Traffic & Transport'
  | 'General Civic Administration'
  | 'Needs Human Review';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus = 'Reported' | 'Under Review' | 'In Progress' | 'Resolved';

export interface ScoreBreakdown {
  severity: number;              // 0-10 (weight 30%)
  publicImpact: number;          // 0-10 (weight 25%)
  accessibilityRisk: number;     // 0-10 (weight 20%)
  vulnerableLocationImpact: number; // 0-10 (weight 15%)
  persistence: number;           // 0-10 (weight 10%)
}

export interface ReportLocation {
  locality: string;
  streetOrLandmark?: string;
  latitude?: number;
  longitude?: number;
  jurisdiction?: string;
}

export interface ComplaintUpdate {
  id: string;
  reportId: string;
  status: ComplaintStatus;
  note: string;
  createdByRole: 'admin' | 'system';
  authorEmail?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  trackingCode: string;
  reporterUid: string;
  reporterEmail?: string;
  title: string;
  description: string;
  detectedLanguage?: string;
  citizenSelectedCategory: CivicCategory;
  aiSuggestedCategory: CivicCategory;
  finalCategory: CivicCategory;
  aiSuggestedDepartment: CivicDepartment;
  finalDepartment: CivicDepartment;
  aiPriorityScore: number;
  aiPriorityLevel: PriorityLevel;
  finalPriority: PriorityLevel;
  aiConfidence: number;
  aiSummary: string;
  aiReason: string;
  recommendedAction?: string;
  scoreBreakdown: ScoreBreakdown;
  imageObservations: string[];
  imageUrl?: string;
  imageStoragePath?: string;
  location: ReportLocation;
  status: ComplaintStatus;
  sharePublicly: boolean;
  supportCount: number;
  supportedByUids?: string[];
  relatedReportIds: string[];
  triageMethod: 'gemini' | 'fallback';
  requiresHumanReview: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  adminNotes?: string[];
}

export interface PublicReport {
  id: string;
  trackingCode: string;
  title: string;
  summary: string;
  category: CivicCategory;
  department: CivicDepartment;
  locality: string;
  approximateCoordinates?: {
    latitude: number;
    longitude: number;
  };
  priority: PriorityLevel;
  priorityScore: number;
  status: ComplaintStatus;
  supportCount: number;
  createdAt: string;
  imageUrl?: string;
  imageObservations?: string[];
  recentUpdate?: string;
  updates?: Array<{
    status: ComplaintStatus;
    note: string;
    createdAt: string;
  }>;
}

export interface AdminAuditLog {
  id: string;
  reportId: string;
  adminEmail: string;
  action: string;
  changes: Record<string, unknown>;
  internalNote?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalComplaints: number;
  reported: number;
  underReview: number;
  inProgress: number;
  resolved: number;
  criticalPriority: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  statusDistribution: Record<ComplaintStatus, number>;
  categoryDistribution: Record<string, number>;
  departmentWorkload: Record<string, number>;
}
