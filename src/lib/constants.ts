import { CivicCategory, CivicDepartment, PriorityLevel, ComplaintStatus } from '@/types';

export const CIVIC_CATEGORIES: CivicCategory[] = [
  'Roads & Potholes',
  'Waste & Garbage',
  'Streetlights & Electricity',
  'Water Supply & Drainage',
  'Public Spaces & Parks',
  'Traffic & Road Safety',
  'Other / Not Sure',
];

export const CIVIC_DEPARTMENTS: CivicDepartment[] = [
  'Roads & Public Works',
  'Sanitation & Solid Waste',
  'Electricity & Street Lighting',
  'Water Supply & Sewerage',
  'Parks & Public Spaces',
  'Traffic & Transport',
  'General Civic Administration',
  'Needs Human Review',
];

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  'Reported',
  'Under Review',
  'In Progress',
  'Resolved',
];

export const PRIORITY_LEVELS: PriorityLevel[] = ['Low', 'Medium', 'High', 'Critical'];

export const SCORING_WEIGHTS = {
  severity: 0.30,
  publicImpact: 0.25,
  accessibilityRisk: 0.20,
  vulnerableLocationImpact: 0.15,
  persistence: 0.10,
} as const;

export const DEFAULT_PROXIMITY_RADIUS_METRES = 150;
export const DEFAULT_JURISDICTION = process.env.DEFAULT_JURISDICTION || 'Coimbatore, Tamil Nadu';

export const CATEGORY_DESCRIPTIONS: Record<CivicCategory, string> = {
  'Roads & Potholes': 'Potholes, surface erosion, damaged asphalt, missing covers and hazardous road conditions.',
  'Waste & Garbage': 'Overflowing bins, improper dumping, uncollected municipal waste and organic litter.',
  'Streetlights & Electricity': 'Dark street corridors, flickering poles, exposed wiring and defunct fixtures.',
  'Water Supply & Drainage': 'Pipeline bursts, sewage overflow, contaminated supply and blocked storm drains.',
  'Public Spaces & Parks': 'Broken benches, damaged playground equipment, overgrown vegetation and unsafe walkways.',
  'Traffic & Road Safety': 'Non-functional signals, obscured signage, missing barricades and pedestrian hazards.',
  'Other / Not Sure': 'General municipal issues requiring department triage and inspection.',
};

export const CATEGORY_DEPARTMENT_MAP: Record<CivicCategory, CivicDepartment> = {
  'Roads & Potholes': 'Roads & Public Works',
  'Waste & Garbage': 'Sanitation & Solid Waste',
  'Streetlights & Electricity': 'Electricity & Street Lighting',
  'Water Supply & Drainage': 'Water Supply & Sewerage',
  'Public Spaces & Parks': 'Parks & Public Spaces',
  'Traffic & Road Safety': 'Traffic & Transport',
  'Other / Not Sure': 'General Civic Administration',
};
