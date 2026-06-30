import type { NavigateFunction, NavigateOptions } from 'react-router-dom';

export const APP_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  dashboardClient: '/dashboard/client',
  dashboardProfessional: '/dashboard/professional',
  dashboardCompany: '/dashboard/company',
  dashboardCandidate: '/dashboard/candidate',
  requests: '/requests',
  requestNew: '/requests/new',
  chat: '/chat',
  jobs: '/jobs',
  jobNew: '/jobs/new',
  professionals: '/professionals',
  candidates: '/candidates',
  profile: '/profile',
  settings: '/settings',
} as const;

export type AppRoute = string;

export function buildAppRoute(path: AppRoute): string {
  if (!path || path === '/') return APP_ROUTES.home;
  return path.startsWith('/') ? path : `/${path}`;
}

export function buildHashRoute(path: AppRoute): string {
  return `#${buildAppRoute(path)}`;
}

export function buildPublicAppUrl(path: AppRoute): string {
  if (typeof window === 'undefined') return buildHashRoute(path);
  return `${window.location.origin}/${buildHashRoute(path)}`;
}

export function navigateTo(navigate: NavigateFunction, path: AppRoute, options?: NavigateOptions): void {
  navigate(buildAppRoute(path), options);
}
