/**
 * Utility to map Firebase Authentication error codes to clear, actionable human messages.
 */
export function getFirebaseErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const err = error as { code?: string; message?: string };
  const code: string = err.code || (typeof error === 'string' ? error : err.message || '');

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email address or password. Please verify your credentials.';
    case 'auth/user-not-found':
      return 'No CivicResolve account found with this email. Please check your spelling or register.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in or use a different email.';
    case 'auth/invalid-email':
      return 'Invalid email address format. Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled. Please contact support.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for authentication. Please verify Firebase Authorized Domains configuration.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled by an administrator.';
    case 'auth/requires-recent-login':
      return 'Please sign out and sign in again before performing this sensitive operation.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing authentication.';
    default:
      // Strip generic "Firebase: Error (" wrapper if present
      if (typeof err.message === 'string') {
        const match = err.message.match(/Firebase:\s*(?:Error\s*)?\(([^)]+)\)\.?/);
        if (match && match[1]) {
          return getFirebaseErrorMessage({ code: match[1] });
        }
        return err.message;
      }
      return 'Authentication failed. Please check your credentials and try again.';
  }
}
