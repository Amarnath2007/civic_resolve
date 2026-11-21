import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import {
  CivicCategory,
  CivicDepartment,
  PriorityLevel,
  ScoreBreakdown,
} from '@/types';
import {
  CIVIC_CATEGORIES,
  CIVIC_DEPARTMENTS,
  CATEGORY_DEPARTMENT_MAP,
} from '@/lib/constants';
import {
  calculatePriorityScore,
  mapScoreToPriorityLevel,
  generateScoreJustification,
} from '@/lib/scoring';

/**
 * Zod schema for strictly validating Gemini's structured triage response.
 */
export const GeminiTriageSchema = z.object({
  isCivicIssue: z.boolean().default(true),
  detectedLanguage: z.string().default('English'),
  category: z.string(),
  department: z.string(),
  summary: z.string().min(5),
  reason: z.string().min(5),
  severity: z.number().min(0).max(10),
  publicImpact: z.number().min(0).max(10),
  accessibilityRisk: z.number().min(0).max(10),
  vulnerableLocationImpact: z.number().min(0).max(10),
  persistence: z.number().min(0).max(10),
  confidence: z.number().min(0).max(1).default(0.85),
  possibleImmediateDanger: z.boolean().default(false),
  requiresHumanReview: z.boolean().default(false),
  imageObservations: z.array(z.string()).default([]),
  recommendedAction: z.string().default('Inspect and verify site conditions.'),
  tags: z.array(z.string()).default([]),
});

export type GeminiTriageRaw = z.infer<typeof GeminiTriageSchema>;

export interface TriageResult {
  triageMethod: 'gemini' | 'fallback';
  detectedLanguage: string;
  suggestedCategory: CivicCategory;
  suggestedDepartment: CivicDepartment;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  confidence: number;
  summary: string;
  reason: string;
  recommendedAction: string;
  scoreBreakdown: ScoreBreakdown;
  imageObservations: string[];
  possibleImmediateDanger: boolean;
  requiresHumanReview: boolean;
  tags: string[];
}

export interface TriageInput {
  title: string;
  description: string;
  selectedCategory?: CivicCategory;
  location?: {
    locality: string;
    streetOrLandmark?: string;
  };
  imageBuffer?: Buffer | string; // base64 string or Buffer
  imageMimeType?: string;
}

/**
 * Normalize and sanitize category against strictly allowed taxonomy
 */
export function sanitizeCategory(category: string, userCategory?: CivicCategory): CivicCategory {
  const match = CIVIC_CATEGORIES.find(
    (c) => c.toLowerCase() === category.toLowerCase()
  );
  if (match) return match;

  if (userCategory && userCategory !== 'Other / Not Sure') {
    return userCategory;
  }
  return 'Other / Not Sure';
}

/**
 * Normalize and sanitize department against strictly allowed taxonomy
 */
export function sanitizeDepartment(dept: string, category: CivicCategory): CivicDepartment {
  const match = CIVIC_DEPARTMENTS.find(
    (d) => d.toLowerCase() === dept.toLowerCase()
  );
  if (match) return match;

  // Fallback to official category default mapping
  return CATEGORY_DEPARTMENT_MAP[category] || 'General Civic Administration';
}

/**
 * Rule-based fallback classifier when Gemini API is unavailable,
 * network is down, or credentials are not yet configured.
 */
export function runFallbackClassifier(input: TriageInput): TriageResult {
  const text = `${input.title} ${input.description}`.toLowerCase();

  let category: CivicCategory = input.selectedCategory && input.selectedCategory !== 'Other / Not Sure'
    ? input.selectedCategory
    : 'Other / Not Sure';

  let breakdown: ScoreBreakdown = {
    severity: 5,
    publicImpact: 5,
    accessibilityRisk: 4,
    vulnerableLocationImpact: 4,
    persistence: 4,
  };

  const tags: string[] = [];

  // Keywords heuristics (including Tamil / Tanglish common terms)
  if (text.includes('drain') || text.includes('drainage') || text.includes('sewage') || text.includes('saakadai') || text.includes('water leak') || text.includes('pipe burst') || text.includes('thanni')) {
    category = 'Water Supply & Drainage';
    breakdown.severity = 7;
    breakdown.publicImpact = 7;
    breakdown.accessibilityRisk = 6;
    tags.push('drainage', 'water-pipeline');
  } else if (text.includes('pothole') || text.includes('road') || text.includes('tarmac') || text.includes('asphalt') || text.includes('salai') || text.includes('kuzhi')) {
    category = 'Roads & Potholes';
    breakdown.severity = 6;
    breakdown.publicImpact = 7;
    breakdown.accessibilityRisk = 6;
    tags.push('road-repair', 'pothole');
  } else if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('kuppai') || text.includes('dustbin') || text.includes('dump')) {
    category = 'Waste & Garbage';
    breakdown.severity = 6;
    breakdown.publicImpact = 6;
    breakdown.persistence = 6;
    tags.push('sanitation', 'waste-clearance');
  } else if (text.includes('street light') || text.includes('streetlight') || text.includes('lamp post') || text.includes('electric pole') || text.includes('vilakku') || text.includes('power cut') || text.includes('no light') || text.includes('darkness')) {
    category = 'Streetlights & Electricity';
    breakdown.severity = 5;
    breakdown.publicImpact = 6;
    breakdown.accessibilityRisk = 7;
    tags.push('electrical', 'streetlights');
  } else if (text.includes('park') || text.includes('bench') || text.includes('playground') || text.includes('garden')) {
    category = 'Public Spaces & Parks';
    breakdown.severity = 4;
    breakdown.publicImpact = 5;
    tags.push('park-maintenance');
  } else if (text.includes('traffic signal') || text.includes('speed breaker') || text.includes('jam') || text.includes('accident prone')) {
    category = 'Traffic & Road Safety';
    breakdown.severity = 7;
    breakdown.publicImpact = 8;
    tags.push('traffic-safety');
  } else if (input.selectedCategory && input.selectedCategory !== 'Other / Not Sure') {
    category = input.selectedCategory;
  }

  const department = CATEGORY_DEPARTMENT_MAP[category] || 'General Civic Administration';
  const score = calculatePriorityScore(breakdown);
  const priorityLevel = mapScoreToPriorityLevel(score);
  const justification = generateScoreJustification(score, priorityLevel, breakdown);

  return {
    triageMethod: 'fallback',
    detectedLanguage: 'English / Multilingual (Fallback Classifier)',
    suggestedCategory: category,
    suggestedDepartment: department,
    priorityScore: score,
    priorityLevel: priorityLevel,
    confidence: 0.60,
    summary: `${input.title} - Automatically categorized under ${category}. Detailed AI analysis queued for admin verification.`,
    reason: `Deterministic fallback triage applied. ${justification}`,
    recommendedAction: `Schedule field inspection by ${department} team to assess specific repair requirements.`,
    scoreBreakdown: breakdown,
    imageObservations: input.imageBuffer ? ['Image attached; awaiting administrative review.'] : [],
    possibleImmediateDanger: breakdown.severity >= 8,
    requiresHumanReview: true,
    tags,
  };
}

/**
 * Executes server-side Google Gemini AI triage using the official @google/genai SDK.
 */
export async function triageComplaint(input: TriageInput): Promise<TriageResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini API key configured, use deterministic fallback
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    return runFallbackClassifier(input);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

    const promptText = `
You are an expert AI civic triage assistant for CivicResolve, an AI-powered municipal grievance management platform.
Your job is to objectively analyze citizen complaint submissions, understand the problem, determine category and responsible municipal department, and score urgency using transparent evidence-based criteria.

CITIZEN SUBMISSION:
- Title: "${input.title}"
- Description: "${input.description}"
- Citizen-Selected Category: "${input.selectedCategory || 'Not specified'}"
- Location Locality: "${input.location?.locality || 'Not specified'}"
- Street/Landmark: "${input.location?.streetOrLandmark || 'Not specified'}"

CRITICAL INSTRUCTIONS:
1. MULTILINGUAL SUPPORT: The description may be written in English, Tamil (தமிழ்), or mixed Tamil-English (Tanglish, e.g. "Road romba damaged ah iruku", "Street light eriyala"). You must understand it accurately and produce a clear, professional ENGLISH summary and reasoning.
2. CIVIC TAXONOMY:
   - Allowed categories:
     ${CIVIC_CATEGORIES.map((c) => `"${c}"`).join(', ')}
   - Allowed departments:
     ${CIVIC_DEPARTMENTS.map((d) => `"${d}"`).join(', ')}
3. SCORING SYSTEM (0-10 on each integer scale):
   - severity: 0 (trivial) to 10 (critical infrastructural failure/hazard) [Weight 30%]
   - publicImpact: 0 (isolated) to 10 (heavily populated public arterial/high footfall) [Weight 25%]
   - accessibilityRisk: 0 (none) to 10 (blocks sidewalks, ramps, mobility barriers) [Weight 20%]
   - vulnerableLocationImpact: 0 (none) to 10 (near school, hospital, elder-care, transit hub) [Weight 15%]
   - persistence: 0 (fresh) to 10 (chronic, long-standing neglect) [Weight 10%]
4. IMAGE EVIDENCE:
   - If an image is attached, describe ONLY visible factual evidence (e.g., "Deep pothole on asphalt", "Overflowing green municipal bin").
   - DO NOT hallucinate exact coordinates, private identities, or unverified claims.
   - If no image is provided, return an empty array for imageObservations.
5. RECOMMENDATION:
   - Provide a concise, practical next step for the field team (e.g., "Dispatch road patch crew to seal pothole and level asphalt.").

Return ONLY a valid JSON object matching this schema:
{
  "isCivicIssue": boolean,
  "detectedLanguage": string,
  "category": string (must match one of allowed categories),
  "department": string (must match one of allowed departments),
  "summary": string (clear English summary, 1-2 sentences),
  "reason": string (short justification for urgency and department),
  "severity": number (0-10),
  "publicImpact": number (0-10),
  "accessibilityRisk": number (0-10),
  "vulnerableLocationImpact": number (0-10),
  "persistence": number (0-10),
  "confidence": number (between 0.0 and 1.0),
  "possibleImmediateDanger": boolean,
  "requiresHumanReview": boolean,
  "imageObservations": string[],
  "recommendedAction": string,
  "tags": string[]
}
`;

    // Prepare contents
    const contents: any[] = [];

    // Multimodal image support if available
    if (input.imageBuffer) {
      let base64Data = '';
      if (Buffer.isBuffer(input.imageBuffer)) {
        base64Data = input.imageBuffer.toString('base64');
      } else if (typeof input.imageBuffer === 'string') {
        base64Data = input.imageBuffer.replace(/^data:image\/\w+;base64,/, '');
      }

      if (base64Data) {
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: input.imageMimeType || 'image/jpeg',
          },
        });
      }
    }

    contents.push({ text: promptText });

    const modelCandidates = [
      modelName,
      'gemini-3.1-flash-lite',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let response: any = null;
    let lastError: any = null;

    for (const currentModel of modelCandidates) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout calling Gemini model ${currentModel}`)), 10000)
        );

        const apiPromise = ai.models.generateContent({
          model: currentModel,
          contents,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1, // low temperature for deterministic evaluation
          },
        });

        response = await Promise.race([apiPromise, timeoutPromise]);
        if (response && response.text) {
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        console.warn(`Model ${currentModel} error (${modelErr?.status || modelErr?.message}), attempting next candidate.`);
        continue;
      }
    }

    if (!response || !response.text) {
      if (lastError) throw lastError;
      return runFallbackClassifier(input);
    }

    const responseText = response.text || '';
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();

    let rawParsed: any;
    try {
      rawParsed = JSON.parse(cleanedText);
    } catch {
      // JSON parse failed, fallback
      return runFallbackClassifier(input);
    }

    const validated = GeminiTriageSchema.safeParse(rawParsed);
    if (!validated.success) {
      console.warn('Gemini response schema mismatch, falling back:', validated.error);
      return runFallbackClassifier(input);
    }

    const data = validated.data;
    const sanitizedCat = sanitizeCategory(data.category, input.selectedCategory);
    const sanitizedDept = sanitizeDepartment(data.department, sanitizedCat);

    const breakdown: ScoreBreakdown = {
      severity: data.severity,
      publicImpact: data.publicImpact,
      accessibilityRisk: data.accessibilityRisk,
      vulnerableLocationImpact: data.vulnerableLocationImpact,
      persistence: data.persistence,
    };

    const priorityScore = calculatePriorityScore(breakdown);
    const priorityLevel = mapScoreToPriorityLevel(priorityScore);

    return {
      triageMethod: 'gemini',
      detectedLanguage: data.detectedLanguage,
      suggestedCategory: sanitizedCat,
      suggestedDepartment: sanitizedDept,
      priorityScore,
      priorityLevel,
      confidence: Math.round(data.confidence * 100) / 100,
      summary: data.summary,
      reason: data.reason,
      recommendedAction: data.recommendedAction,
      scoreBreakdown: breakdown,
      imageObservations: data.imageObservations || [],
      possibleImmediateDanger: data.possibleImmediateDanger,
      requiresHumanReview: data.requiresHumanReview || priorityLevel === 'Critical',
      tags: data.tags || [],
    };
  } catch (error) {
    console.error('Error invoking Google Gemini API, engaging fallback classifier:', error);
    return runFallbackClassifier(input);
  }
}
