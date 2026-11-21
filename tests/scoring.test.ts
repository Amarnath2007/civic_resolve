import { describe, it, expect } from 'vitest';
import { calculatePriorityScore, mapScoreToPriorityLevel, generateScoreJustification } from '@/lib/scoring';
import { ScoreBreakdown } from '@/types';

describe('Evidence-Based Priority Assessment', () => {
  it('correctly calculates 0 for all zero metrics and assigns Low priority', () => {
    const zeroBreakdown: ScoreBreakdown = {
      severity: 0,
      publicImpact: 0,
      accessibilityRisk: 0,
      vulnerableLocationImpact: 0,
      persistence: 0,
    };
    const score = calculatePriorityScore(zeroBreakdown);
    expect(score).toBe(0);
    expect(mapScoreToPriorityLevel(score)).toBe('Low');
  });

  it('correctly calculates 100 for all max metrics (10/10) and assigns Critical priority', () => {
    const maxBreakdown: ScoreBreakdown = {
      severity: 10,
      publicImpact: 10,
      accessibilityRisk: 10,
      vulnerableLocationImpact: 10,
      persistence: 10,
    };
    const score = calculatePriorityScore(maxBreakdown);
    expect(score).toBe(100);
    expect(mapScoreToPriorityLevel(score)).toBe('Critical');
  });

  it('accurately respects individual factor weightings', () => {
    // 10 severity only = 10 * 10 * 0.30 = 30 -> Medium
    const severityOnly: ScoreBreakdown = {
      severity: 10,
      publicImpact: 0,
      accessibilityRisk: 0,
      vulnerableLocationImpact: 0,
      persistence: 0,
    };
    expect(calculatePriorityScore(severityOnly)).toBe(30);
    expect(mapScoreToPriorityLevel(30)).toBe('Medium');

    // 10 public impact only = 10 * 10 * 0.25 = 25 -> Medium
    const impactOnly: ScoreBreakdown = {
      severity: 0,
      publicImpact: 10,
      accessibilityRisk: 0,
      vulnerableLocationImpact: 0,
      persistence: 0,
    };
    expect(calculatePriorityScore(impactOnly)).toBe(25);
    expect(mapScoreToPriorityLevel(25)).toBe('Medium');

    // 10 accessibility risk only = 10 * 10 * 0.20 = 20 -> Low
    const accessOnly: ScoreBreakdown = {
      severity: 0,
      publicImpact: 0,
      accessibilityRisk: 10,
      vulnerableLocationImpact: 0,
      persistence: 0,
    };
    expect(calculatePriorityScore(accessOnly)).toBe(20);
    expect(mapScoreToPriorityLevel(20)).toBe('Low');
  });

  it('correctly categorizes boundary conditions', () => {
    expect(mapScoreToPriorityLevel(0)).toBe('Low');
    expect(mapScoreToPriorityLevel(24)).toBe('Low');
    expect(mapScoreToPriorityLevel(25)).toBe('Medium');
    expect(mapScoreToPriorityLevel(49)).toBe('Medium');
    expect(mapScoreToPriorityLevel(50)).toBe('High');
    expect(mapScoreToPriorityLevel(74)).toBe('High');
    expect(mapScoreToPriorityLevel(75)).toBe('Critical');
    expect(mapScoreToPriorityLevel(100)).toBe('Critical');
  });

  it('generates a transparent human-readable justification', () => {
    const breakdown: ScoreBreakdown = {
      severity: 8,
      publicImpact: 8,
      accessibilityRisk: 7,
      vulnerableLocationImpact: 6,
      persistence: 5,
    };
    const score = calculatePriorityScore(breakdown);
    const level = mapScoreToPriorityLevel(score);
    const justification = generateScoreJustification(score, level, breakdown);

    expect(justification).toContain(`${score}/100`);
    expect(justification).toContain(level);
    expect(justification).toContain('severe physical or infrastructural disruption');
  });
});
