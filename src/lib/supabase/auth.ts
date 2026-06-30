import { isSupabaseConfigured, supabase } from './client';
import type { Profile, UserRole } from './types';
import { PUBLIC_SITE_URL } from '../navigation';

const requireSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Il servizio di accesso non è momentaneamente disponibile. Riprova tra poco.');
  }
};

// Registrazione con email e password
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
) {
  requireSupabase();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = fullName.trim();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: normalizedName,
        role,
      }
    }
  });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('Registrazione fallita: nessun utente restituito.');
  // profiles, role-specific profiles and the free subscription are created
  // atomically by public.handle_new_user() in schema.sql.
  const profile: Profile = {
    id: user.id, role, full_name: normalizedName, email: normalizedEmail,
    phone: null, avatar_url: null, city: null, province: null,
  };
  return { user, session: data.session, profile };
}

export async function createUserProfile(profile: Profile) {
  requireSupabase();
  const { data, error } = await supabase.from('profiles').insert(profile).select().single();
  if (error) throw error;
  return data as Profile;
}

// Accesso con email e password
export async function signInWithEmail(email: string, password: string) {
  requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Accesso con Google OAuth
export async function signInWithGoogle(role?: UserRole) {
  requireSupabase();
  if (role) {
    localStorage.setItem('handygo_pending_oauth_role', role);
  } else {
    // A normal login must not reuse a role left by an interrupted signup.
    localStorage.removeItem('handygo_pending_oauth_role');
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Do not include a hash route here: Supabase must be able to append and
      // read the PKCE `code` from the real query string on return.
      redirectTo: `${PUBLIC_SITE_URL}/?oauth_callback=google`,
      queryParams: { access_type: 'offline', prompt: 'select_account consent' },
    }
  });

  if (error) throw error;
  return data;
}

export async function completeOAuthOnboarding(role: UserRole) {
  const { data, error } = await supabase.rpc('complete_oauth_onboarding', { requested_role: role });
  if (error) throw error;
  return data as Profile;
}

// Logout
export async function signOut() {
  requireSupabase();
  localStorage.removeItem('handygo_pending_oauth_role');
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;
}

// Ottieni l'utente auth corrente
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

// Ottieni il profilo utente dal DB
export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.rpc('get_my_profile');

  if (error) {
    console.error('Errore nel recupero del profilo:', error);
    return null;
  }
  return data as Profile;
}

// Aggiorna il profilo utente nel DB
export async function updateProfile(userId: string, profileData: Partial<Profile>) {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
  const updated = await getCurrentProfile(userId);
  if (!updated) throw new Error('Profilo aggiornato ma non recuperabile.');
  return updated;
}

export async function changeMyRole(role: UserRole) {
  requireSupabase();
  const { data, error } = await supabase.rpc('change_my_role', { requested_role: role });
  if (error) throw error;
  return data as Profile;
}

// Supporto per il salvataggio dei profili specifici (Professional, Company, Candidate)
export async function getProfessionalProfile(userId: string) {
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) console.error('Professional profile fetch error:', error);
  return data;
}

export async function updateProfessionalProfile(userId: string, profileData: any) {
  const { data, error } = await supabase
    .from('professional_profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCompanyProfile(userId: string) {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) console.error('Company profile fetch error:', error);
  return data;
}

export async function updateCompanyProfile(userId: string, profileData: any) {
  const { data, error } = await supabase
    .from('company_profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCandidateProfile(userId: string) {
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) console.error('Candidate profile fetch error:', error);
  return data;
}

export async function updateCandidateProfile(userId: string, profileData: any) {
  const { data, error } = await supabase
    .from('candidate_profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Recupera informazioni sulla Subscription dell'utente
export async function getSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) console.error('Subscription fetch error:', error);
  return data;
}
