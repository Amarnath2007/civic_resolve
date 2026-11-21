import { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
}

/**
 * Checks if an email address is authorized as an administrator via the ADMIN_EMAILS environment variable.
 * Requires exact case-insensitive email match.
 */
export function isEmailAdmin(email?: string | null): boolean {
  if (!email) return false;
  const adminEmailsEnv = process.env.ADMIN_EMAILS || 'admin@civicresolve.gov';
  const adminList = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminList.includes(email.trim().toLowerCase());
}

/**
 * Authenticates the incoming request using Firebase ID Token from Authorization header.
 * Verifies authenticity with Firebase Admin SDK and determines administrative privileges
 * strictly through server-side custom claims and the server-side ADMIN_EMAILS allowlist.
 */
export async function authenticateRequest(
  req: NextRequest,
  options: { requireAdmin?: boolean } = {}
): Promise<{ user: AuthenticatedUser | null; error?: string; status?: number }> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: 'Missing or malformed Authorization header. Please sign in.',
      status: 401,
    };
  }

  const token = authHeader.substring(7).trim();
  const { auth, isConfigured } = getFirebaseAdmin();

  let user: AuthenticatedUser | null = null;

  if (token.startsWith('demo-token:') && (process.env.NODE_ENV === 'test' || !isConfigured)) {
    // Synthetic demo token format for unit testing and offline development: demo-token:email:uid
    const parts = token.split(':');
    const email = parts[1] || 'demo@civicresolve.org';
    const uid = parts[2] || 'demo-user-uid';
    const isAdmin = isEmailAdmin(email);
    user = {
      uid,
      email,
      displayName: email.split('@')[0],
      isAdmin,
    };
  } else if (isConfigured && auth) {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const email = decodedToken.email || '';
      const hasAdminClaim = decodedToken.admin === true || decodedToken.role === 'admin';
      const isEmailInAdminList = isEmailAdmin(email);
      const isAdmin = Boolean(hasAdminClaim || isEmailInAdminList);

      user = {
        uid: decodedToken.uid,
        email,
        displayName: decodedToken.name || (email ? email.split('@')[0] : 'User'),
        isAdmin,
      };
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.warn('Firebase ID Token verification error:', errorObj.message);
      return {
        user: null,
        error: 'Invalid or expired authentication session. Please sign in again.',
        status: 401,
      };
    }
  } else {
    return {
      user: null,
      error: 'Server authentication service is temporarily unavailable.',
      status: 503,
    };
  }

  if (!user) {
    return {
      user: null,
      error: 'Authentication failed.',
      status: 401,
    };
  }

  if (options.requireAdmin && !user.isAdmin) {
    return {
      user,
      error: 'Forbidden: Administrative privileges required.',
      status: 403,
    };
  }

  return { user };
}
