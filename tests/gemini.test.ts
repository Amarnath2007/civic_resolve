import { describe, it, expect } from 'vitest';
import {
  sanitizeCategory,
  sanitizeDepartment,
  runFallbackClassifier,
  GeminiTriageSchema,
  triageComplaint,
} from '@/lib/ai/gemini';

describe('Gemini AI Triage Engine & Fallback Classifier', () => {
  it('sanitizes categories against strict predefined taxonomy', () => {
    expect(sanitizeCategory('Roads & Potholes')).toBe('Roads & Potholes');
    expect(sanitizeCategory('roads & potholes')).toBe('Roads & Potholes');
    expect(sanitizeCategory('Invalid Random Category', 'Waste & Garbage')).toBe('Waste & Garbage');
    expect(sanitizeCategory('Alien Invasion')).toBe('Other / Not Sure');
  });

  it('sanitizes departments against strict predefined taxonomy', () => {
    expect(sanitizeDepartment('Roads & Public Works', 'Roads & Potholes')).toBe('Roads & Public Works');
    expect(sanitizeDepartment('roads & public works', 'Roads & Potholes')).toBe('Roads & Public Works');
    expect(sanitizeDepartment('Unknown Space Dept', 'Water Supply & Drainage')).toBe('Water Supply & Sewerage');
  });

  it('correctly handles English keyword heuristics in fallback classifier', () => {
    const result = runFallbackClassifier({
      title: 'Deep pothole on 100 Feet Road',
      description: 'The road tar is completely damaged and vehicles are skidding.',
    });

    expect(result.triageMethod).toBe('fallback');
    expect(result.suggestedCategory).toBe('Roads & Potholes');
    expect(result.suggestedDepartment).toBe('Roads & Public Works');
    expect(result.priorityScore).toBeGreaterThanOrEqual(50);
  });

  it('correctly understands Tamil & Tanglish keywords in fallback classifier', () => {
    const resultTanglish = runFallbackClassifier({
      title: 'Street light problem in our area',
      description: 'Inga street light vilakku eriyala, night full ah dark ah iruku.',
    });

    expect(resultTanglish.suggestedCategory).toBe('Streetlights & Electricity');
    expect(resultTanglish.suggestedDepartment).toBe('Electricity & Street Lighting');

    const resultTamilWaste = runFallbackClassifier({
      title: 'Kuppai problem',
      description: 'Garbage bin overflowing, periya kuppai thotti full ah smell.',
    });

    expect(resultTamilWaste.suggestedCategory).toBe('Waste & Garbage');
    expect(resultTamilWaste.suggestedDepartment).toBe('Sanitation & Solid Waste');
  });

  it('validates structured Gemini triage JSON schema with Zod', () => {
    const validRaw = {
      isCivicIssue: true,
      detectedLanguage: 'English',
      category: 'Roads & Potholes',
      department: 'Roads & Public Works',
      summary: 'Large pothole posing a hazard to two-wheeler riders.',
      reason: 'Pothole in high traffic zone with skid risk.',
      severity: 8,
      publicImpact: 7,
      accessibilityRisk: 6,
      vulnerableLocationImpact: 5,
      persistence: 6,
      confidence: 0.94,
      possibleImmediateDanger: false,
      requiresHumanReview: true,
      imageObservations: ['Cracked asphalt with 10cm depth depression.'],
      recommendedAction: 'Dispatch asphalt patch team.',
      tags: ['pothole', 'road'],
    };

    const parsed = GeminiTriageSchema.safeParse(validRaw);
    expect(parsed.success).toBe(true);
  });

  it('gracefully falls back when GEMINI_API_KEY is not set', async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const result = await triageComplaint({
      title: 'Water pipe leaking near school',
      description: 'Clean drinking water is bursting out of the main supply line.',
      selectedCategory: 'Water Supply & Drainage',
    });

    expect(result.triageMethod).toBe('fallback');
    expect(result.suggestedCategory).toBe('Water Supply & Drainage');
    expect(result.suggestedDepartment).toBe('Water Supply & Sewerage');

    process.env.GEMINI_API_KEY = prevKey;
  });
});
