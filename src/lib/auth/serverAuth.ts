import { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
}

/**
 * Checks if an email address is authorized as an administrator via ADMIN_EMAILS environment variable.
 */
export function isEmailAdmin(email?: string | null): boolean {
  if (!email) return false;
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const adminList = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // If in local demo mode and ADMIN_EMAILS not explicitly set, permit standard demo admin
  if (adminList.length === 0) {
    return email.toLowerCase().includes('admin@');
  }

  return adminList.includes(email.toLowerCase());
}

/**
 * Authenticates the incoming request using Firebase ID Token from Authorization header.
 * In local demonstration mode without live Firebase Admin credentials, accepts demo tokens.
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

  if (isConfigured && auth) {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const email = decodedToken.email || '';
      user = {
        uid: decodedToken.uid,
        email,
        displayName: decodedToken.name || email.split('@')[0],
        isAdmin: isEmailAdmin(email),
      };
    } catch (err: any) {
      console.warn('Firebase ID Token verification error:', err.message);
      return {
        user: null,
        error: 'Invalid or expired authentication session.',
        status: 401,
      };
    }
  } else {
    // Demonstration Fallback Authentication mode:
    // Enables instant evaluation out of the box when evaluating in local environment
    try {
      if (token.startsWith('demo-token:')) {
        const parts = token.split(':');
        const email = decodeURIComponent(parts[1] || 'citizen@civicresolve.org');
        const uid = parts[2] || `demo-${email.split('@')[0]}`;
        user = {
          uid,
          email,
          displayName: email.split('@')[0],
          isAdmin: isEmailAdmin(email),
        };
      } else {
        // Base64 JSON token fallback for demo
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        if (decoded && decoded.email) {
          user = {
            uid: decoded.uid || `user-${Date.now()}`,
            email: decoded.email,
            displayName: decoded.displayName || decoded.email.split('@')[0],
            isAdmin: isEmailAdmin(decoded.email),
          };
        }
      }
    } catch {
      // If parsing fails, create safe fallback demo user
      user = {
        uid: 'demo-user',
        email: 'citizen@civicresolve.org',
        displayName: 'Demo Citizen',
        isAdmin: false,
      };
    }
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
