import type { UserProfile, UserRole } from './types';

// Static taxonomy only. User, request, job and chat records come from Supabase.
export const CATEGORIES = [
  'Idraulico', 'Elettricista', 'Fabbro', 'Tecnico caldaie', 'Climatizzatori',
  'Imbianchino', 'Giardiniere', 'Muratore', 'Falegname', 'Impresa pulizie',
];

export const CITIES = ['Angri', 'Salerno', 'Pagani', 'Nocera Inferiore', 'Scafati'];

const emptyProfile = (role: UserRole): UserProfile => ({
  id: '', name: '', email: '', role, phone: '', bio: '', location: '', avatar: '',
});

export const DEFAULT_PROFILES: Record<UserRole, UserProfile> = {
  client: emptyProfile('client'),
  professional: emptyProfile('professional'),
  company: emptyProfile('company'),
  candidate: emptyProfile('candidate'),
};

const prefix = 'handygo_';

export function getStoredState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${prefix}${key}`);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function setStoredState<T>(key: string, value: T) {
  localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
}

export function initializeStorage() {
  // Remove only obsolete presentation data from the original prototype.
  // Authentication/OAuth keys and real Supabase data are deliberately untouched.
  for (const key of ['requests', 'professionals', 'candidates', 'jobs', 'chats', 'notifications']) {
    setStoredState(key, []);
  }
  setStoredState('profiles', DEFAULT_PROFILES);
}
