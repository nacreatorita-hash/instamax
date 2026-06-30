import type { UserRole } from '../supabase/types';

/**
 * Returns the correct dashboard path for a given user role
 */
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'client':
      return '/dashboard/client';
    case 'professional':
      return '/dashboard/professional';
    case 'company':
      return '/dashboard/company';
    case 'candidate':
      return '/dashboard/candidate';
    default:
      return '/dashboard';
  }
}
