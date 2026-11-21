import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();
    const isAdm = role === 'admin';
    const email = isAdm ? 'admin@civicresolve.gov' : 'citizen@civicresolve.org';
    const password = 'CivicResolve2026!';
    const displayName = isAdm ? 'Municipal Operations Desk' : 'Priya Raman';

    const { auth, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !auth) {
      return NextResponse.json(
        { error: 'Firebase Admin is not configured.' },
        { status: 503 }
      );
    }

    try {
      const existing = await auth.getUserByEmail(email);
      // Ensure password is up to date
      await auth.updateUser(existing.uid, { password, displayName });
      return NextResponse.json({
        success: true,
        uid: existing.uid,
        email,
        displayName,
        created: false,
      });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const created = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true,
        });
        return NextResponse.json({
          success: true,
          uid: created.uid,
          email,
          displayName,
          created: true,
        });
      }
      throw err;
    }
  } catch (err: any) {
    console.error('Provision demo user error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to provision demo user.' },
      { status: 500 }
    );
  }
}
