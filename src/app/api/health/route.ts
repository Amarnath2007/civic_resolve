import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { GoogleGenAI } from '@google/genai';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();

  // 1. Firebase Admin & Authentication & Firestore
  let firebaseAdminStatus: 'Working' | 'Failed' = 'Failed';
  let firebaseAdminMsg = 'Not initialized';
  let firebaseAuthStatus: 'Working' | 'Failed' = 'Failed';
  let firebaseAuthMsg = 'Not initialized';
  let firestoreStatus: 'Working' | 'Failed' = 'Failed';
  let firestoreMsg = 'Not initialized';

  try {
    const admin = getFirebaseAdmin();
    if (!admin.isConfigured || !admin.auth || !admin.firestore) {
      firebaseAdminMsg = 'Missing Firebase Admin credentials in environment.';
      firebaseAuthMsg = 'Firebase Admin credentials missing.';
      firestoreMsg = 'Firebase Admin credentials missing.';
    } else {
      firebaseAdminStatus = 'Working';
      firebaseAdminMsg = 'Admin SDK initialized successfully.';

      // Real Auth connectivity verification: test custom token generation
      try {
        const token = await admin.auth.createCustomToken('health-probe');
        if (token) {
          firebaseAuthStatus = 'Working';
          firebaseAuthMsg = 'Service account credentials verified; token minting operational.';
        }
      } catch (authErr: unknown) {
        const errObj = authErr as Error;
        firebaseAuthStatus = 'Failed';
        firebaseAuthMsg = errObj?.message?.replace(/key\s*=\s*[^\s&]+/gi, 'key=[REDACTED]') || 'Auth probe failed.';
      }

      // Real Firestore connectivity verification: execute a limit(1) read
      try {
        const snap = await admin.firestore.collection('reports').limit(1).get();
        firestoreStatus = 'Working';
        firestoreMsg = `Firestore connected; query executed successfully (${snap.size} records found).`;
      } catch (fsErr: unknown) {
        const errObj = fsErr as Error;
        firestoreStatus = 'Failed';
        firestoreMsg = errObj?.message?.replace(/key\s*=\s*[^\s&]+/gi, 'key=[REDACTED]') || 'Firestore query failed.';
      }
    }
  } catch (err: unknown) {
    const errObj = err as Error;
    const sanitized = errObj?.message?.replace(/key\s*=\s*[^\s&]+/gi, 'key=[REDACTED]') || 'Error during Firebase check.';
    firebaseAdminMsg = sanitized;
    firebaseAuthMsg = sanitized;
    firestoreMsg = sanitized;
  }

  // 2. Google Gemini API
  let geminiStatus: 'Working' | 'Failed' = 'Failed';
  let geminiMsg = 'Not configured';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  let activeModel = geminiModel;

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.trim() === '' || geminiKey.includes('YOUR_')) {
      geminiMsg = 'GEMINI_API_KEY is not configured in environment.';
    } else {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const candidates = [geminiModel, 'gemini-3.7-flash', 'gemini-2.5-flash'];
      let lastErr: Error | null = null;

      for (const m of candidates) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: [{ text: 'Ping: reply with PONG' }],
            config: { temperature: 0.1 },
          });
          if (resp.text) {
            geminiStatus = 'Working';
            activeModel = m;
            geminiMsg = `Model ${m} operational; response received.`;
            break;
          }
        } catch (e: unknown) {
          const errObj = e as Error & { status?: number };
          lastErr = errObj;
          if (errObj?.status === 503 || errObj?.status === 429) continue;
          break;
        }
      }

      if (geminiStatus !== 'Working' && lastErr) {
        throw lastErr;
      }
    }
  } catch (geminiErr: unknown) {
    const errObj = geminiErr as Error;
    geminiStatus = 'Failed';
    geminiMsg = errObj?.message?.replace(/key\s*=\s*[^\s&]+/gi, 'key=[REDACTED]') || 'Gemini API call failed.';
  }

  // 3. Cloudinary
  let cloudinaryStatus: 'Working' | 'Failed' = 'Failed';
  let cloudinaryMsg = 'Not configured';

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      cloudinaryMsg = 'Missing Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET).';
    } else {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const pingRes = await cloudinary.api.ping();
      if (pingRes?.status === 'ok') {
        cloudinaryStatus = 'Working';
        cloudinaryMsg = `Connected and authenticated on cloud "${cloudName}".`;
      } else {
        cloudinaryMsg = 'Unexpected response from Cloudinary API.';
      }
    }
  } catch (cloudErr: unknown) {
    cloudinaryStatus = 'Failed';
    const errObj = cloudErr as { error?: { message?: string }; message?: string };
    const rawMsg = errObj?.error?.message || errObj?.message || String(cloudErr);
    cloudinaryMsg = rawMsg.replace(/key\s*=\s*[^\s&]+/gi, 'key=[REDACTED]');
  }

  const allOperational =
    firebaseAdminStatus === 'Working' &&
    firebaseAuthStatus === 'Working' &&
    firestoreStatus === 'Working' &&
    geminiStatus === 'Working' &&
    cloudinaryStatus === 'Working';

  const anyOperational =
    firebaseAdminStatus === 'Working' ||
    firebaseAuthStatus === 'Working' ||
    firestoreStatus === 'Working' ||
    geminiStatus === 'Working' ||
    cloudinaryStatus === 'Working';

  const overallStatus = allOperational
    ? 'healthy'
    : anyOperational
    ? 'degraded'
    : 'unhealthy';

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp,
      environment: process.env.NODE_ENV || 'production',
      services: {
        firebaseAuthentication: {
          status: firebaseAuthStatus,
          message: firebaseAuthMsg,
        },
        firebaseAdmin: {
          status: firebaseAdminStatus,
          message: firebaseAdminMsg,
        },
        firestore: {
          status: firestoreStatus,
          message: firestoreMsg,
        },
        geminiAPI: {
          status: geminiStatus,
          model: activeModel,
          message: geminiMsg,
        },
        cloudinary: {
          status: cloudinaryStatus,
          message: cloudinaryMsg,
        },
      },
      storagePolicy: {
        firebaseStorageUsed: false,
        mediaProvider: 'Cloudinary (Authenticated Delivery)',
        sparkPlanCompliant: true,
      },
    },
    {
      status: overallStatus === 'healthy' ? 200 : 200, // Return 200 with diagnostics so client can parse status
    }
  );
}
