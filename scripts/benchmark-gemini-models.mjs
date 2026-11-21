import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not found in environment.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Test dataset across English, Tamil, and Tanglish
const testCases = [
  {
    language: 'English',
    title: 'Hazardous deep pothole near Government Hospital entrance',
    description: 'A 2-foot wide crater-like pothole has opened up right before the emergency ambulance bay entrance. Ambulances are forced to swerve into oncoming traffic, and multiple two-wheelers have crashed.',
    expectedCategory: 'Roads & Potholes',
    expectedDepartment: 'Roads & Public Works',
    expectedUrgencyRange: [75, 100], // Critical
  },
  {
    language: 'Tamil',
    title: 'குடிநீர் குழாய் உடைந்து கழிவுநீர் கலக்கிறது',
    description: 'மெயின் ரோட்டில் பிரதான குடிநீர் விநியோக குழாய் உடைந்து கடந்த 3 நாட்களாக சுத்தமான தண்ணீர் பெருக்கெடுத்து ஓடுகிறது. அருகில் உள்ள சாக்கடை கழிவுநீரும் இதில் கலப்பதால் நோய் பரவும் அபாயம் உள்ளது.',
    expectedCategory: 'Water Supply & Drainage',
    expectedDepartment: 'Water Supply & Sewerage',
    expectedUrgencyRange: [70, 95], // High or Critical
  },
  {
    language: 'Tanglish',
    title: 'Street light velicham illa, 4 naala full dark ah iruku',
    description: 'Residential 3rd cross street la 4 consecutive LED poles eriyala. Night time la ladies and kids nadakka romba bayama iruku, safety problem ah iruku.',
    expectedCategory: 'Streetlights & Electricity',
    expectedDepartment: 'Electricity & Street Lighting',
    expectedUrgencyRange: [50, 85], // High or Critical
  },
];

// Multimodal image test case
const heroImage = fs.readFileSync('public/hero.png');
const base64Hero = heroImage.toString('base64');

const candidateModels = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
];

async function benchmarkModelOnCase(model, testCase, includeImage = false) {
  const promptText = `
You are an expert AI civic triage assistant for CivicResolve.
Analyze this civic complaint submission and return a valid JSON object:
{
  "isCivicIssue": boolean,
  "detectedLanguage": string,
  "category": "Roads & Potholes" | "Waste & Garbage" | "Streetlights & Electricity" | "Water Supply & Drainage" | "Public Spaces & Parks" | "Traffic & Road Safety" | "Other / Not Sure",
  "department": "Roads & Public Works" | "Sanitation & Solid Waste" | "Electricity & Street Lighting" | "Water Supply & Sewerage" | "Parks & Public Spaces" | "Traffic & Transport" | "General Civic Administration",
  "summary": string,
  "reason": string,
  "severity": number (0-10),
  "publicImpact": number (0-10),
  "accessibilityRisk": number (0-10),
  "vulnerableLocationImpact": number (0-10),
  "persistence": number (0-10),
  "imageObservations": string[]
}

SUBMISSION:
Title: "${testCase.title}"
Description: "${testCase.description}"
`;

  const contents = [];
  if (includeImage) {
    contents.push({
      inlineData: {
        data: base64Hero,
        mimeType: 'image/png',
      },
    });
  }
  contents.push({ text: promptText });

  const start = Date.now();
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout (12s)')), 12000)
    );

    const call = ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const res = await Promise.race([call, timeout]);
    const duration = Date.now() - start;
    const text = res.text || '';
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

    return {
      success: true,
      duration,
      parsed,
    };
  } catch (err) {
    const duration = Date.now() - start;
    return {
      success: false,
      duration,
      error: err.status || err.message || String(err),
    };
  }
}

async function runBenchmark() {
  console.log('=== EMPIRICAL GEMINI MODEL COMPARISON BENCHMARK ===\n');

  for (const model of candidateModels) {
    console.log(`\n--------------------------------------------------`);
    console.log(`EVALUATING MODEL: [${model}]`);
    console.log(`--------------------------------------------------`);

    let totalDuration = 0;
    let successCount = 0;

    for (const tc of testCases) {
      console.log(`\n  >> Test Case [${tc.language}]: "${tc.title.substring(0, 40)}..."`);
      const result = await benchmarkModelOnCase(model, tc, false);

      if (result.success) {
        successCount++;
        totalDuration += result.duration;
        const p = result.parsed;
        const weightedScore = Math.round(
          p.severity * 3 +
          p.publicImpact * 2.5 +
          p.accessibilityRisk * 2 +
          p.vulnerableLocationImpact * 1.5 +
          p.persistence * 1
        );

        console.log(`     Status: SUCCESS (${result.duration}ms)`);
        console.log(`     Detected Language: "${p.detectedLanguage}"`);
        console.log(`     Assigned Category: "${p.category}" (Expected: "${tc.expectedCategory}") -> ${p.category === tc.expectedCategory ? 'MATCH' : 'MISMATCH'}`);
        console.log(`     Assigned Department: "${p.department}" (Expected: "${tc.expectedDepartment}") -> ${p.department === tc.expectedDepartment ? 'MATCH' : 'MISMATCH'}`);
        console.log(`     Urgency Score: ${weightedScore}/100 (Expected range: ${tc.expectedUrgencyRange[0]}-${tc.expectedUrgencyRange[1]})`);
        console.log(`     Summary: "${p.summary}"`);
      } else {
        console.log(`     Status: FAILED (${result.duration}ms)`);
        console.log(`     Error Detail: ${result.error}`);
      }
    }

    // Multimodal image observation test
    console.log(`\n  >> Multimodal Image Test [hero.png photo]:`);
    const mmResult = await benchmarkModelOnCase(model, testCases[0], true);
    if (mmResult.success) {
      console.log(`     Multimodal Status: SUCCESS (${mmResult.duration}ms)`);
      console.log(`     Image Observations:`, mmResult.parsed.imageObservations);
    } else {
      console.log(`     Multimodal Status: FAILED (${mmResult.duration}ms)`);
      console.log(`     Error: ${mmResult.error}`);
    }

    if (successCount > 0) {
      console.log(`\n  Summary for [${model}]: ${successCount}/${testCases.length} text tests succeeded. Avg text latency: ${Math.round(totalDuration / successCount)}ms`);
    } else {
      console.log(`\n  Summary for [${model}]: 0/${testCases.length} tests succeeded.`);
    }
  }

  console.log('\n=== BENCHMARK COMPLETE ===');
}

runBenchmark();
