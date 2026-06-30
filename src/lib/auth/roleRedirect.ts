import type { UserRole } from '../supabase/types';
import { APP_ROUTES, buildAppRoute } from '../navigation';

/**
 * Returns the correct dashboard path for a given user role
 */
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'client':
      return buildAppRoute(APP_ROUTES.dashboardClient);
    case 'professional':
      return buildAppRoute(APP_ROUTES.dashboardProfessional);
    case 'company':
      return buildAppRoute(APP_ROUTES.dashboardCompany);
    case 'candidate':
      return buildAppRoute(APP_ROUTES.dashboardCandidate);
    default:
      return buildAppRoute(APP_ROUTES.dashboard);
  }
}
