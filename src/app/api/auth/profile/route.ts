import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const { user } = auth;
    const { firestore, auth: adminAuth, isConfigured } = getFirebaseAdmin();

    if (!isConfigured || !firestore) {
      return NextResponse.json(
        { error: 'Database service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const userRef = firestore.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    let profileData: any;

    if (!userDoc.exists) {
      // Safely initialize the profile in Firestore
      const role = user.isAdmin ? 'admin' : 'citizen';
      profileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await userRef.set(profileData);

      // Ensure custom claims are synchronized
      if (adminAuth) {
        await adminAuth.setCustomUserClaims(user.uid, {
          role,
          admin: user.isAdmin,
        });
      }
    } else {
      profileData = userDoc.data();
    }

    return NextResponse.json({
      success: true,
      profile: {
        uid: user.uid,
        email: user.email,
        displayName: profileData.displayName || user.displayName || user.email.split('@')[0],
        role: user.isAdmin ? 'admin' : 'citizen',
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('API GET /api/auth/profile error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user profile.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const { user } = auth;
    const { firestore, auth: adminAuth, isConfigured } = getFirebaseAdmin();

    if (!isConfigured || !firestore) {
      return NextResponse.json(
        { error: 'Database service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const displayName = (body.displayName || user.displayName || user.email.split('@')[0]).trim();
    const role = user.isAdmin ? 'admin' : 'citizen';

    const userRef = firestore.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName,
      role,
      updatedAt: new Date().toISOString(),
      createdAt: userDoc.exists ? (userDoc.data()?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    // Write profile to Firestore
    await userRef.set(profileData, { merge: true });

    // Synchronize custom claims on Firebase Authentication
    if (adminAuth) {
      await adminAuth.setCustomUserClaims(user.uid, {
        role,
        admin: user.isAdmin,
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        uid: user.uid,
        email: user.email,
        displayName,
        role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('API POST /api/auth/profile error:', error);
    return NextResponse.json(
      { error: 'Failed to synchronize user profile.', details: error.message },
      { status: 500 }
    );
  }
}
