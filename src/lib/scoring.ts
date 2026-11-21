import { PriorityLevel, ScoreBreakdown } from '@/types';
import { SCORING_WEIGHTS } from './constants';

/**
 * Calculates a transparent weighted priority score between 0 and 100.
 * Factors:
 * - Problem severity: 30%
 * - Public impact: 25%
 * - Accessibility risk: 20%
 * - Impact on vulnerable locations: 15%
 * - Persistence of the issue: 10%
 *
 * Each factor must be in range 0-10.
 */
export function calculatePriorityScore(breakdown: ScoreBreakdown): number {
  const clamp = (val: number) => Math.min(10, Math.max(0, Number(val) || 0));

  const severity = clamp(breakdown.severity);
  const publicImpact = clamp(breakdown.publicImpact);
  const accessibilityRisk = clamp(breakdown.accessibilityRisk);
  const vulnerableLocationImpact = clamp(breakdown.vulnerableLocationImpact);
  const persistence = clamp(breakdown.persistence);

  const rawScore =
    severity * 10 * SCORING_WEIGHTS.severity +
    publicImpact * 10 * SCORING_WEIGHTS.publicImpact +
    accessibilityRisk * 10 * SCORING_WEIGHTS.accessibilityRisk +
    vulnerableLocationImpact * 10 * SCORING_WEIGHTS.vulnerableLocationImpact +
    persistence * 10 * SCORING_WEIGHTS.persistence;

  // Round to nearest integer within 0-100
  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

/**
 * Maps a numerical score (0-100) to its corresponding Priority Level:
 * - 0–24: Low
 * - 25–49: Medium
 * - 50–74: High
 * - 75–100: Critical
 */
export function mapScoreToPriorityLevel(score: number): PriorityLevel {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  if (clamped >= 75) return 'Critical';
  if (clamped >= 50) return 'High';
  if (clamped >= 25) return 'Medium';
  return 'Low';
}

/**
 * Generates an objective, readable summary justification of the priority score.
 */
export function generateScoreJustification(
  score: number,
  level: PriorityLevel,
  breakdown: ScoreBreakdown
): string {
  const highlights: string[] = [];

  if (breakdown.severity >= 8) {
    highlights.push('severe physical or infrastructural disruption');
  } else if (breakdown.severity >= 5) {
    highlights.push('noticeable disruption to normal utility');
  }

  if (breakdown.publicImpact >= 7) {
    highlights.push('high daily footfall / commuter volume affected');
  }

  if (breakdown.accessibilityRisk >= 7) {
    highlights.push('critical barrier for pedestrians or mobility-impaired individuals');
  }

  if (breakdown.vulnerableLocationImpact >= 6) {
    highlights.push('proximity to school, hospital, transit hub or elderly care zone');
  }

  if (breakdown.persistence >= 7) {
    highlights.push('prolonged unaddressed duration');
  }

  if (highlights.length === 0) {
    return `Score ${score}/100 (${level} Priority) reflecting standard routine maintenance attention.`;
  }

  return `Score ${score}/100 (${level} Priority) driven by ${highlights.join(', ')}.`;
}
