import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const role = body.role === 'admin' ? 'admin' : 'citizen';
    const isAdm = role === 'admin';

    const email = isAdm
      ? process.env.DEMO_ADMIN_EMAIL || 'admin@civicresolve.gov'
      : process.env.DEMO_CITIZEN_EMAIL || 'citizen@civicresolve.org';
    const password = isAdm
      ? process.env.DEMO_ADMIN_PASSWORD || 'CivicResolve2026!'
      : process.env.DEMO_CITIZEN_PASSWORD || 'CivicResolve2026!';
    const displayName = isAdm ? 'Municipal Operations Desk' : 'Priya Raman';

    const { auth, firestore, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !auth || !firestore) {
      return NextResponse.json(
        { error: 'Firebase Admin is not configured.' },
        { status: 503 }
      );
    }

    let uid: string;
    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      // Ensure credentials and profile are up to date
      await auth.updateUser(uid, { password, displayName });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/user-not-found') {
        const created = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true,
        });
        uid = created.uid;
      } else {
        throw err;
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(uid, {
      role,
      admin: isAdm,
    });

    // Update Firestore user document
    await firestore.collection('users').doc(uid).set({
      uid,
      email,
      displayName,
      role,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      uid,
      email,
      displayName,
      role,
      isAdmin: isAdm,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Provision demo user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to provision demo user.' },
      { status: 500 }
    );
  }
}
